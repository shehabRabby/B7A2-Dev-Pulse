import { type Request, type Response, type NextFunction } from "express";
import { IssueServices } from "./issue.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

const createIssue = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const issueData = req.body;

    // login user id from token
    const creatorId = req.user?.id;

    if (
      !issueData.title ||
      !issueData.description ||
      !issueData.type ||
      !issueData.priority
    ) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Title, description, type, and priority are required fields.",
      });
      return;
    }

    const fullPayload = {
      ...issueData,
      creator_id: creatorId,
    };

    const result = await IssueServices.createIssueIntoDB(fullPayload);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const IssueController = {
  createIssue,
};
