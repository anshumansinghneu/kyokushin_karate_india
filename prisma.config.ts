// Root prisma config - points to backend
import "dotenv/config";
import path from "path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("backend", "prisma", "schema.prisma"),
  migrations: {
    path: path.join("backend", "prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
