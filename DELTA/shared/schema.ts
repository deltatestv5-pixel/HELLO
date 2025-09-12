import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenUpdatedAt: timestamp("token_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  token: text("token").notNull(), // Encrypted bot token
  language: text("language").notNull(), // 'python' or 'nodejs'
  mainFile: text("main_file"),
  status: text("status").notNull().default('stopped'), // 'running', 'stopped', 'starting', 'error'
  processId: integer("process_id"),
  memoryUsage: text("memory_usage").default('0MB'),
  cpuUsage: text("cpu_usage").default('0%'),
  uptime: text("uptime").default('0s'),
  lastStarted: timestamp("last_started"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const botFiles = pgTable("bot_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const botLogs = pgTable("bot_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().references(() => bots.id),
  type: text("type").notNull(), // 'info', 'error', 'warn'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  processId: true,
  memoryUsage: true,
  cpuUsage: true,
  uptime: true,
  lastStarted: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBotFileSchema = createInsertSchema(botFiles).omit({
  id: true,
  createdAt: true,
});

export const insertBotLogSchema = createInsertSchema(botLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type BotFile = typeof botFiles.$inferSelect;
export type InsertBotFile = z.infer<typeof insertBotFileSchema>;
export type BotLog = typeof botLogs.$inferSelect;
export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
