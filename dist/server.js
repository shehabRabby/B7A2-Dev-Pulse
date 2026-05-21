
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
        

// src/app.ts
import express3 from "express";
import cors from "cors";

// src/middleware/globalErrorHandler.ts
import "express";
import { StatusCodes } from "http-status-codes";
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Something went wrong!!";
  const errors = err.errors || null;
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/user/user.router.ts
import express from "express";

// src/modules/user/user.controller.ts
import "express";

// src/modules/user/user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT || 5e3,
  connection_string: process.env.CONNECTION_STRING,
  jwt_secret: process.env.JWT_SECRET || "super_secret_key_for_devpulse_2026",
  jwt_expires_in: process.env.JWT_EXPIRES_IN || "1d"
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'contributor' NOT NULL CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await pool.query(`
  CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
    status VARCHAR(50) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
};

// src/modules/user/user.service.ts
var createUserIntoDB = async (userData) => {
  const { name, email, password, role } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const queryText = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at;
  `;
  const values = [name, email, hashedPassword, role || "contributor"];
  const result = await pool.query(queryText, values);
  return result.rows[0];
};
var loginUserFromDB = async (loginData) => {
  const { email, password } = loginData;
  const result = await pool.query(
    `
    SELECT * FROM users WHERE email = $1;`,
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: config_default.jwt_expires_in
  });
  delete user.password;
  return {
    token,
    user
  };
};
var UserServices = {
  createUserIntoDB,
  loginUserFromDB
};

// src/utils/sendResponse.ts
import "express";
var sendResponse = (res, ObjectData) => {
  res.status(ObjectData.statusCode).json({
    success: ObjectData.success,
    message: ObjectData.message,
    data: ObjectData.data
  });
};
var sendResponse_default = sendResponse;

// src/modules/user/user.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var registerUser = async (req, res, next) => {
  try {
    const userData = req.body;
    if (!userData.email || !userData.password || !userData.name) {
      res.status(StatusCodes2.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Name, email, and password are required in this fields."
      });
      return;
    }
    const result = await UserServices.createUserIntoDB(userData);
    sendResponse_default(res, {
      statusCode: StatusCodes2.CREATED,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    if (error.code === "23505") {
      res.status(StatusCodes2.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Email already exists."
      });
      return;
    }
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  try {
    const loginData = req.body;
    if (!loginData.email || !loginData.password) {
      res.status(StatusCodes2.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Email and password are required."
      });
      return;
    }
    const result = await UserServices.loginUserFromDB(loginData);
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    if (error.message === "Invalid email or password") {
      res.status(StatusCodes2.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "Invalid email or password"
      });
      return;
    }
    next(error);
  }
};
var UserController = {
  registerUser,
  loginUser
};

// src/modules/user/user.router.ts
var router = express.Router();
router.post("/signup", UserController.registerUser);
router.post("/login", UserController.loginUser);
var UserRoutes = router;

// src/modules/issue/issue.router.ts
import express2 from "express";

