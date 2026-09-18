import express from "express";

import {
  setBudget,
  getCurrentBudget,
  updateBudget,
} from "../controllers/budgetController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();


// Set/Create monthly budget
router.post(
  "/",
  protect,
  setBudget
);


// Get current month's budget
router.get(
  "/current",
  protect,
  getCurrentBudget
);


// Update current month's budget
router.put(
  "/current",
  protect,
  updateBudget
);


export default router;