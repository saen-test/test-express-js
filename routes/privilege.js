import express from "express";
const router = express.Router();
import {
  getAllCategory,
  getCategory,
  getPrivilegeInfo,
  getPrivilegeCompact,
  getActivityCategory,
  getActivityCampaign,
  getActivityContent,
} from "../controller/privilege-controller.js";

router.post("/get-all-category", getAllCategory);
router.post("/get-category", getCategory);
router.post("/get-privilege-details", getPrivilegeInfo);
router.post("/get-product-list", getPrivilegeCompact);
router.post("/get-activity-category", getActivityCategory);
router.post("/get-activity-campaign", getActivityCampaign);
router.post("/get-activity-content", getActivityContent);

export default router;
