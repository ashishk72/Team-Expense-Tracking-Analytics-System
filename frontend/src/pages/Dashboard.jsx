import { useEffect, useState } from "react";

import {
  getMyExpenses,
  updateExpense,
  deleteExpense,
} from "../api/expense";

import {
  getCurrentBudget,
  setBudget,
  updateBudget,
} from "../api/budget";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";

import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";


const categories = [
  "Travel",
  "Food",
  "Supplies",
  "Entertainment",
  "Other",
];


const Dashboard = () => {

  // =========================
  // Expense State
  // =========================

  const [expenses, setExpenses] = useState([]);

  const [expenseLoading, setExpenseLoading] =
    useState(true);

  const [error, setError] = useState(null);


  // =========================
  // Authentication
  // =========================

  const { user, loading } = useAuth();


  // =========================
  // Edit Expense State
  // =========================

  const [editOpen, setEditOpen] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const [editForm, setEditForm] = useState({
    category: "",
    amount: "",
    date: "",
    notes: "",
  });


  // =========================
  // Budget State
  // =========================

  const [budgetData, setBudgetData] =
    useState(null);

  const [budgetLoading, setBudgetLoading] =
    useState(true);

  const [budgetOpen, setBudgetOpen] =
    useState(false);

  const [budgetAmount, setBudgetAmount] =
    useState("");

  const [budgetSaving, setBudgetSaving] =
    useState(false);


  // =========================
  // Fetch Expenses
  // =========================

  const fetchExpenses = async () => {
    try {

      const res = await getMyExpenses();

      setExpenses(res.data);

    } catch (err) {

      setError("Failed to load expenses");

      toast.error(
        "Failed to load expenses"
      );

    } finally {

      setExpenseLoading(false);

    }
  };


  // =========================
  // Fetch Budget
  // =========================

  const fetchBudget = async () => {

    try {

      setBudgetLoading(true);

      const res = await getCurrentBudget();

      setBudgetData(res.data);

    } catch (err) {

      console.error(
        "Budget Fetch Error:",
        err
      );

      toast.error(
        "Failed to load budget information"
      );

    } finally {

      setBudgetLoading(false);

    }
  };


  // =========================
  // Initial Data Fetch
  // =========================

  useEffect(() => {

    if (!user) return;

    fetchExpenses();

    fetchBudget();

  }, [user]);


  // =========================
  // Open Edit Expense
  // =========================

  const handleEditClick = (expense) => {

    setEditingExpense(expense);

    setEditForm({
      category: expense.category || "",

      amount: expense.amount || "",

      date: expense.date
        ? new Date(expense.date)
            .toISOString()
            .split("T")[0]
        : "",

      notes: expense.notes || "",
    });

    setEditOpen(true);
  };


  // =========================
  // Handle Edit Changes
  // =========================

  const handleEditChange = (e) => {

    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });

  };


  // =========================
  // Update Expense
  // =========================

  const handleUpdate = async () => {

    const amountValue =
      parseFloat(editForm.amount);


    if (
      isNaN(amountValue) ||
      amountValue <= 0
    ) {

      toast.error(
        "Amount must be greater than zero"
      );

      return;
    }


    if (!editForm.category) {

      toast.error(
        "Please select a category"
      );

      return;
    }


    if (!editForm.date) {

      toast.error(
        "Please select a date"
      );

      return;
    }


    try {

      const res = await updateExpense(
        editingExpense._id,
        {
          ...editForm,
          amount: amountValue,
        }
      );


      // Update expense in UI
      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense._id ===
          editingExpense._id
            ? res.data
            : expense
        )
      );


      toast.success(
        "Expense updated successfully"
      );


      setEditOpen(false);

      setEditingExpense(null);


      // Refresh budget because
      // spending may have changed
      await fetchBudget();

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
          "Failed to update expense"
      );

    }

  };


  // =========================
  // Delete Expense
  // =========================

  const handleDelete = async (
    expenseId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );


    if (!confirmed) {

      return;

    }


    try {

      await deleteExpense(expenseId);


      // Remove from UI
      setExpenses((prevExpenses) =>
        prevExpenses.filter(
          (expense) =>
            expense._id !== expenseId
        )
      );


      toast.success(
        "Expense deleted successfully"
      );


      // Refresh budget because
      // monthly spending changed
      await fetchBudget();

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
          "Failed to delete expense"
      );

    }

  };


  // =========================
  // Open Budget Dialog
  // =========================

  const handleOpenBudget = () => {

    if (budgetData?.budget) {

      setBudgetAmount(
        budgetData.budget.amount
      );

    } else {

      setBudgetAmount("");

    }

    setBudgetOpen(true);

  };


  // =========================
  // Save Budget
  // =========================

  const handleSaveBudget = async () => {

    const amount =
      parseFloat(budgetAmount);


    if (
      isNaN(amount) ||
      amount <= 0
    ) {

      toast.error(
        "Budget must be greater than zero"
      );

      return;

    }


    try {

      setBudgetSaving(true);


      let response;


      if (budgetData?.budget) {

        // Existing budget → update
        response =
          await updateBudget(amount);

      } else {

        // No budget → create
        response =
          await setBudget(amount);

      }


      toast.success(
        response.data?.message ||
          "Budget saved successfully"
      );


      setBudgetOpen(false);


      // Fetch latest budget information
      await fetchBudget();

    } catch (err) {

      toast.error(
        err.response?.data?.message ||
          "Failed to save budget"
      );

    } finally {

      setBudgetSaving(false);

    }

  };


  // =========================
  // Loading
  // =========================

  if (
    loading ||
    expenseLoading ||
    budgetLoading
  ) {

    return (

      <Box
        className="flex justify-center items-center min-h-screen"
      >

        <CircularProgress />

      </Box>

    );

  }


  // =========================
  // Budget Calculations
  // =========================

  const hasBudget =
    budgetData?.budget !== null &&
    budgetData?.budget !== undefined;


  const budgetAmountValue =
    budgetData?.budget?.amount || 0;


  const spent =
    budgetData?.spent || 0;


  const remaining =
    budgetData?.remaining ?? 0;


  const percentageUsed =
    budgetData?.percentageUsed || 0;


  // Keep progress bar between 0 and 100
  const progressValue =
    Math.min(
      Math.max(percentageUsed, 0),
      100
    );


  // =========================
  // Render
  // =========================

  return (

    <Box
      className="p-6 bg-gray-100 min-h-screen"
    >

      {/* ================================= */}
      {/* Monthly Budget Section */}
      {/* ================================= */}

      <Card
        sx={{
          marginBottom: 4,
          borderRadius: 2,
        }}
      >

        <CardContent>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: 2,
            }}
          >

            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
              }}
            >
              Monthly Budget
            </Typography>


            <Button
              variant="contained"
              onClick={handleOpenBudget}
            >
              {hasBudget
                ? "Edit Budget"
                : "Set Budget"}
            </Button>

          </Box>


          {hasBudget ? (

            <Box sx={{ marginTop: 3 }}>

              {/* Budget / Spent / Remaining */}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, 1fr)",
                  },
                  gap: 2,
                  marginBottom: 3,
                }}
              >

                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Budget
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    ₹
                    {budgetAmountValue.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>

                </Box>


                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Spent
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    ₹
                    {spent.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>

                </Box>


                <Box>

                  <Typography
                    color="text.secondary"
                  >
                    Remaining
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    ₹
                    {Math.max(
                      remaining,
                      0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </Typography>

                </Box>

              </Box>


              {/* Percentage */}

              <Box sx={{ marginBottom: 2 }}>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 1,
                  }}
                >

                  <Typography>
                    Budget Used
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    {percentageUsed}%
                  </Typography>

                </Box>


                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                  }}
                />

              </Box>


              {/* Alert */}

              {budgetData.alert ===
                "warning" && (

                <Alert
                  severity="warning"
                  sx={{
                    marginTop: 2,
                  }}
                >
                  You have used{" "}
                  <strong>
                    {percentageUsed}%
                  </strong>{" "}
                  of your monthly budget.
                </Alert>

              )}


              {budgetData.alert ===
                "exceeded" && (

                <Alert
                  severity="error"
                  sx={{
                    marginTop: 2,
                  }}
                >
                  Your monthly budget has
                  been exceeded by ₹
                  {Math.abs(
                    remaining
                  ).toLocaleString(
                    "en-IN"
                  )}
                  .
                </Alert>

              )}


              {budgetData.alert ===
                "none" && (

                <Alert
                  severity="success"
                  sx={{
                    marginTop: 2,
                  }}
                >
                  Your spending is within
                  the monthly budget.
                </Alert>

              )}

            </Box>

          ) : (

            <Alert
              severity="info"
              sx={{
                marginTop: 3,
              }}
            >
              You haven't set a monthly
              budget yet. Set one to track
              your spending and receive
              budget alerts.
            </Alert>

          )}

        </CardContent>

      </Card>


      {/* ================================= */}
      {/* My Expenses */}
      {/* ================================= */}

      <Typography
        variant="h5"
        gutterBottom
        align="center"
        sx={{
          fontWeight: "bold",
        }}
      >
        My Expenses
      </Typography>


      {error ? (

        <Alert severity="error">
          {error}
        </Alert>

      ) : expenses.length === 0 ? (

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >

          <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
            }}
          >
            No expenses found.
          </Typography>

        </Box>

      ) : (

        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
        >

          {expenses.map((expense) => (

            <Card
              key={expense._id}
            >

              <CardContent>

                <Typography
                  variant="h6"
                  gutterBottom
                >
                  {expense.category}
                </Typography>


                <Typography>
                  Amount: ₹
                  {expense.amount}
                </Typography>


                <Typography>
                  Date:{" "}
                  {new Date(
                    expense.date
                  ).toLocaleDateString()}
                </Typography>


                {expense.notes && (

                  <Typography
                    color="textSecondary"
                  >
                    Note: {expense.notes}
                  </Typography>

                )}


                {/* Edit/Delete buttons */}

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    marginTop: 2,
                  }}
                >

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      handleEditClick(
                        expense
                      )
                    }
                  >
                    Edit
                  </Button>


                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() =>
                      handleDelete(
                        expense._id
                      )
                    }
                  >
                    Delete
                  </Button>

                </Box>

              </CardContent>

            </Card>

          ))}

        </div>

      )}


      {/* ================================= */}
      {/* Edit Expense Dialog */}
      {/* ================================= */}

      <Dialog
        open={editOpen}
        onClose={() =>
          setEditOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>
          Edit Expense
        </DialogTitle>


        <DialogContent>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginTop: 1,
            }}
          >

            <TextField
              select
              label="Category"
              name="category"
              value={editForm.category}
              onChange={
                handleEditChange
              }
              fullWidth
              required
            >

              {categories.map(
                (cat) => (

                  <MenuItem
                    key={cat}
                    value={cat}
                  >
                    {cat}
                  </MenuItem>

                )
              )}

            </TextField>


            <TextField
              label="Amount (INR)"
              type="number"
              name="amount"
              value={editForm.amount}
              onChange={
                handleEditChange
              }
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  min: 1,
                },
              }}
            />


            <TextField
              label="Date"
              type="date"
              name="date"
              value={editForm.date}
              onChange={
                handleEditChange
              }
              fullWidth
              required
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />


            <TextField
              label="Notes"
              name="notes"
              value={editForm.notes}
              onChange={
                handleEditChange
              }
              fullWidth
              multiline
              rows={3}
            />

          </Box>

        </DialogContent>


        <DialogActions>

          <Button
            onClick={() =>
              setEditOpen(false)
            }
          >
            Cancel
          </Button>


          <Button
            variant="contained"
            onClick={handleUpdate}
          >
            Save Changes
          </Button>

        </DialogActions>

      </Dialog>


      {/* ================================= */}
      {/* Monthly Budget Dialog */}
      {/* ================================= */}

      <Dialog
        open={budgetOpen}
        onClose={() =>
          !budgetSaving &&
          setBudgetOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>
          {hasBudget
            ? "Edit Monthly Budget"
            : "Set Monthly Budget"}
        </DialogTitle>


        <DialogContent>

          <Typography
            color="text.secondary"
            sx={{
              marginBottom: 2,
              marginTop: 1,
            }}
          >
            Set your spending limit for
            the current month.
          </Typography>


          <TextField
            label="Monthly Budget (INR)"
            type="number"
            value={budgetAmount}
            onChange={(e) =>
              setBudgetAmount(
                e.target.value
              )
            }
            fullWidth
            required
            autoFocus
            slotProps={{
              htmlInput: {
                min: 1,
              },
            }}
          />

        </DialogContent>


        <DialogActions>

          <Button
            onClick={() =>
              setBudgetOpen(false)
            }
            disabled={budgetSaving}
          >
            Cancel
          </Button>


          <Button
            variant="contained"
            onClick={handleSaveBudget}
            disabled={budgetSaving}
          >
            {budgetSaving
              ? "Saving..."
              : "Save Budget"}
          </Button>

        </DialogActions>

      </Dialog>

    </Box>

  );

};


export default Dashboard;