import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";


const app: Application = express();

// parser middleware
app.use(express.json());
app.use(express.text());

// Normal testing
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server on now",
    author: "Shehab Al Rabby",
  });
});

// Application all routes here
// app.use("/api/auth", UserRoutes);

// handle all global error
app.use(globalErrorHandler);

export default app;