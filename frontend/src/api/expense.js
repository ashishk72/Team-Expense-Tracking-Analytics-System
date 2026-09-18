import api from "./axios";

export const createExpense = (data) =>
  api.post("/expenses", data);

export const getMyExpenses = () =>
  api.get("/expenses/my");

export const getAllExpenses = () =>
  api.get("/expenses");

export const updateExpenseStatus = (id, status) =>
  api.patch(`/expenses/${id}/status`, { status });

// Update employee's own expense
export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

// Delete employee's own expense
export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);