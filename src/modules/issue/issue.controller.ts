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

    const dbResult = await IssueServices.createIssueIntoDB(fullPayload);

    const formattedData = {
      id: dbResult.id,
      title: dbResult.title,
      description: dbResult.description,
      type: dbResult.type,
      status: dbResult.status,
      reporter_id: dbResult.creator_id,
      created_at: dbResult.created_at,
      updated_at: dbResult.updated_at,
    };

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query;

    const result = await IssueServices.getAllIssuesFromDB(query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const result = await IssueServices.getSingleIssueFromDB(id as string);

    if (!result) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
        errors: `Issue with ID ${id} does not exist.`,
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const loggedInUser = (req as any).user;

    if (!loggedInUser) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "User information missing from request.",
      });
      return;
    }

    const result = await IssueServices.updateIssueInDB(
      id as string,
      loggedInUser,
      updateData,
    );

    if (result.errorType === "ISSUE_NOT_FOUND") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
        errors: `Issue with ID ${id} does not exist.`,
      });
      return;
    }

    if (result.errorType === "UNAUTHORIZED_ACTION") {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Forbidden access",
        errors: "You can only update your own issues.",
      });
      return;
    }

    if (result.errorType === "ISSUE_NOT_OPEN") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Action not allowed",
        errors:
          "Contributors can only update issues when the status is 'open'.",
      });
      return;
    }

    if (result.errorType === "NO_DATA_PROVIDED") {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors:
          "Please provide at least one field (title, description, or type) to update.",
      });
      return;
    }

    const dbData = result.data;

    if (!dbData) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        errors: "Failed to retrieve updated data.",
      });
      return;
    }

    const formattedData = {
      id: dbData.id,
      title: dbData.title,
      description: dbData.description,
      type: dbData.type,
      status: dbData.status,
      reporter_id: dbData.creator_id,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
    };

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully",
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

export const IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
