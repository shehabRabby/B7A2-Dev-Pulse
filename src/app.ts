import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { UserRoutes } from "./modules/user/user.router";
import { IssueRoutes } from "./modules/issue/issue.router";

const app: Application = express();

// parser middleware
app.use(express.json());
app.use(express.text());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server on now",
    author: "Devloper Shehab",
  });
});

// all routes
app.use("/api/auth", UserRoutes);
app.use("/api/issues", IssueRoutes);

app.use(globalErrorHandler);

export default app;
