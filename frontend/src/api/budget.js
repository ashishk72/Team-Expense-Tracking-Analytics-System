import api from "./axios";

// Create or update monthly budget
export const setBudget = (amount) =>
  api.post("/budgets", { amount });

// Get current month's budget and spending
export const getCurrentBudget = () =>
  api.get("/budgets/current");

// Update current month's budget
export const updateBudget = (amount) =>
  api.put("/budgets/current", { amount });