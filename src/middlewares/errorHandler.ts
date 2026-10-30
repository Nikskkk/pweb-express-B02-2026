import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ status: false, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan pada server"
  });
}