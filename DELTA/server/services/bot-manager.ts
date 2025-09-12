import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import pidusage from 'pidusage';
import { storage } from '../storage.js';
import { type Bot, type InsertBotLog } from '../../shared/schema.js';

// RADAR System for abuse detection
class RADARSystem {
  private static suspiciousPatterns = [
    // Mining patterns
    /mining|miner|crypto|bitcoin|ethereum|monero|xmr|btc|eth/i,
    /hashrate|difficulty|pool|stratum/i,
    /gpu|cuda|opencl|amd|nvidia/i,
    
    // Network abuse patterns
    /ddos|flood|spam|attack|exploit/i,
    /proxy|vpn|tor|onion/i,
    /botnet|zombie|malware/i,
    
    // Resource abuse patterns
    /infinite|while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/i,
    /fork|spawn.*spawn|exec.*exec/i,
    /memory.*allocation|malloc.*malloc/i,
  ];

  static analyzeCode(files: Array<{ filename: string; content: string }>): { 
    isSuspicious: boolean; 
    reasons: string[]; 
    riskScore: number; 
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    for (const file of files) {
      const content = file.content.toLowerCase();
      
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          const patternName = pattern.source.split('|')[0];
          reasons.push(`Suspicious pattern detected in ${file.filename}: ${patternName}`);
          riskScore += 10;
        }
      }

      // Check for excessive resource usage patterns
      const lines = content.split('\n');
      if (lines.length > 10000) {
        reasons.push(`Large file detected: ${file.filename} (${lines.length} lines)`);
        riskScore += 5;
      }

      // Check for obfuscated code
      const obfuscationIndicators = [
        /eval\s*\(/i,
        /exec\s*\(/i,
        /\\x[0-9a-f]{2}/i,
        /\\u[0-9a-f]{4}/i,
      ];

      for (const indicator of obfuscationIndicators) {
        if (indicator.test(content)) {
          reasons.push(`Potential code obfuscation in ${file.filename}`);
          riskScore += 15;
        }
      }
    }

    return {
      isSuspicious: riskScore > 20,
      reasons,
      riskScore
    };
  }

  static monitorResourceUsage(botId: string, stats: { memory: number; cpu: number }): {
    isAbusive: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const memoryMB = stats.memory / 1024 / 1024;
    const memoryLimit = parseInt(process.env.MEMORY_MAX?.replace('M', '') || '128');
    const cpuLimit = parseInt(process.env.CPU_QUOTA?.replace('%', '') || '50');

    if (memoryMB > memoryLimit) {
      reasons.push(`Memory usage exceeded limit: ${memoryMB.toFixed(1)}MB > ${memoryLimit}MB`);
    }

    if (stats.cpu > cpuLimit) {
      reasons.push(`CPU usage exceeded limit: ${stats.cpu.toFixed(1)}% > ${cpuLimit}%`);
    }

    return {
      isAbusive: reasons.length > 0,
      reasons
    };
  }
}

export class BotManager {
  private static processes: Map<string, ChildProcess> = new Map();
  private static logsDir = path.join(process.cwd(), 'bot_logs');
  private static workspaceDir = path.join(process.cwd(), 'bot_workspace');

  static async initDirectories() {
    await fs.mkdir(this.logsDir, { recursive: true });
    await fs.mkdir(this.workspaceDir, { recursive: true });
  }

