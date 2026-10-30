import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/HttpError.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`));
}