// src/modules/issue/issue.controller.ts
import "express";

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload) => {
  const queryText = `
    INSERT INTO issues (title, description, type, creator_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [
    payload.title,
    payload.description,
    payload.type,
    payload.creator_id
  ];
  const result = await pool.query(queryText, values);
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort, type, status } = query;
  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const queryParams = [];
  let paramCounter = 1;
  if (type) {
    queryText += ` AND type = $${paramCounter}`;
    queryParams.push(type);
    paramCounter++;
  }
  if (status) {
    queryText += ` AND status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }
  if (sort === "oldest") {
    queryText += ` ORDER BY created_at ASC;`;
  } else {
    queryText += ` ORDER BY created_at DESC;`;
  }
  const issueResult = await pool.query(queryText, queryParams);
  const issues = issueResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const creatorIds = [...new Set(issues.map((issue) => issue.creator_id))];
  const placeholders = creatorIds.map((_, index) => `$${index + 1}`).join(", ");
  const userQueryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;
  const userResult = await pool.query(userQueryText, creatorIds);
  const users = userResult.rows;
  const userMap = {};
  users.forEach((user) => {
    userMap[user.id] = user;
  });
  const finalIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap[issue.creator_id] ? {
      id: userMap[issue.creator_id].id,
      name: userMap[issue.creator_id].name,
      role: userMap[issue.creator_id].role
    } : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return finalIssues;
};
var getSingleIssueFromDB = async (id) => {
  const queryText = `SELECT * FROM issues WHERE id = $1;`;
  const result = await pool.query(queryText, [id]);
  const issue = result.rows[0];
  if (!issue) {
    return null;
  }
  const userQueryText = `SELECT id, name, role FROM users WHERE id = $1;`;
  const userResult = await pool.query(userQueryText, [issue.creator_id]);
  const user = userResult.rows[0];
  const formattedIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user ? {
      id: user.id,
      name: user.name,
      role: user.role
    } : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
  return formattedIssue;
};
var updateIssueInDB = async (issueId, user, payload) => {
  const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [
    issueId
  ]);
  if (issueCheck.rows.length === 0) {
    return { errorType: "ISSUE_NOT_FOUND", data: null };
  }
  const issue = issueCheck.rows[0];
  if (user.role === "contributor") {
    if (issue.creator_id === user.id) {
      if (issue.status !== "open") {
        return { errorType: "ISSUE_NOT_OPEN", data: null };
      }
      if (payload.status) {
        return { errorType: "UNAUTHORIZED_ACTION", data: null };
      }
    } else {
      return { errorType: "UNAUTHORIZED_ACTION", data: null };
    }
  }
  const fields = [];
  const values = [];
  let paramCounter = 1;
  if (payload.title) {
    fields.push(`title = $${paramCounter}`);
    values.push(payload.title);
    paramCounter++;
  }
  if (payload.description) {
    fields.push(`description = $${paramCounter}`);
    values.push(payload.description);
    paramCounter++;
  }
  if (payload.type) {
    fields.push(`type = $${paramCounter}`);
    values.push(payload.type);
    paramCounter++;
  }
  if (payload.status && user.role === "maintainer") {
    fields.push(`status = $${paramCounter}`);
    values.push(payload.status);
    paramCounter++;
  }
  if (fields.length === 0) {
    return { errorType: "NO_DATA_PROVIDED", data: null };
  }
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  const queryText = `
    UPDATE issues 
    SET ${fields.join(", ")}
    WHERE id = $${paramCounter}
    RETURNING *;
  `;
  values.push(issueId);
  const result = await pool.query(queryText, values);
  return { errorType: null, data: result.rows[0] };
};
var deleteIssueFromDB = async (issueId) => {
  const queryText = `
    DELETE FROM issues 
    WHERE id = $1 
    RETURNING id;
  `;
  const result = await pool.query(queryText, [issueId]);
  if (result.rows.length === 0) {
    return false;
  }
  return true;
};
var IssueServices = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var createIssue = async (req, res, next) => {
  try {
    const issueData = req.body;
    const creatorId = req.user?.id;
    if (!issueData.title || !issueData.description || !issueData.type) {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Title, description, and type are required fields."
      });
      return;
    }
    if (issueData.title.length > 150) {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Title cannot exceed 150 characters."
      });
      return;
    }
    if (issueData.description.length < 20) {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Description must be at least 20 characters long."
      });
      return;
    }
    const fullPayload = {
      title: issueData.title,
      description: issueData.description,
      type: issueData.type,
      creator_id: creatorId
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
      updated_at: dbResult.updated_at
    };
    sendResponse_default(res, {
      statusCode: StatusCodes3.CREATED,
      success: true,
      message: "Issue created successfully",
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await IssueServices.getAllIssuesFromDB(query);
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await IssueServices.getSingleIssueFromDB(id);
    if (!result) {
      res.status(StatusCodes3.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
        errors: `Issue with ID ${id} does not exist.`
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const loggedInUser = req.user;
    if (!loggedInUser) {
      res.status(StatusCodes3.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "User information missing from request."
      });
      return;
    }
    if (updateData.title && updateData.title.length > 150) {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Title cannot exceed 150 characters."
      });
      return;
    }
    if (updateData.description && updateData.description.length < 20) {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Description must be at least 20 characters long."
      });
      return;
    }
    const result = await IssueServices.updateIssueInDB(
      id,
      loggedInUser,
      updateData
    );
    if (result.errorType === "ISSUE_NOT_FOUND") {
      res.status(StatusCodes3.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
        errors: `Issue with ID ${id} does not exist.`
      });
      return;
    }
    if (result.errorType === "UNAUTHORIZED_ACTION") {
      res.status(StatusCodes3.FORBIDDEN).json({
        success: false,
        message: "Forbidden access",
        errors: "You can only update your own issues."
      });
      return;
    }
    if (result.errorType === "ISSUE_NOT_OPEN") {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Action not allowed",
        errors: "Contributors can only update issues when the status is 'open'."
      });
      return;
    }
    if (result.errorType === "NO_DATA_PROVIDED") {
      res.status(StatusCodes3.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: "Please provide at least one field (title, description, or type) to update."
      });
      return;
    }
    const dbData = result.data;
    if (!dbData) {
      res.status(StatusCodes3.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal Server Error",
        errors: "Failed to retrieve updated data."
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
      updated_at: dbData.updated_at
    };
    sendResponse_default(res, {
      statusCode: StatusCodes3.OK,
      success: true,
      message: "Issue updated successfully",
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDeleted = await IssueServices.deleteIssueFromDB(id);
    if (!isDeleted) {
      res.status(StatusCodes3.NOT_FOUND).json({
        success: false,
        message: "Resource not found",
        errors: `Issue with ID ${id} does not exist.`
      });
      return;
    }
    res.status(StatusCodes3.OK).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var IssueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import "express";
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes4 } from "http-status-codes";
var auth = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(StatusCodes4.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed",
          errors: "You are not authorized to access this route. Token missing."
        });
        return;
      }
      let token;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = authHeader;
      }
      if (!token || token.trim() === "") {
        res.status(StatusCodes4.UNAUTHORIZED).json({
          success: false,
          message: "Authentication failed",
          errors: "Invalid token format."
        });
        return;
      }
      const decoded = jwt2.verify(token, config_default.jwt_secret);
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        res.status(StatusCodes4.FORBIDDEN).json({
          success: false,
          message: "Forbidden access",
          errors: "You do not have permission to perform this action."
        });
        return;
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(StatusCodes4.UNAUTHORIZED).json({
        success: false,
        message: "Authentication failed",
        errors: "Invalid or expired token."
      });
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.router.ts
var router2 = express2.Router();
router2.post("/", auth_default("contributor"), IssueController.createIssue);
router2.get("/", IssueController.getAllIssues);
router2.get("/:id", IssueController.getSingleIssue);
router2.patch("/:id", auth_default("maintainer", "contributor"), IssueController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), IssueController.deleteIssue);
var IssueRoutes = router2;

// src/app.ts
var app = express3();
app.use(cors({ origin: "*" }));
app.use(express3.json());
app.use(express3.text());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server on now",
    author: "Devloper Shehab"
  });
});
app.use("/api/auth", UserRoutes);
app.use("/api/issues", IssueRoutes);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map