  static async createBotWorkspace(botId: string, files: Array<{ filename: string; content: string }>, botToken: string) {
    const botDir = path.join(this.workspaceDir, botId);
    await fs.mkdir(botDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(botDir, file.filename);
      let content = file.content;
      
      // Replace token placeholders with actual token (properly quoted)
      content = content.replace(/YOUR_BOT_TOKEN|"YOUR_BOT_TOKEN"|'YOUR_BOT_TOKEN'/g, `"${botToken}"`);
      content = content.replace(/process\.env\.DISCORD_TOKEN|process\.env\.BOT_TOKEN|process\.env\.TOKEN/g, `"${botToken}"`);
      content = content.replace(/os\.environ\.get\(['"]DISCORD_TOKEN['"]\)|os\.environ\[['"]DISCORD_TOKEN['"]\]/g, `"${botToken}"`);
      content = content.replace(/os\.getenv\(['"]DISCORD_TOKEN['"]\)/g, `"${botToken}"`);
      
      await fs.writeFile(filePath, content);
    }

    return botDir;
  }

  private static async autoCreateDependencies(botDir: string, language: string, files: Array<{ filename: string; content: string }>): Promise<void> {
    try {
      if (language === 'python') {
        const requirementsExists = await fs.access(path.join(botDir, 'requirements.txt'))
          .then(() => true)
          .catch(() => false);
        
        if (!requirementsExists) {
          // Enhanced auto-detection of Python dependencies
          const pythonFiles = files.filter(f => f.filename.endsWith('.py'));
          const imports = new Set<string>();
          
          for (const file of pythonFiles) {
            const lines = file.content.split('\n');
            for (const line of lines) {
              const cleanLine = line.trim().toLowerCase();
              
              // Discord.py variants
              if (cleanLine.includes('discord.py') || cleanLine.includes('import discord') || 
                  cleanLine.includes('from discord')) {
                imports.add('discord.py>=2.3.0');
              }
              
              // Common bot dependencies
              if (cleanLine.includes('aiohttp') || cleanLine.includes('import aiohttp')) imports.add('aiohttp>=3.8.0');
              if (cleanLine.includes('requests') || cleanLine.includes('import requests')) imports.add('requests>=2.28.0');
              if (cleanLine.includes('asyncio') || cleanLine.includes('import asyncio')) imports.add('asyncio');
              if (cleanLine.includes('json') || cleanLine.includes('import json')) imports.add('json5>=0.9.0');
              if (cleanLine.includes('sqlite3') || cleanLine.includes('import sqlite3')) imports.add('sqlite3');
              if (cleanLine.includes('mysql') || cleanLine.includes('pymysql')) imports.add('PyMySQL>=1.0.0');
              if (cleanLine.includes('postgres') || cleanLine.includes('psycopg')) imports.add('psycopg2-binary>=2.9.0');
              if (cleanLine.includes('dotenv') || cleanLine.includes('python-dotenv')) imports.add('python-dotenv>=0.19.0');
            }
          }
          
          // Always add discord.py if no specific imports found but files exist
          if (imports.size === 0 && pythonFiles.length > 0) {
            imports.add('discord.py>=2.3.0');
          }
          
          if (imports.size > 0) {
            const requirementsContent = Array.from(imports).join('\n');
            await fs.writeFile(path.join(botDir, 'requirements.txt'), requirementsContent);
          }
        }
      } else if (language === 'nodejs') {
        const packageJsonExists = await fs.access(path.join(botDir, 'package.json'))
          .then(() => true)
          .catch(() => false);
        
        if (!packageJsonExists) {
          // Enhanced auto-detection of Node.js dependencies
          const jsFiles = files.filter(f => f.filename.endsWith('.js') || f.filename.endsWith('.ts'));
          const dependencies: Record<string, string> = {};
          
          for (const file of jsFiles) {
            const content = file.content.toLowerCase();
            
            // Discord.js variants
            if (content.includes('discord.js') || content.includes('require(\'discord') || 
                content.includes('import') && content.includes('discord')) {
              dependencies['discord.js'] = '^14.14.1';
            }
            
            // Discord.js related packages
            if (content.includes('@discordjs/builders') || content.includes('slashcommandbuilder')) {
              dependencies['@discordjs/builders'] = '^1.7.0';
            }
            if (content.includes('@discordjs/rest') || content.includes('rest')) {
              dependencies['@discordjs/rest'] = '^2.2.0';
            }
            if (content.includes('@discordjs/voice')) {
              dependencies['@discordjs/voice'] = '^0.16.1';
            }
            
            // Common bot dependencies
            if (content.includes('dotenv') || content.includes('process.env')) dependencies['dotenv'] = '^16.3.1';
            if (content.includes('axios') || content.includes('http request')) dependencies['axios'] = '^1.6.0';
            if (content.includes('fs-extra')) dependencies['fs-extra'] = '^11.2.0';
            if (content.includes('moment') || content.includes('date')) dependencies['moment'] = '^2.29.4';
            if (content.includes('lodash') || content.includes('_')) dependencies['lodash'] = '^4.17.21';
            if (content.includes('sqlite3')) dependencies['sqlite3'] = '^5.1.6';
            if (content.includes('mysql')) dependencies['mysql2'] = '^3.6.5';
            if (content.includes('mongoose') || content.includes('mongodb')) dependencies['mongoose'] = '^8.0.3';
          }
          
          // Always add discord.js if no specific dependencies found but files exist
          if (Object.keys(dependencies).length === 0 && jsFiles.length > 0) {
            dependencies['discord.js'] = '^14.14.1';
          }
          
          if (Object.keys(dependencies).length > 0) {
            const packageJson = {
              name: 'discord-bot',
              version: '1.0.0',
              main: 'index.js',
              dependencies
            };
            await fs.writeFile(path.join(botDir, 'package.json'), JSON.stringify(packageJson, null, 2));
          }
        }
      }
    } catch (error) {
      console.warn('Failed to auto-create dependencies file:', error);
    }
  }

  private static async installDependencies(botDir: string, language: string): Promise<void> {
    try {
      if (language === 'python') {
        const requirementsExists = await fs.access(path.join(botDir, 'requirements.txt'))
          .then(() => true)
          .catch(() => false);
        
        if (requirementsExists) {
          console.log(`Installing Python dependencies for bot in ${botDir}`);
          
          // Check requirements content
          const requirementsContent = await fs.readFile(path.join(botDir, 'requirements.txt'), 'utf-8');
          console.log('Requirements:', requirementsContent.trim());
          
          // Try multiple installation methods
          try {
            // Try with --user flag for better compatibility
            await this.runCommand('python3', ['-m', 'pip', 'install', '--user', '-r', 'requirements.txt'], botDir, 180000);
            console.log('Python dependencies installed successfully with --user flag');
          } catch (error) {
            console.log('Retrying without --user flag');
            try {
              await this.runCommand('python3', ['-m', 'pip', 'install', '-r', 'requirements.txt'], botDir, 180000);
              console.log('Python dependencies installed successfully');
            } catch (error2) {
              console.log('Trying with pip3 command');
              await this.runCommand('pip3', ['install', '--user', '-r', 'requirements.txt'], botDir, 180000);
              console.log('Python dependencies installed with pip3');
            }
          }
        } else {
          console.log('No requirements.txt found, skipping Python dependency installation');
        }
      } else if (language === 'nodejs') {
        const packageJsonExists = await fs.access(path.join(botDir, 'package.json'))
          .then(() => true)
          .catch(() => false);
        
        if (packageJsonExists) {
          console.log(`Installing Node.js dependencies for bot in ${botDir}`);
          
          // Check package.json content
          const packageContent = await fs.readFile(path.join(botDir, 'package.json'), 'utf-8');
          console.log('Package.json dependencies:', JSON.parse(packageContent).dependencies || 'none');
          
          // Use longer timeout for npm install
          await this.runCommand('npm', ['install', '--production', '--no-audit', '--no-fund'], botDir, 240000);
          console.log('Node.js dependencies installed successfully');
        } else {
          console.log('No package.json found, skipping Node.js dependency installation');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to install dependencies: ${errorMessage}`);
      
      // Log the error but don't throw - allow bot to try starting without dependencies
      // This prevents dependency installation issues from completely blocking bot startup
    }
  }

  private static async validateBot(bot: Bot): Promise<void> {
    if (!bot.token) {
      throw new Error('Bot token is missing');
    }
    if (!bot.language) {
      throw new Error('Bot language is not specified');
    }
    // Don't require mainFile here - we'll determine it dynamically
  }

  static async startBot(botId: string): Promise<{ success: boolean; message: string }> {
    const bot = await storage.getBot(botId);
    if (!bot) {
      throw new Error('Bot not found');
    }

    if (this.processes.has(botId)) {
      return { success: false, message: 'Bot is already running' };
    }

    // Set to starting status immediately
    await storage.updateBot(botId, { status: 'starting' });
    
    try {
      await this.validateBot(bot);

      const files = await storage.getBotFiles(botId);
      
      // RADAR System - Analyze code for suspicious patterns
      const radarAnalysis = RADARSystem.analyzeCode(files);
      if (radarAnalysis.isSuspicious) {
        await storage.updateBot(botId, { status: 'error' });
        this.logBotOutput(botId, 'error', `RADAR: Suspicious code detected. Risk score: ${radarAnalysis.riskScore}. Reasons: ${radarAnalysis.reasons.join(', ')}`);
        return { 
          success: false, 
          message: `Bot blocked by RADAR system. Suspicious activity detected: ${radarAnalysis.reasons[0]}` 
        };
      }

      const botDir = await this.createBotWorkspace(botId, files, bot.token);
      
      // Auto-create dependencies file if needed and install
      await this.autoCreateDependencies(botDir, bot.language, files);
      await this.installDependencies(botDir, bot.language);
      
      let childProcess: ChildProcess;
      const env = {
        ...process.env,
        DISCORD_TOKEN: bot.token,
        BOT_ID: botId,
        NODE_ENV: process.env.NODE_ENV || 'production',
        PYTHONUNBUFFERED: '1' // Ensure Python output is not buffered
      };
      
      if (bot.language === 'python') {
        // Find the best main file to run
        let mainFile = bot.mainFile;
        
        if (!mainFile) {
          // Prioritize common main file names
          const commonMainFiles = ['main.py', 'bot.py', 'app.py', 'run.py', '__main__.py', 'start.py'];
          const pythonFiles = files.filter(f => f.filename.endsWith('.py'));
          
          mainFile = pythonFiles.find(f => 
            commonMainFiles.includes(f.filename.toLowerCase())
          )?.filename || pythonFiles[0]?.filename;
        }
        
        if (!mainFile) {
          throw new Error('No Python files found to execute');
        }
        
        // Ensure the file exists in the workspace
        const mainFileExists = await fs.access(path.join(botDir, mainFile))
          .then(() => true)
          .catch(() => false);
        
        if (!mainFileExists) {
          // Find first available Python file
          const pythonFiles = files.filter(f => f.filename.endsWith('.py'));
          if (pythonFiles.length > 0) {
            mainFile = pythonFiles[0].filename;
            console.log(`Main file not found, using ${mainFile} instead`);
          } else {
            throw new Error('No Python files found in workspace');
          }
        }
        
        console.log(`Starting Python bot with main file: ${mainFile}`);
        
        console.log(`Starting Python bot with file: ${mainFile}`);
        childProcess = spawn('python3', ['-u', mainFile], {
          cwd: botDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else if (bot.language === 'nodejs') {
        // Find the best main file to run
        let mainFile = bot.mainFile;
        
        if (!mainFile) {
          // Prioritize common main file names
          const commonMainFiles = ['index.js', 'main.js', 'app.js', 'bot.js', 'start.js', 'server.js'];
          const jsFiles = files.filter(f => f.filename.endsWith('.js') || f.filename.endsWith('.ts'));
          
          mainFile = jsFiles.find(f => 
            commonMainFiles.includes(f.filename.toLowerCase())
          )?.filename || jsFiles[0]?.filename;
        }
        
        if (!mainFile) {
          throw new Error('No JavaScript files found to execute');
        }
        
        // Ensure the file exists in the workspace
        const mainFileExists = await fs.access(path.join(botDir, mainFile))
          .then(() => true)
          .catch(() => false);
        
        if (!mainFileExists) {
          // Find first available JS file
          const jsFiles = files.filter(f => f.filename.endsWith('.js') || f.filename.endsWith('.ts'));
          if (jsFiles.length > 0) {
            mainFile = jsFiles[0].filename;
          } else {
            throw new Error('No JavaScript files found in workspace');
          }
        }
        
        console.log(`Starting Node.js bot with file: ${mainFile}`);
        childProcess = spawn('node', [mainFile], {
          cwd: botDir,
          env,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        throw new Error(`Unsupported language: ${bot.language}`);
      }

      this.processes.set(botId, childProcess);

      // Set up logging with better error detection
      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        // Check for common bot success indicators
        if (output.includes('Logged in as') || output.includes('Bot is ready') || output.includes('Successfully logged in')) {
          // Bot successfully connected
          storage.updateBot(botId, { status: 'running' });
        }
        this.logBotOutput(botId, 'info', output);
      });

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        // Check for critical errors that should stop the bot
        if (output.includes('LoginFailure') || output.includes('Improper token') || 
            output.includes('Unauthorized') || output.includes('Invalid token')) {
          storage.updateBot(botId, { status: 'error' });
        }
        this.logBotOutput(botId, 'error', output);
      });

      childProcess.on('exit', async (code) => {
        this.processes.delete(botId);
        const status = code === 0 ? 'stopped' : 'error';
        await storage.updateBot(botId, { 
          status,
          processId: null,
          memoryUsage: '0MB',
          cpuUsage: '0%'
        });
        
        // Log the exit for monitoring - WebSocket updates handled in routes
        console.log(`Bot ${botId} process exited with code ${code}, status: ${status}`);
        
        this.logBotOutput(botId, code === 0 ? 'info' : 'error', `Process exited with code ${code}`);
      });
      
      childProcess.on('error', (error) => {
        this.processes.delete(botId);
        storage.updateBot(botId, { 
          status: 'error',
          processId: null,
          memoryUsage: '0MB',
          cpuUsage: '0%'
        });
        this.logBotOutput(botId, 'error', `Process error: ${error.message}`);
      });

      // Update bot status
      await storage.updateBot(botId, {
        status: 'running',
        processId: childProcess.pid || 0,
        lastStarted: new Date()
      });

      // Start monitoring
      this.startMonitoring(botId);

      return { success: true, message: 'Bot started successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateBot(botId, { status: 'error' });
      this.logBotOutput(botId, 'error', `Failed to start bot: ${errorMessage}`);
      return { success: false, message: `Failed to start bot: ${errorMessage}` };
    }
  }

  static async stopBot(botId: string): Promise<{ success: boolean; message: string }> {
    const process = this.processes.get(botId);
    if (!process) {
      await storage.updateBot(botId, {
        status: 'stopped',
        processId: null,
        memoryUsage: '0MB',
        cpuUsage: '0%'
      });
      return { success: true, message: 'Bot was not running' };
    }

    try {
      // Send SIGTERM first for graceful shutdown
      process.kill('SIGTERM');
      
      // Wait for process to exit gracefully
      const exitPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          process.kill('SIGKILL'); // Force kill if not exited
          resolve();
        }, 5000); // 5 second timeout

        process.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      await exitPromise;
      this.processes.delete(botId);
      
      await storage.updateBot(botId, {
        status: 'stopped',
        processId: null,
        memoryUsage: '0MB',
        cpuUsage: '0%'
      });

      // Clean up workspace
      try {
        const botDir = path.join(this.workspaceDir, botId);
        await fs.rm(botDir, { recursive: true, force: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to clean up bot workspace: ${errorMessage}`);
      }

      return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error stopping bot ${botId}:`, error);
      return { success: false, message: `Failed to stop bot: ${errorMessage}` };
    }
  }

  static async restartBot(botId: string): Promise<{ success: boolean; message: string }> {
    await this.stopBot(botId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    return await this.startBot(botId);
  }

  static isRunning(botId: string): boolean {
    return this.processes.has(botId);
  }

  private static async runCommand(command: string, args: string[], cwd: string, timeout: number = 300000): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Executing command: ${command} ${args.join(' ')} in ${cwd}`);
      
      const childProcess = spawn(command, args, { 
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          NODE_ENV: 'production'
        }
      });
      
      let stdout = '';
      let stderr = '';
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGKILL');
        reject(new Error(`Command timeout after ${timeout}ms: ${command} ${args.join(' ')}`));
      }, timeout);
      
      childProcess.stdout?.on('data', (data: any) => {
        const output = data.toString();
        stdout += output;
        console.log(`[${command}] stdout:`, output.trim());
      });
      
      childProcess.stderr?.on('data', (data: any) => {
        const output = data.toString();
        stderr += output;
        console.log(`[${command}] stderr:`, output.trim());
      });
      
      childProcess.on('error', (error: any) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn ${command}: ${error.message}`));
      });
      
      childProcess.on('exit', (code: any) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          console.log(`[${command}] completed successfully`);
          resolve();
        } else {
          const errorMsg = `Command '${command} ${args.join(' ')}' failed with exit code ${code}`;
          console.error(`[${command}] ${errorMsg}`);
          if (stderr.trim()) {
            console.error(`[${command}] stderr: ${stderr.trim()}`);
          }
          reject(new Error(`${errorMsg}. ${stderr.trim() ? 'Error: ' + stderr.trim() : ''}`));
        }
      });
    });
  }

  private static async logBotOutput(botId: string, type: 'info' | 'error' | 'warn', message: string) {
    const log: InsertBotLog = {
      botId,
      type,
      message: message.trim()
    };
    await storage.createBotLog(log);
  }

  private static startMonitoring(botId: string) {
    const interval = setInterval(async () => {
      const process = this.processes.get(botId);
      if (!process || !process.pid) {
        clearInterval(interval);
        return;
      }

      try {
        // Get actual process statistics
        const stats = await pidusage(process.pid);
        const memoryMB = Math.round(stats.memory / 1024 / 1024);
        const cpuPercent = stats.cpu.toFixed(1);
        
        // RADAR System - Monitor resource usage
        const radarCheck = RADARSystem.monitorResourceUsage(botId, stats);
        if (radarCheck.isAbusive) {
          console.warn(`RADAR: Bot ${botId} detected as abusive: ${radarCheck.reasons.join(', ')}`);
          this.logBotOutput(botId, 'warn', `RADAR: Resource abuse detected - ${radarCheck.reasons.join(', ')}`);
          
          // Terminate abusive bot
          process.kill('SIGKILL');
          this.processes.delete(botId);
          await storage.updateBot(botId, { 
            status: 'error',
            processId: null,
            memoryUsage: '0MB',
            cpuUsage: '0%'
          });
          this.logBotOutput(botId, 'error', 'Bot terminated due to resource abuse');
          clearInterval(interval);
          return;
        }
        
        // Calculate real uptime
        const bot = await storage.getBot(botId);
        if (bot && bot.lastStarted) {
          const uptimeMs = Date.now() - new Date(bot.lastStarted).getTime();
          const uptimeFormatted = this.formatUptime(uptimeMs);
          
          await storage.updateBot(botId, {
            memoryUsage: `${memoryMB}MB`,
            cpuUsage: `${cpuPercent}%`,
            uptime: uptimeFormatted
          });
        }
      } catch (error) {
        // If process stats fail, bot might have crashed
        console.warn(`Failed to get stats for bot ${botId}:`, error);
        clearInterval(interval);
      }
    }, 3000); // Update every 3 seconds for more responsive monitoring
  }
  
  private static formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}