import Expense from "../models/Expense.js";
import AuditLog from "../models/AuditLog.js";

// Add an expense
export const addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });

    // Log the creation to AuditLog
    await AuditLog.create({
      action: "Expense Added",
      user: req.user._id,
      targetUser: req.user._id,
      userRole: req.user.role,
      details: `${req.user.name} (${req.user.email}) added a new expense of ₹${expense.amount} for ${expense.category}`,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Add Expense Error:", err.message);
    res.status(400).json({ message: "Failed to add expense" });
  }
};


// Employee: Update own expense
export const updateMyExpense = async (req, res) => {
  try {
    const { amount, category, date, notes } = req.body;

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found or you are not authorized to edit it",
      });
    }

    // Update only allowed employee fields
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    // Log the update
    await AuditLog.create({
      action: "Expense Updated",
      user: req.user._id,
      targetUser: req.user._id,
      userRole: req.user.role,
      details: `${req.user.name} (${req.user.email}) updated expense ₹${expense.amount} for ${expense.category}`,
    });

    res.status(200).json(expense);
  } catch (err) {
    console.error("Update Expense Error:", err.message);
    res.status(400).json({
      message: "Failed to update expense",
    });
  }
};


// Employee: Delete own expense
export const deleteMyExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found or you are not authorized to delete it",
      });
    }

    // Log the deletion
    await AuditLog.create({
      action: "Expense Deleted",
      user: req.user._id,
      targetUser: req.user._id,
      userRole: req.user.role,
      details: `${req.user.name} (${req.user.email}) deleted expense ₹${expense.amount} for ${expense.category}`,
    });

    res.status(200).json({
      message: "Expense deleted successfully",
      expense,
    });
  } catch (err) {
    console.error("Delete Expense Error:", err.message);
    res.status(500).json({
      message: "Failed to delete expense",
    });
  }
};



// Get all expenses for the current user (sorted by expense date descending)
export const getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({
      date: -1,
    });
    res.status(200).json(expenses);
  } catch (err) {
    console.error("Get My Expenses Error:", err.message);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

// Admin: Get all expenses (sorted by expense date descending)
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("user", "name email")
      .sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    console.error("Get All Expenses Error:", err.message);
    res.status(500).json({ message: "Failed to fetch all expenses" });
  }
};

// Admin: Update expense status
export const updateExpenseStatus = async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = ["pending", "approved", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const expense = await Expense.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const prevStatus = expense.status;

    if (prevStatus === status) {
      return res.status(200).json({ message: `Status already '${status}'` });
    }

    expense.status = status;
    await expense.save();

    await AuditLog.create({
      user: req.user._id,
      targetUser: expense.user._id,
      action: `Expense ${status}`,
      userRole: req.user.role,
      details: `Admin ${req.user.email} changed status of expense ₹${expense.amount} from ${prevStatus} to ${status} for user ${expense.user.email}`,
    });

    res.status(200).json({ message: "Expense status updated", expense });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
