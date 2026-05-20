import { type Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

const sendResponse = <T>(res: Response, ObjectData: TResponse<T>) => {
  res.status(ObjectData.statusCode).json({
    success: ObjectData.success,
    message: ObjectData.message,
    data: ObjectData.data,
  });
};

export default sendResponse;