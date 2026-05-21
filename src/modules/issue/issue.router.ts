import express from "express";
import { IssueController } from "./issue.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.post("/", auth("contributor"), IssueController.createIssue);
router.get("/", IssueController.getAllIssues);
router.get("/:id", IssueController.getSingleIssue);
router.patch("/:id", auth("maintainer", "contributor"), IssueController.updateIssue);
router.delete("/:id", auth("maintainer"), IssueController.deleteIssue);

export const IssueRoutes = router;
