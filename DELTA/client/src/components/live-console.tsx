import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Copy, 
  Terminal, 
  X, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Download, 
  Play,
  Square,
  RotateCcw,
  Settings,
  Filter,
  Search,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Send,
  Maximize as ArrowsMaximize
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug' | 'success';
  message: string;
  source?: string;
}

interface LiveConsoleProps {
  botId: string;
  botName: string;
  botStatus: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveConsole({ botId, botName, botStatus, isOpen, onClose }: LiveConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  useEffect(() => {
    if (!isOpen) return;

    // Connect to WebSocket for real-time logs
    connectWebSocket();
    
    // Load existing logs
    loadBotLogs();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, botId]);

  useEffect(() => {
    filterLogs();
  }, [logs, filterLevel, searchQuery]);

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);
  
  // Ensure scroll behavior works in both regular and full-screen modes
  useEffect(() => {
    if (isFullScreen) {
      // Reset scroll position when entering full-screen mode
      setTimeout(() => {
        if (autoScroll && logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isFullScreen, autoScroll]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/bot/${botId}/logs`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "🔗 Console Connected",
          description: "Real-time logging is active",
          className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
        });
      };
      
      wsRef.current.onmessage = (event) => {
        const logData = JSON.parse(event.data);
        const newLog: LogEntry = {
          id: Date.now().toString() + Math.random(),
          timestamp: new Date().toISOString(),
          level: logData.level || 'info',
          message: logData.message,
          source: logData.source || 'bot'
        };
        
        setLogs(prev => [...prev, newLog].slice(-500)); // Keep last 500 logs
      };
      
      wsRef.current.onerror = () => {
        setIsConnected(false);
        toast({
          title: "❌ Console Connection Error",
          description: "Real-time logging disconnected",
          variant: "destructive"
        });
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  };

  const loadBotLogs = async () => {
    try {
      const response = await apiRequest('GET', `/api/bots/${botId}/logs?limit=100`);
      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs.map((log: any) => ({
          id: log.id || Date.now().toString() + Math.random(),
          timestamp: log.timestamp,
          level: log.type || 'info',
          message: log.message,
          source: 'bot'
        })));
      }
    } catch (error) {
      // Add some default logs if API fails
      const defaultLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Bot ${botName} console initialized`,
          source: 'system'
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Status: ${botStatus}`,
          source: 'system'
        }
      ];
      setLogs(defaultLogs);
    }
  };

  const filterLogs = () => {
    let filtered = logs;
    
    // Filter by level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.level.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  };

  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText);
    toast({
      title: "📋 Logs copied",
      description: `${filteredLogs.length} log entries copied to clipboard`,
    });
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${botName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "⬇️ Logs downloaded",
      description: `Console logs saved as ${botName}-logs.txt`,
    });
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
    toast({
      title: "🧹 Console cleared",
      description: "All logs have been cleared",
    });
  };

  const sendCommand = async () => {
    if (!command.trim()) return;
    
    // Add command to logs
    const commandLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `> ${command}`,
      source: 'user'
    };
    
    setLogs(prev => [...prev, commandLog]);
    
    try {
      // Send command to bot (this would need backend implementation)
      const response = await apiRequest('POST', `/api/bots/${botId}/command`, {
        command: command.trim()
      });
      
      const result = await response.json();
      
      const responseLog: LogEntry = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
        level: result.success ? 'success' : 'error',
        message: result.message || (result.success ? 'Command executed successfully' : 'Command failed'),
        source: 'system'
      };
      
      setLogs(prev => [...prev, responseLog]);
      
    } catch (error) {
      const errorLog: LogEntry = {
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Command failed: ${command}`,
        source: 'system'
      };
      
      setLogs(prev => [...prev, errorLog]);
    }
    
    setCommand('');
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400" />;
      case 'warn': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'debug': return <Info className="w-3 h-3 text-blue-400" />;
      default: return <Info className="w-3 h-3 text-gray-400" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'debug': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'user': return 'text-purple-400';
      case 'system': return 'text-cyan-400';
      case 'bot': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isFullScreen} onOpenChange={(open) => setIsFullScreen(open)}>
      <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md ${isMaximized ? '' : 'p-2'} ${isFullScreen ? 'hidden' : 'block'}`}>
        <Card className={`bg-black/90 border-green-500/30 shadow-2xl ${
          isMaximized 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-[95vw] h-[85vh] mx-auto mt-4'
        } flex flex-col overflow-hidden`}>
        <CardHeader className="pb-2 border-b border-green-500/20 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Live Console - {botName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={botStatus === 'running' ? 'default' : 'secondary'} 
                    className={`text-xs ${botStatus === 'running' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
                  >
                    {botStatus}
                  </Badge>
                  <Badge 
                    variant={isConnected ? 'default' : 'destructive'} 
                    className={`text-xs ${isConnected ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}`}
                  >
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {filteredLogs.length} logs
                  </Badge>
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`${autoScroll ? 'bg-green-500/20 text-green-400' : 'text-gray-400'}`}
                title="Toggle auto-scroll"
              >
                <Zap className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={copyLogs} title="Copy logs">
                <Copy className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={downloadLogs} title="Download logs">
                <Download className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={clearLogs} title="Clear console">
                <Trash2 className="w-4 h-4" />
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
                title="Full Screen"
              >
                <ArrowsMaximize className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose} title="Close console">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Console Controls */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-500/10">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-24 h-7 text-xs bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 h-7 text-xs bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-gray-400">Font Size:</label>
              <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(parseInt(v))}>
                <SelectTrigger className="w-16 h-7 text-xs bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 11, 12, 13, 14, 15, 16].map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 bg-black/50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Logs Display Area */}
            <ScrollArea className="flex-1 p-4" ref={logsContainerRef}>
              <div className="space-y-1" style={{ fontSize: `${fontSize}px` }}>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 hover:bg-gray-800/30 px-2 py-1 rounded group"
                    >
                      <span className="text-xs text-gray-500 font-mono mt-0.5 min-w-[70px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="flex items-center gap-1 min-w-[20px]">
                        {getLogIcon(log.level)}
                      </div>
                      <span className={`text-xs font-medium uppercase min-w-[50px] ${getLogColor(log.level)}`}>
                        {log.level}
                      </span>
                      {log.source && (
                        <span className={`text-xs ${getSourceColor(log.source)} min-w-[45px]`}>
                          [{log.source}]
                        </span>
                      )}
                      <span className="text-gray-200 text-xs flex-1 font-mono">
                        {log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <Terminal className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-400" />
                      <p className="text-gray-400">
                        {searchQuery || filterLevel !== 'all' ? 'No logs match your filters' : 'Console is ready. Start your bot to see logs.'}
                      </p>
                    </div>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
            
            {/* Command Input Area */}
            <div className="border-t border-green-500/20 bg-gray-900/50 p-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-mono text-sm">$</span>
                <Input
                  placeholder="Enter command (e.g., 'restart', 'status', custom commands)..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendCommand();
                    }
                  }}
                  className="flex-1 bg-black/50 border-green-500/30 text-white font-mono text-sm placeholder:text-gray-500"
                  disabled={botStatus !== 'running'}
                />
                <Button
                  onClick={sendCommand}
                  disabled={!command.trim() || botStatus !== 'running'}
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {botStatus !== 'running' && (
                <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Bot must be running to accept commands
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 bg-black/90 border-green-500/30 shadow-2xl flex flex-col overflow-hidden">
      <CardHeader className="pb-2 border-b border-green-500/20 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg text-green-500">{botName} Console</CardTitle>
            <Badge 
              variant={botStatus === 'running' ? 'default' : 'destructive'} 
              className={`ml-2 ${botStatus === 'running' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
            >
              {botStatus === 'running' ? 'Online' : 'Offline'}
            </Badge>
            {isConnected && (
              <Badge variant="outline" className="ml-1 border-green-500/30 text-green-500">
                Connected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
              className={autoScroll ? 'text-green-500' : 'text-gray-500'}
            >
              <Play className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyLogs}
              title="Copy logs"
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={downloadLogs}
              title="Download logs"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearLogs}
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullScreen}
              title="Exit Full Screen"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Select value={filterLevel} onValueChange={(v: string) => setFilterLevel(v)}>
            <SelectTrigger className="h-8 w-[120px] bg-gray-900/50 border-green-500/20">
              <Filter className="w-3.5 h-3.5 mr-2 text-green-500" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-green-500" />
            <Input
              type="text"
              placeholder="Search logs..."
              className="pl-8 h-8 bg-gray-900/50 border-green-500/20 focus-visible:ring-green-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={fontSize.toString()} onValueChange={(v: string) => setFontSize(parseInt(v))}>
            <SelectTrigger className="h-8 w-[80px] bg-gray-900/50 border-green-500/20">
              <span className="text-xs mr-2">Aa</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="11">11px</SelectItem>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="13">13px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea 
          className="h-full" 
          ref={logsContainerRef}
          onScroll={handleScroll}
        >
          <div className="p-4 font-mono" style={{ fontSize: `${fontSize}px` }}>
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 italic">No logs to display</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-1 break-words">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={`ml-2 ${getLogColor(log.level)}`}>
                    {getLogIcon(log.level)}
                    <span className="ml-1">{log.message}</span>
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <div className="p-2 border-t border-green-500/20 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter command..."
            className="bg-gray-900/50 border-green-500/20 focus-visible:ring-green-500/30"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
          />
          <Button 
            onClick={sendCommand} 
            className="bg-green-500/20 hover:bg-green-500/30 text-green-500"
            disabled={!isConnected}
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </div>
        {!isConnected && (
          <p className="text-yellow-500 text-xs mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not connected to bot. Commands cannot be sent.
          </p>
        )}
      </div>
    </DialogContent>
    </Dialog>
  );
}