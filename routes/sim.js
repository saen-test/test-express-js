import express from "express";
import { getSimCategoryLists } from "../controller/sim-controller.js";

const router = express.Router();
router.post("/category-lists", getSimCategoryLists);

export default router;
