import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/HttpError.js";

const validRoles = ["TANK", "FIGHTER", "ASSASSIN", "MAGE", "MARKSMAN", "SUPPORT"];
const validLanes = ["EXP", "GOLD", "MID", "JUNGLE", "ROAM"];

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function getHeroes(req: Request, res: Response, next: NextFunction) {
  try {
    const page = positiveInt(req.query.page, 1);
    const limit = Math.min(positiveInt(req.query.limit, 10), 100);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role.toUpperCase() : "";

    if (role && !validRoles.includes(role)) {
      throw new HttpError(400, "Role tidak valid");
    }

    const where: Prisma.HeroWhereInput = {
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(role ? { role: role as (typeof validRoles)[number] } : {})
    };

    const [heroes, totalItems] = await Promise.all([
      prisma.hero.findMany({
        where,
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.hero.count({ where })
    ]);

    res.json({
      status: true,
      message: "Berhasil mengambil data hero",
      data: heroes,
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

export async function getHeroById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.hero_id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "ID hero tidak valid");

    const hero = await prisma.hero.findUnique({
      where: { id },
      include: { skins: true }
    });
    if (!hero) throw new HttpError(404, "Hero tidak ditemukan");

    res.json({ status: true, message: "Berhasil mengambil detail hero", data: hero });
  } catch (error) {
    next(error);
  }
}

export async function createHero(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body ?? {};

    if (
      typeof name !== "string" || !name.trim() ||
      typeof role !== "string" || !role.trim() ||
      typeof lane !== "string" || !lane.trim() ||
      releaseYear === undefined || releaseYear === null || releaseYear === ""
    ) {
      throw new HttpError(400, "name, role, lane, dan releaseYear wajib diisi");
    }

    const normalizedRole = role.toUpperCase();
    const normalizedLane = lane.toUpperCase();
    if (!validRoles.includes(normalizedRole)) throw new HttpError(400, "Role tidak valid");
    if (!validLanes.includes(normalizedLane)) throw new HttpError(400, "Lane tidak valid");

    const year = Number(releaseYear);
    if (!Number.isInteger(year)) throw new HttpError(400, "releaseYear harus berupa bilangan bulat");

    for (const [field, value] of [["priceBP", priceBP], ["priceDiamond", priceDiamond]] as const) {
      if (value !== undefined && value !== null && (!Number.isInteger(value) || value < 0)) {
        throw new HttpError(400, `${field} harus bilangan bulat positif atau null`);
      }
    }

    const existing = await prisma.hero.findUnique({ where: { name: name.trim() } });
    if (existing) throw new HttpError(409, "Nama hero sudah digunakan");

    const hero = await prisma.hero.create({
      data: {
        name: name.trim(),
        role: normalizedRole as (typeof validRoles)[number],
        lane: normalizedLane as (typeof validLanes)[number],
        releaseYear: year,
        priceBP: priceBP ?? null,
        priceDiamond: priceDiamond ?? null
      }
    });

    res.status(201).json({ status: true, message: "Hero berhasil ditambahkan", data: hero });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      next(new HttpError(409, "Nama hero sudah digunakan"));
      return;
    }
    next(error);
  }
}