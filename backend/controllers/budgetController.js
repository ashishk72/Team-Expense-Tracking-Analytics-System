import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import AuditLog from "../models/AuditLog.js";


// Get current month and year
const getCurrentMonthYear = () => {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};


// Calculate total expenses for a particular month
const getMonthlySpent = async (
  userId,
  month,
  year
) => {
  const startDate = new Date(
    year,
    month - 1,
    1
  );

  const endDate = new Date(
    year,
    month,
    1
  );

  const result = await Expense.aggregate([
    {
      $match: {
        user: userId,
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },

    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  return result.length > 0
    ? result[0].total
    : 0;
};


// Create or set monthly budget
export const setBudget = async (req, res) => {
  try {
    const {
      amount,
      month,
      year,
    } = req.body;

    const current = getCurrentMonthYear();

    const budgetMonth =
      month || current.month;

    const budgetYear =
      year || current.year;


    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message:
          "Budget amount must be greater than zero",
      });
    }


    if (
      budgetMonth < 1 ||
      budgetMonth > 12
    ) {
      return res.status(400).json({
        message: "Invalid month",
      });
    }


    if (!budgetYear || budgetYear < 2000) {
      return res.status(400).json({
        message: "Invalid year",
      });
    }


    // Create or update existing budget
    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        month: budgetMonth,
        year: budgetYear,
      },
      {
        user: req.user._id,
        month: budgetMonth,
        year: budgetYear,
        amount: Number(amount),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );


    // Audit log
    await AuditLog.create({
      action: "Budget Updated",
      user: req.user._id,
      targetUser: req.user._id,
      userRole: req.user.role,
      details: `${req.user.name} (${req.user.email}) set monthly budget of ₹${budget.amount} for ${budgetMonth}/${budgetYear}`,
    });


    res.status(200).json({
      message: "Budget saved successfully",
      budget,
    });

  } catch (err) {
    console.error(
      "Set Budget Error:",
      err.message
    );

    res.status(500).json({
      message: "Failed to save budget",
    });
  }
};


// Get current month's budget and spending information
export const getCurrentBudget = async (
  req,
  res
) => {
  try {
    const {
      month,
      year,
    } = getCurrentMonthYear();


    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
    });


    const spent = await getMonthlySpent(
      req.user._id,
      month,
      year
    );


    const budgetAmount = budget
      ? budget.amount
      : 0;


    const remaining =
      budgetAmount - spent;


    const percentageUsed =
      budgetAmount > 0
        ? (spent / budgetAmount) * 100
        : 0;


    let alert = "none";

    if (budgetAmount > 0) {
      if (percentageUsed >= 100) {
        alert = "exceeded";
      } else if (percentageUsed >= 80) {
        alert = "warning";
      }
    }


    res.status(200).json({
      budget,
      spent,
      remaining,
      percentageUsed: Number(
        percentageUsed.toFixed(2)
      ),
      alert,
      month,
      year,
    });

  } catch (err) {
    console.error(
      "Get Budget Error:",
      err.message
    );

    res.status(500).json({
      message:
        "Failed to fetch budget information",
    });
  }
};


// Update current month's budget
export const updateBudget = async (
  req,
  res
) => {
  try {
    const {
      amount,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message:
          "Budget amount must be greater than zero",
      });
    }


    const {
      month,
      year,
    } = getCurrentMonthYear();


    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        month,
        year,
      },
      {
        amount: Number(amount),
      },
      {
        new: true,
        runValidators: true,
      }
    );


    if (!budget) {
      return res.status(404).json({
        message:
          "No budget found for the current month",
      });
    }


    await AuditLog.create({
      action: "Budget Updated",
      user: req.user._id,
      targetUser: req.user._id,
      userRole: req.user.role,
      details: `${req.user.name} (${req.user.email}) updated monthly budget to ₹${budget.amount} for ${month}/${year}`,
    });


    res.status(200).json({
      message:
        "Budget updated successfully",
      budget,
    });

  } catch (err) {
    console.error(
      "Update Budget Error:",
      err.message
    );

    res.status(500).json({
      message:
        "Failed to update budget",
    });
  }
};