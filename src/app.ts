import express from "express";
import heroRoutes from "./routes/hero.routes.js";
import skinRoutes from "./routes/skin.routes.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());
app.use(logger);

app.get("/health", (_req, res) => {
  res.json({ status: true, message: "Server berjalan dengan baik" });
});

app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;