import express from "express";
import { IssueController } from "./issue.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.post("/", auth("contributor"), IssueController.createIssue);

export const IssueRoutes = router;
