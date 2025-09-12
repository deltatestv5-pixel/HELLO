import { type User, type InsertUser, type Bot, type InsertBot, type BotFile, type InsertBotFile, type BotLog, type InsertBotLog, users, bots, botFiles, botLogs } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { db } from "./db.js";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Bot methods
  getBot(id: string): Promise<Bot | undefined>;
  getBotsByUserId(userId: string): Promise<Bot[]>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;

  // Bot file methods
  getBotFiles(botId: string): Promise<BotFile[]>;
  createBotFile(file: InsertBotFile): Promise<BotFile>;
  updateBotFile(botId: string, filename: string, content: string): Promise<boolean>;
  deleteBotFiles(botId: string): Promise<boolean>;

  // Bot log methods
  getBotLogs(botId: string, limit?: number): Promise<BotLog[]>;
  createBotLog(log: InsertBotLog): Promise<BotLog>;
  clearBotLogs(botId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private bots: Map<string, Bot> = new Map();
  private botFiles: Map<string, BotFile> = new Map();
  private botLogs: Map<string, BotLog> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      discriminator: insertUser.discriminator ?? null,
      avatar: insertUser.avatar ?? null,
      refreshToken: insertUser.refreshToken ?? null,
      tokenUpdatedAt: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Bot methods
  async getBot(id: string): Promise<Bot | undefined> {
    return this.bots.get(id);
  }

  async getBotsByUserId(userId: string): Promise<Bot[]> {
    return Array.from(this.bots.values()).filter(bot => bot.userId === userId);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = randomUUID();
    const bot: Bot = {
      ...insertBot,
      id,
      mainFile: insertBot.mainFile ?? null,
      status: 'stopped',
      processId: null,
      memoryUsage: '0MB',
      cpuUsage: '0%',
      uptime: '0s',
      lastStarted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bots.set(id, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.bots.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates, updatedAt: new Date() };
    this.bots.set(id, updatedBot);
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    const deleted = this.bots.delete(id);
    if (deleted) {
      // Also delete associated files and logs
      await this.deleteBotFiles(id);
      await this.clearBotLogs(id);
    }
    return deleted;
  }

  // Bot file methods
  async getBotFiles(botId: string): Promise<BotFile[]> {
    return Array.from(this.botFiles.values()).filter(file => file.botId === botId);
  }

  async createBotFile(insertFile: InsertBotFile): Promise<BotFile> {
    const id = randomUUID();
    const file: BotFile = {
      ...insertFile,
      id,
      createdAt: new Date()
    };
    this.botFiles.set(id, file);
    return file;
  }

  async updateBotFile(botId: string, filename: string, content: string): Promise<boolean> {
    const files = Array.from(this.botFiles.values()).filter(f => f.botId === botId && f.filename === filename);
    if (files.length > 0) {
      const file = files[0];
      file.content = content;
      file.size = Buffer.byteLength(content, 'utf8');
      this.botFiles.set(file.id, file);
      return true;
    }
    return false;
  }

  async deleteBotFiles(botId: string): Promise<boolean> {
    const files = await this.getBotFiles(botId);
    files.forEach(file => this.botFiles.delete(file.id));
    return true;
  }

  // Bot log methods
  async getBotLogs(botId: string, limit: number = 100): Promise<BotLog[]> {
    const logs = Array.from(this.botLogs.values())
      .filter(log => log.botId === botId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
    return logs;
  }

  async createBotLog(insertLog: InsertBotLog): Promise<BotLog> {
    const id = randomUUID();
    const log: BotLog = {
      ...insertLog,
      id,
      timestamp: new Date()
    };
    this.botLogs.set(id, log);
    return log;
  }

  async clearBotLogs(botId: string): Promise<boolean> {
    const logs = await this.getBotLogs(botId);
    logs.forEach(log => this.botLogs.delete(log.id));
    return true;
  }
}

// PostgreSQL storage implementation
class PostgresStorage implements IStorage {
  private db = db;

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.discordId, discordId)).limit(1);
      return result?.[0] || undefined;
    } catch (error) {
      console.error('Error in getUserByDiscordId:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0]!;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Bot methods
  async getBot(id: string): Promise<Bot | undefined> {
    const result = await this.db.select().from(bots).where(eq(bots.id, id)).limit(1);
    return result[0];
  }

  async getBotsByUserId(userId: string): Promise<Bot[]> {
    return await this.db.select().from(bots).where(eq(bots.userId, userId));
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const result = await this.db.insert(bots).values(insertBot).returning();
    return result[0]!;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    const result = await this.db.update(bots).set(updates).where(eq(bots.id, id)).returning();
    return result[0];
  }

  async deleteBot(id: string): Promise<boolean> {
    const result = await this.db.delete(bots).where(eq(bots.id, id)).returning();
    if (result.length > 0) {
      await this.deleteBotFiles(id);
      await this.clearBotLogs(id);
      return true;
    }
    return false;
  }

  // Bot file methods
  async getBotFiles(botId: string): Promise<BotFile[]> {
    return await this.db.select().from(botFiles).where(eq(botFiles.botId, botId));
  }

  async createBotFile(insertFile: InsertBotFile): Promise<BotFile> {
    const result = await this.db.insert(botFiles).values(insertFile).returning();
    return result[0]!;
  }

  async updateBotFile(botId: string, filename: string, content: string): Promise<boolean> {
    const result = await this.db.update(botFiles)
      .set({ content, size: Buffer.byteLength(content, 'utf8') })
      .where(and(eq(botFiles.botId, botId), eq(botFiles.filename, filename)))
      .returning();
    return result.length > 0;
  }

  async deleteBotFiles(botId: string): Promise<boolean> {
    await this.db.delete(botFiles).where(eq(botFiles.botId, botId));
    return true;
  }

  // Bot log methods
  async getBotLogs(botId: string, limit: number = 100): Promise<BotLog[]> {
    return await this.db.select().from(botLogs)
      .where(eq(botLogs.botId, botId))
      .orderBy(desc(botLogs.timestamp))
      .limit(limit);
  }

  async createBotLog(insertLog: InsertBotLog): Promise<BotLog> {
    const result = await this.db.insert(botLogs).values(insertLog).returning();
    return result[0]!;
  }

  async clearBotLogs(botId: string): Promise<boolean> {
    await this.db.delete(botLogs).where(eq(botLogs.botId, botId));
    return true;
  }
}

// Lazy initialization to ensure environment variables are loaded first
let _storage: IStorage | null = null;

export const storage: IStorage = new Proxy({} as IStorage, {
  get(target, prop) {
    if (!_storage) {
      // Initialize storage when first accessed
      _storage = process.env.NODE_ENV === 'development' && process.env.USE_MEMORY_STORAGE === 'true' 
        ? new MemStorage() 
        : new PostgresStorage();
    }
    return (_storage as any)[prop];
  }
});
