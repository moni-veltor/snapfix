import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedSystemTemplates } from "./seed/templates-index";

if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor =
    WebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

async function main() {
  const cs = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!cs) throw new Error("DATABASE_URL or DIRECT_URL must be set");
  const adapter = new PrismaNeon({ connectionString: cs });
  const prisma = new PrismaClient({ adapter });
  await seedSystemTemplates(prisma);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
