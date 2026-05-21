import { type Request, type Response, type NextFunction } from "express";
import jwt, { type Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config/index.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

const auth = (...requiredRoles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // check token header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed",
          errors: "You are not authorized to access this route. Token missing.",
        });
        return;
      }

      // Bearer token 
      let token: string | undefined;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = authHeader;
      }

      if (!token || token.trim() === "") {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed",
          errors: "Invalid token format.",
        });
        return;
      }

      // verify token
      const decoded = jwt.verify(token, config.jwt_secret as Secret) as {
        id: number;
        name: string;
        role: string;
      };

      // check role
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Forbidden access",
          errors: "You do not have permission to perform this action.",
        });
        return;
      }

      // assign decoded user to request
      req.user = decoded;

      next();
    } catch (error) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "Invalid or expired token.",
      });
    }
  };
};

export default auth;
