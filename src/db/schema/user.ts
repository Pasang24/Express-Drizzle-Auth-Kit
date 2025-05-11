import { pgTable, varchar, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["email", "google", "github"]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }),
  provider: providerEnum("provider").default("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});
