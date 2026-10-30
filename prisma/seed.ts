
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { readFile } from "node:fs/promises";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur di file .env");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Membaca satu baris CSV, termasuk nilai yang memiliki tanda kutip.
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  result.push(value.trim());
  return result;
}

// Membaca file CSV dan mengubahnya menjadi array object.
async function readCSV(path: string): Promise<Record<string, string>[]> {
  const content = await readFile(path, "utf8");

  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);

    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    return record;
  });
}

function requiredString(value: string, field: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Field ${field} tidak boleh kosong`);
  }

  return value.trim();
}

function nullableInt(value: string): number | null {
  if (!value || !value.trim()) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    return null;
  }

  return number;
}

async function main() {
  console.log("Membaca dataset CSV...");

  const heroes = await readCSV("data/heroes.csv");
  const skins = await readCSV("data/skins.csv");

  console.log(`Jumlah Hero ditemukan: ${heroes.length}`);
  console.log(`Jumlah Skin ditemukan: ${skins.length}`);

  if (heroes.length !== 133 || skins.length !== 892) {
    throw new Error("Jumlah dataset tidak sesuai target!");
  }

  console.log("Menghapus data lama...");

  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE'
  );

  console.log("Memasukkan data Hero...");

  await prisma.hero.createMany({
    data: heroes.map((hero) => ({
      name: requiredString(hero.name, "name"),
      role: requiredString(hero.primaryRole, "primaryRole") as never,
      lane: requiredString(hero.primaryLane, "primaryLane") as never,
      releaseYear: Number(hero.releaseYear),
      priceBP: nullableInt(hero.priceBP),
      priceDiamond: nullableInt(hero.priceDiamond)
    }))
  });

  console.log("Memasukkan data Skin...");

  await prisma.skin.createMany({
    data: skins.map((skin) => ({
      name: requiredString(skin.name, "name"),
      heroId: Number(skin.heroId),
      rarity: requiredString(skin.rarity, "rarity") as never,
      priceDiamond: nullableInt(skin.priceDiamond)
    }))
  });

  console.log("Memasukkan data Player...");

  await prisma.player.createMany({
    data: [
      {
        nickname: "ArekITS",
        bp: 1500,
        diamond: 75
      },
      {
        nickname: "SangPushRank",
        bp: 13000,
        diamond: 2892
      },
      {
        nickname: "MageSurabaya",
        bp: 10000,
        diamond: 0
      }
    ]
  });

  console.log("Memasukkan data kepemilikan Hero...");

  await prisma.playerHero.createMany({
    data: [
      {
        playerId: 1,
        heroId: 18,
        currency: "BP",
        pricePaid: 2000
      },
      {
        playerId: 1,
        heroId: 1,
        currency: "BP",
        pricePaid: 10800
      },
      {
        playerId: 2,
        heroId: 84,
        currency: "DIAMOND",
        pricePaid: 599
      },
      {
        playerId: 2,
        heroId: 56,
        currency: "BP",
        pricePaid: 32000
      }
    ]
  });

  const [heroCount, skinCount, playerCount, playerHeroCount] =
    await Promise.all([
      prisma.hero.count(),
      prisma.skin.count(),
      prisma.player.count(),
      prisma.playerHero.count()
    ]);

  console.log("\n========== HASIL SEED ==========");
  console.log(`Hero       : ${heroCount}`);
  console.log(`Skin       : ${skinCount}`);
  console.log(`Player     : ${playerCount}`);
  console.log(`PlayerHero : ${playerHeroCount}`);
  console.log("================================");

  console.log("Seeding berhasil!");
}

main()
  .catch((error) => {
    console.error("Seeding gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
