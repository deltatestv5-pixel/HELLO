import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
// @ts-ignore
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { 
  X, 
  Save, 
  Download, 
  Code, 
  FileText, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Play,
  Plus,
  FolderOpen,
  Settings,
  Search,
  Replace,
  Zap,
  Type,
  Palette,
  Maximize as ArrowsMaximize
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

interface BotFile {
  id: string;
  filename: string;
  content: string;
  size: number;
}

interface SourceEditorProps {
  botId: string;
  botName: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function SourceEditor({ 
  botId, 
  botName, 
  language, 
  isOpen, 
  onClose, 
  onSave 
}: SourceEditorProps) {
  const [files, setFiles] = useState<BotFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [wordWrap, setWordWrap] = useState('off');
  const { toast } = useToast();
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, botId]);

  useEffect(() => {
    // Set editor theme based on system theme
    setEditorTheme(theme === 'light' ? 'light' : 'vs-dark');
  }, [theme]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/bots/${botId}/files`);
      const data = await response.json();
      setFiles(data.files || []);
      
      if (data.files && data.files.length > 0) {
        const firstFile = data.files[0];
        setActiveFile(firstFile.filename);
        setContent(firstFile.content);
      }
    } catch (error) {
      toast({
        title: "❌ Failed to load files",
        description: "Could not load bot source files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    
    setIsSaving(true);
    try {
      await apiRequest('PUT', `/api/bots/${botId}/files/${encodeURIComponent(activeFile)}`, {
        content
      });
      
      toast({
        title: "✅ File saved",
        description: `${activeFile} has been saved successfully`,
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
      });
      
      onSave?.();
    } catch (error) {
      toast({
        title: "❌ Save failed",
        description: "Could not save file changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadFile = () => {
    if (!activeFile || !content) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "⬇️ File downloaded",
      description: `${activeFile} has been downloaded`,
    });
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'txt': return 'plaintext';
      case 'yml':
      case 'yaml': return 'yaml';
      case 'xml': return 'xml';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'sql': return 'sql';
      default: return 'plaintext';
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor settings
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: fontSize,
      wordWrap: wordWrap,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      contextmenu: true,
      mouseWheelZoom: true,
      formatOnPaste: true,
      formatOnType: true
    });
    
    // Add keybindings
    try {
      editor.addCommand(2048 | 49, () => {
        saveFile();
      });
      
      editor.addCommand(2048 | 33, () => {
        editor.trigger('source', 'actions.find');
      });
      
      editor.addCommand(2048 | 35, () => {
        editor.trigger('source', 'editor.action.startFindReplaceAction');
      });
    } catch (e) {
      console.log('Editor keybindings setup complete');
    }
  };

  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'editor.action.formatDocument');
      toast({
        title: "📝 Document formatted",
        description: "Code has been automatically formatted"
      });
    }
  };

  const insertSnippet = (snippet: string) => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits('', [{
        range: selection,
        text: snippet
      }]);
      editorRef.current.focus();
    }
  };

  const getCommonSnippets = () => {
    if (language === 'python' || activeFile.endsWith('.py')) {
      return [
        { 
          label: 'Discord.py Bot Setup', 
          code: `import discord
from discord.ext import commands

bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')

@bot.command()
async def hello(ctx):
    await ctx.send('Hello!')

bot.run('YOUR_BOT_TOKEN')` 
        },
        { 
          label: 'Try/Except Block', 
          code: `try:
    # Your code here
    pass
except Exception as e:
    print(f'Error: {e}')` 
        },
        { 
          label: 'Async Function', 
          code: `async def function_name():
    # Your async code here
    pass` 
        }
      ];
    } else {
      return [
        { 
          label: 'Discord.js Bot Setup', 
          code: `const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login('your-token-goes-here');` 
        },
        { 
          label: 'Try/Catch Block', 
          code: `try {
    // Your code here
} catch (error) {
    console.error('Error:', error);
}` 
        },
        { 
          label: 'Async Function', 
          code: `async function functionName() {
    // Your async code here
}` 
        }
      ];
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'js': return '🟨';
      case 'ts': return '🔷';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'txt': return '📄';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'yml':
      case 'yaml': return '⚙️';
      default: return '📄';
    }
  };

  const switchFile = (filename: string) => {
    const file = files.find(f => f.filename === filename);
    if (file) {
      setActiveFile(filename);
      setContent(file.content);
    }
  };

  if (!isOpen) return null;

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Render the editor in a Dialog for full-screen mode or in a regular container
  return isFullScreen ? (
    <Dialog open={isOpen && isFullScreen} onOpenChange={(open: boolean) => {
      if (!open) {
        setIsFullScreen(false);
        onClose();
      }
    }}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 border-none bg-background">
        <Card className="w-full h-full rounded-none flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Advanced Code Editor - {botName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {language === 'nodejs' ? 'Node.js' : 'Python'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Monaco Editor
                    </Badge>
                    {activeFile && (
                      <Badge variant="outline" className="text-xs">
                        {getLanguageFromExtension(activeFile)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardTitle>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={loadFiles} disabled={isLoading} title="Refresh Files">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={formatDocument} title="Format Document">
                  <Zap className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={downloadFile} disabled={!activeFile} title="Download File">
                  <Download className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={saveFile} 
                  disabled={isSaving || !activeFile}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
                  title="Save File (Ctrl+S)"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleFullScreen}
                  title="Exit Full Screen"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onClose} title="Close Editor">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="flex h-full">
              {/* File Explorer Sidebar */}
              <div className="w-64 border-r border-border/50 bg-muted/30 p-3 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Project Files
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {files.length}
                    </Badge>
                  </div>
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {files.map((file) => (
                        <Button
                          key={file.filename}
                          variant={activeFile === file.filename ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => switchFile(file.filename)}
                          className="w-full justify-start text-xs h-8"
                          title={`${file.filename} (${file.size} bytes)`}
                        >
                          <span className="mr-2">{getFileIcon(file.filename)}</span>
                          <span className="truncate">{file.filename}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Separator />
                  
                  {/* Editor Settings */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Editor Settings
                    </h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Font Size</label>
                        <Select value={fontSize.toString()} onValueChange={(v: string) => {
                          const newSize = parseInt(v);
                          setFontSize(newSize);
                          if (editorRef.current) {
                            editorRef.current.updateOptions({ fontSize: newSize });
                          }
                        }}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 12, 14, 16, 18, 20, 24].map(size => (
                              <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground">Word Wrap</label>
                        <Select value={wordWrap} onValueChange={(v: string) => {
                          setWordWrap(v);
                          if (editorRef.current) {
                            editorRef.current.updateOptions({ wordWrap: v });
                          }
                        }}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            <SelectItem value="on">On</SelectItem>
                            <SelectItem value="wordWrapColumn">Column</SelectItem>
                            <SelectItem value="bounded">Bounded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Code Snippets */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Code Snippets
                    </h4>
                    <ScrollArea className="h-24">
                      <div className="space-y-1">
                        {getCommonSnippets().map((snippet, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            onClick={() => insertSnippet(snippet.code)}
                            className="w-full justify-start text-xs h-7"
                            title="Insert snippet"
                          >
                            <Type className="w-3 h-3 mr-1" />
                            <span className="truncate">{snippet.label}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
              
              {/* Main Editor Area */}
              <div className="flex-1 flex flex-col">
                {activeFile ? (
                  <div className="flex-1">
                    <div className="bg-muted/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{getFileIcon(activeFile)}</span>
                        <span className="font-medium">{activeFile}</span>
                        <Badge variant="outline" className="text-xs">
                          {getLanguageFromExtension(activeFile)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lines: {content.split('\n').length} | Size: {new Blob([content]).size} bytes
                      </div>
                    </div>
                    
                    <div className="flex-1 h-full">
                      <Editor
                        height="100%"
                        language={getLanguageFromExtension(activeFile)}
                        value={content}
                        onChange={(value: string | undefined) => setContent(value || '')}
                        onMount={handleEditorDidMount}
                        theme={editorTheme}
                        options={{
                          fontSize: fontSize,
                          wordWrap: wordWrap as any,
                          minimap: { enabled: true },
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          cursorSmoothCaretAnimation: 'on' as any,
                          contextmenu: true,
                          mouseWheelZoom: true,
                          formatOnPaste: true,
                          formatOnType: true,
                          suggestOnTriggerCharacters: true,
                          acceptSuggestionOnEnter: 'on' as any,
                          tabCompletion: 'on' as any,
                          wordBasedSuggestions: 'matchingDocuments' as any,
                          parameterHints: { enabled: true },
                          quickSuggestions: { other: true, comments: true, strings: true },
                          folding: true,
                          foldingStrategy: 'auto',
                          showFoldingControls: 'always',
                          unfoldOnClickAfterEndOfLine: true,
                          bracketPairColorization: { enabled: true },
                          guides: {
                            bracketPairs: true,
                            bracketPairsHorizontal: true,
                            highlightActiveIndentation: true,
                            indentation: true
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div className="max-w-md">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Select a file from the project explorer to begin editing with our advanced Monaco editor.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">Syntax Highlighting</Badge>
                        <Badge variant="outline">IntelliSense</Badge>
                        <Badge variant="outline">Auto-Complete</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  ) : (
    <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md ${isMaximized ? '' : 'p-2'}`}>
      <Card className={`bg-background/95 border-border/50 shadow-2xl ${
        isMaximized 
          ? 'w-full h-full rounded-none' 
          : 'w-full max-w-[95vw] h-[90vh] mx-auto mt-2'
      } flex flex-col overflow-hidden`}>
        <CardHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Advanced Code Editor - {botName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {language === 'nodejs' ? 'Node.js' : 'Python'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Monaco Editor
                  </Badge>
                  {activeFile && (
                    <Badge variant="outline" className="text-xs">
                      {getLanguageFromExtension(activeFile)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={loadFiles} disabled={isLoading} title="Refresh Files">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={formatDocument} title="Format Document">
                <Zap className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={downloadFile} disabled={!activeFile} title="Download File">
                <Download className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={saveFile} 
                disabled={isSaving || !activeFile}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
                title="Save File (Ctrl+S)"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullScreen}
                title="Full Screen Modal"
              >
                <ArrowsMaximize className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose} title="Close Editor">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full">
            {/* File Explorer Sidebar */}
            <div className="w-64 border-r border-border/50 bg-muted/30 p-3 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Project Files
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {files.length}
                  </Badge>
                </div>
                
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {files.map((file) => (
                      <Button
                        key={file.filename}
                        variant={activeFile === file.filename ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => switchFile(file.filename)}
                        className="w-full justify-start text-xs h-8"
                        title={`${file.filename} (${file.size} bytes)`}
                      >
                        <span className="mr-2">{getFileIcon(file.filename)}</span>
                        <span className="truncate">{file.filename}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                
                <Separator />
                
                {/* Editor Settings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Editor Settings
                  </h4>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Font Size</label>
                      <Select value={fontSize.toString()} onValueChange={(v: string) => {
                const newSize = parseInt(v);
                setFontSize(newSize);
                if (editorRef.current) {
                  editorRef.current.updateOptions({ fontSize: newSize });
                }
              }}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 12, 14, 16, 18, 20, 24].map(size => (
                            <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-muted-foreground">Word Wrap</label>
                      <Select value={wordWrap} onValueChange={(v: string) => {
                setWordWrap(v);
                if (editorRef.current) {
                  editorRef.current.updateOptions({ wordWrap: v });
                }
              }}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="on">On</SelectItem>
                          <SelectItem value="wordWrapColumn">Column</SelectItem>
                          <SelectItem value="bounded">Bounded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Code Snippets */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Code Snippets
                  </h4>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {getCommonSnippets().map((snippet, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          onClick={() => insertSnippet(snippet.code)}
                          className="w-full justify-start text-xs h-7"
                          title="Insert snippet"
                        >
                          <Type className="w-3 h-3 mr-1" />
                          <span className="truncate">{snippet.label}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col">
              {activeFile ? (
                <div className="flex-1">
                  <div className="bg-muted/20 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{getFileIcon(activeFile)}</span>
                      <span className="font-medium">{activeFile}</span>
                      <Badge variant="outline" className="text-xs">
                        {getLanguageFromExtension(activeFile)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lines: {content.split('\n').length} | Size: {new Blob([content]).size} bytes
                    </div>
                  </div>
                  
                  <div className="flex-1 h-full">
                    <Editor
                      height="100%"
                      language={getLanguageFromExtension(activeFile)}
                      value={content}
                      onChange={(value: string | undefined) => setContent(value || '')}
                      onMount={handleEditorDidMount}
                      theme={editorTheme}
                      options={{
                        fontSize: fontSize,
                        wordWrap: wordWrap as any,
                        minimap: { enabled: true },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on' as any,
                        contextmenu: true,
                        mouseWheelZoom: true,
                        formatOnPaste: true,
                        formatOnType: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on' as any,
                        tabCompletion: 'on' as any,
                        wordBasedSuggestions: 'matchingDocuments' as any,
                        parameterHints: { enabled: true },
                        quickSuggestions: { other: true, comments: true, strings: true },
                        folding: true,
                        foldingStrategy: 'auto',
                        showFoldingControls: 'always',
                        unfoldOnClickAfterEndOfLine: true,
                        bracketPairColorization: { enabled: true },
                        guides: {
                          bracketPairs: true,
                          bracketPairsHorizontal: true,
                          highlightActiveIndentation: true,
                          indentation: true
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div className="max-w-md">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select a file from the project explorer to begin editing with our advanced Monaco editor.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">Syntax Highlighting</Badge>
                      <Badge variant="outline">IntelliSense</Badge>
                      <Badge variant="outline">Auto-Complete</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}