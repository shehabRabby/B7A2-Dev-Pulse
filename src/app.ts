import express, { type Application, type Request, type Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";


const app: Application = express();

// পার্সার মিডলওয়্যার
app.use(express.json());
app.use(express.text());

// টেস্ট রাউট
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Server on now",
    author: "Shehab Al Rabby",
  });
});

// অ্যাপ্লিকেশন রাউটস (পরবর্তীতে এখানে আমরা মডিউলের রাউটারগুলো যুক্ত করব)
// app.use("/api/auth", UserRoutes);

// গ্লোবাল এরর হ্যান্ডলিং মিডলওয়্যার (সব রাউটের নিচে থাকবে)
app.use(globalErrorHandler);

export default app;