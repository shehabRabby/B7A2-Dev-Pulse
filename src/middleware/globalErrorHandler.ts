import { type Request, type Response, type NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Something went wrong!!";
  const errors = err.errors || null;

  res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
  });
};

export default globalErrorHandler;
