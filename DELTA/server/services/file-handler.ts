import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import { type Request } from 'express';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedExtensions = ['.py', '.js', '.ts', '.json', '.txt', '.md', '.yml', '.yaml', '.toml', '.cfg', '.ini', '.env'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  }
});

export function validateBotFiles(files: Express.Multer.File[], language: string): { isValid: boolean; error?: string; mainFile?: string; warnings?: string[] } {
  if (!files || files.length === 0) {
    return { isValid: false, error: 'No files uploaded' };
  }

  let mainFile: string | undefined;
  const warnings: string[] = [];

  if (language === 'python') {
    // Look for main Python file
    const pythonFiles = files.filter(f => f.originalname.endsWith('.py'));
    if (pythonFiles.length === 0) {
      return { isValid: false, error: 'No Python (.py) files found. Please upload at least one Python file.' };
    }

    // Enhanced main file detection for Python
    const commonMainFiles = ['main.py', 'bot.py', 'app.py', 'run.py', '__main__.py', 'start.py'];
    mainFile = pythonFiles.find(f => 
      commonMainFiles.includes(f.originalname.toLowerCase())
    )?.originalname || pythonFiles[0].originalname;

    // Check for common Discord.py patterns
    const hasDiscordImports = pythonFiles.some(file => {
      const content = file.buffer.toString('utf-8').toLowerCase();
      return content.includes('import discord') || content.includes('from discord');
    });
    
    if (!hasDiscordImports) {
      warnings.push('Warning: No Discord.py imports detected. Make sure you have "import discord" in your code.');
    }

    // Check for bot run patterns
    const hasBotRun = pythonFiles.some(file => {
      const content = file.buffer.toString('utf-8');
      return content.includes('.run(') || content.includes('bot.start');
    });
    
    if (!hasBotRun) {
      warnings.push('Warning: No bot.run() or bot.start() found. Make sure your bot has a way to start.');
    }

    // Check for token usage
    const hasTokenPlaceholder = pythonFiles.some(file => {
      const content = file.buffer.toString('utf-8');
      return content.includes('YOUR_BOT_TOKEN') || content.includes('TOKEN_HERE');
    });
    
    if (hasTokenPlaceholder) {
      warnings.push('Note: Token placeholders detected. These will be automatically replaced with your actual bot token.');
    }

  } else if (language === 'nodejs') {
    // Look for main JavaScript/TypeScript file
    const jsFiles = files.filter(f => f.originalname.endsWith('.js') || f.originalname.endsWith('.ts'));
    if (jsFiles.length === 0) {
      return { isValid: false, error: 'No JavaScript/TypeScript files found. Please upload at least one .js or .ts file.' };
    }

    // Enhanced main file detection for Node.js
    const commonMainFiles = ['index.js', 'bot.js', 'app.js', 'main.js', 'server.js', 'start.js', 'index.ts', 'bot.ts', 'app.ts', 'main.ts'];
    mainFile = jsFiles.find(f => 
      commonMainFiles.includes(f.originalname.toLowerCase())
    )?.originalname || jsFiles[0].originalname;

    // Check for Discord.js imports
    const hasDiscordImports = jsFiles.some(file => {
      const content = file.buffer.toString('utf-8').toLowerCase();
      return content.includes('discord.js') || content.includes('require(\'discord') || 
             (content.includes('import') && content.includes('discord'));
    });
    
    if (!hasDiscordImports) {
      warnings.push('Warning: No Discord.js imports detected. Make sure you have Discord.js in your code.');
    }

    // Check for client login
    const hasClientLogin = jsFiles.some(file => {
      const content = file.buffer.toString('utf-8');
      return content.includes('.login(') || content.includes('client.start');
    });
    
    if (!hasClientLogin) {
      warnings.push('Warning: No client.login() found. Make sure your bot has a way to start.');
    }

    // Check for package.json
    const hasPackageJson = files.some(f => f.originalname === 'package.json');
    if (!hasPackageJson) {
      warnings.push('Note: No package.json found. Dependencies will be auto-generated based on your code.');
    }

    // Check for token usage
    const hasTokenPlaceholder = jsFiles.some(file => {
      const content = file.buffer.toString('utf-8');
      return content.includes('YOUR_BOT_TOKEN') || content.includes('TOKEN_HERE');
    });
    
    if (hasTokenPlaceholder) {
      warnings.push('Note: Token placeholders detected. These will be automatically replaced with your actual bot token.');
    }

  } else {
    return { isValid: false, error: `Unsupported language: ${language}. Please select Python or Node.js.` };
  }

  return { 
    isValid: true, 
    mainFile, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

// Additional utility functions for file validation
export function analyzeCodeStructure(files: Express.Multer.File[], language: string) {
  const analysis = {
    hasCommands: false,
    hasEvents: false,
    hasErrorHandling: false,
    complexityScore: 0,
    dependencies: [] as string[]
  };

  if (language === 'python') {
    for (const file of files.filter(f => f.originalname.endsWith('.py'))) {
      const content = file.buffer.toString('utf-8').toLowerCase();
      
      if (content.includes('@bot.command') || content.includes('@client.command')) analysis.hasCommands = true;
      if (content.includes('@bot.event') || content.includes('@client.event')) analysis.hasEvents = true;
      if (content.includes('try:') && content.includes('except')) analysis.hasErrorHandling = true;
      
      // Complexity indicators
      analysis.complexityScore += (content.match(/def /g) || []).length;
      analysis.complexityScore += (content.match(/class /g) || []).length * 2;
    }
  } else if (language === 'nodejs') {
    for (const file of files.filter(f => f.originalname.endsWith('.js') || f.originalname.endsWith('.ts'))) {
      const content = file.buffer.toString('utf-8').toLowerCase();
      
      if (content.includes('client.on(') || content.includes('.commands.')) analysis.hasCommands = true;
      if (content.includes('on(\'ready\'') || content.includes('on(\'message')) analysis.hasEvents = true;
      if (content.includes('try {') || content.includes('catch')) analysis.hasErrorHandling = true;
      
      // Complexity indicators
      analysis.complexityScore += (content.match(/function /g) || []).length;
      analysis.complexityScore += (content.match(/class /g) || []).length * 2;
    }
  }

  return analysis;
}