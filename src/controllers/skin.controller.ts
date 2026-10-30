import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/HttpError.js";

const validRarities = ["COMMON", "EXCEPTIONAL", "DELUXE", "EXQUISITE", "GRAND", "SUPREME"];

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function getSkins(req: Request, res: Response, next: NextFunction) {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = Math.min(positiveInt(req.query.limit, 10), 100);
    const heroIdRaw = req.query.heroId;
    const rarity = typeof req.query.rarity === "string" ? req.query.rarity.toUpperCase() : "";

    const where: Prisma.SkinWhereInput = {};

    if (heroIdRaw !== undefined) {
      const heroId = Number(heroIdRaw);
      if (!Number.isInteger(heroId) || heroId <= 0) throw new HttpError(400, "heroId tidak valid");
      where.heroId = heroId;
    }

    if (rarity) {
      if (!validRarities.includes(rarity)) throw new HttpError(400, "Rarity tidak valid");
      where.rarity = rarity as (typeof validRarities)[number];
    }

    const [skins, totalItems] = await Promise.all([
      prisma.skin.findMany({
        where,
        include: { hero: true },
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.skin.count({ where })
    ]);

    res.json({
      status: true,
      message: "Berhasil mengambil data skin",
      data: skins,
      metadata: {
        currentPage: page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSkinById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.skin_id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID skin tidak valid");

    const skin = await prisma.skin.findUnique({
      where: { id },
      include: { hero: true }
    });
    if (!skin) throw new HttpError(404, "Skin tidak ditemukan");

    res.json({ status: true, message: "Berhasil mengambil detail skin", data: skin });
  } catch (error) {
    next(error);
  }
}