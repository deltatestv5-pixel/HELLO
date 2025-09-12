import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LiveConsole } from "@/components/live-console";
import { SourceEditor } from "@/components/source-editor";
import { type Bot } from "@shared/schema";

interface BotCardProps {
  bot: Bot;
  onUpdate: () => void;
}

export function EnhancedBotCard({ bot, onUpdate }: BotCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/bots/${bot.id}/start`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: "✅ Bot Starting", 
          description: `${bot.name} is starting up...`,
          className: "bg-green-50 border-green-200 text-green-800"
        });
      } else {
        toast({ 
          title: "❌ Start Failed", 
          description: `Error: ${data.message || "Failed to start bot"}`,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigator.clipboard.writeText(data.message || "Failed to start bot")}
            >
              Copy Error
            </Button>
          )
        });
      }
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Start Failed", 
        description: `Network error: ${error.message}`,
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigator.clipboard.writeText(error.message)}
          >
            Copy Error
          </Button>
        )
      });
      onUpdate();
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/bots/${bot.id}/stop`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bot Stopped", description: `${bot.name} has been stopped.` });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Stop Failed", description: error.message, variant: "destructive" });
    }
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/bots/${bot.id}/restart`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Bot Restarting", description: `${bot.name} is restarting...` });
      } else {
        toast({ title: "Restart Failed", description: data.message || "Failed to restart bot", variant: "destructive" });
      }
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Restart Failed", description: error.message, variant: "destructive" });
      onUpdate();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/bots/${bot.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bot Deleted", description: `${bot.name} has been permanently deleted.` });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'status-online';
      case 'stopped': return 'status-offline';
      case 'starting': return 'status-starting';
      case 'error': return 'status-error';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Online';
      case 'stopped': return 'Offline';
      case 'starting': return 'Starting...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const memoryValue = bot.memoryUsage ? parseFloat(bot.memoryUsage.replace('MB', '')) : 0;
  const memoryPercentage = Math.min((memoryValue / 512) * 100, 100);

  return (
    <div className="bot-card modern-card-gradient text-card-foreground border rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 card-hover feature-card-gradient" data-testid={`card-bot-${bot.id}`}>
      {/* Enhanced Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center relative overflow-hidden group feature-icon-animate">
            <i className={`${bot.language === 'python' ? 'fab fa-python text-yellow-500' : 'fab fa-node-js text-green-500'} text-2xl relative z-10 transition-transform group-hover:scale-110`}></i>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1" data-testid={`text-bot-name-${bot.id}`}>{bot.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-muted/60 rounded-md text-xs font-medium capitalize">
                {bot.language === 'python' ? '🐍 Python' : '⚡ Node.js'}
              </span>
              <span className="text-xs">•</span>
              <span className="text-xs">Created {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Status Badge */}
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(bot.status)} transition-all duration-300`}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full bg-current ${
              bot.status === 'running' ? 'animate-pulse' : 
              bot.status === 'starting' ? 'animate-bounce' : 
              bot.status === 'error' ? 'animate-pulse' : ''
            }`}></div>
            {getStatusText(bot.status)}
          </div>
        </div>
      </div>

      {/* Enhanced Performance Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-gradient-memory p-4 rounded-xl border border-blue-200/30 dark:border-blue-800/30 text-center group hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            <i className="fas fa-memory text-sm mr-1"></i>
            {bot.memoryUsage || '0MB'}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Memory</div>
          <div className="mt-2">
            <Progress value={memoryPercentage} className="h-1.5 bg-blue-100 dark:bg-blue-900/30" />
            <div className="text-xs text-blue-500 mt-1">{memoryPercentage.toFixed(1)}% of 512MB</div>
          </div>
        </div>
        
        <div className="stat-gradient-uptime p-4 rounded-xl border border-green-200/30 dark:border-green-800/30 text-center group hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
            <i className="fas fa-clock text-sm mr-1"></i>
            {bot.uptime || '0s'}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Uptime</div>
          <div className="text-xs text-green-500 mt-2">
            {bot.status === 'running' ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div className="stat-gradient-cpu p-4 rounded-xl border border-purple-200/30 dark:border-purple-800/30 text-center group hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
            <i className="fas fa-microchip text-sm mr-1"></i>
            {bot.cpuUsage || '0%'}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">CPU</div>
          <div className="text-xs text-purple-500 mt-2">
            {bot.processId ? `PID: ${bot.processId}` : 'No Process'}
          </div>
        </div>
      </div>

      {/* Last Activity */}
      <div className="mb-4 p-3 glass-card rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <i className="fas fa-history text-xs"></i>
            {bot.status === 'running' ? 'Started' : 'Last seen'}
          </span>
          <span className="font-medium">
            {bot.lastStarted ? new Date(bot.lastStarted).toLocaleString() : 'Never started'}
          </span>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex items-center gap-2">
        {bot.status === 'running' ? (
          <>
            <Button 
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              data-testid={`button-stop-${bot.id}`}
            >
              <i className="fas fa-stop mr-2"></i>
              {stopMutation.isPending ? 'Stopping...' : 'Stop'}
            </Button>
            <Button 
              onClick={() => restartMutation.mutate()}
              disabled={restartMutation.isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              data-testid={`button-restart-${bot.id}`}
            >
              <i className="fas fa-redo mr-2"></i>
              {restartMutation.isPending ? 'Restarting...' : 'Restart'}
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || bot.status === 'starting'}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            data-testid={`button-start-${bot.id}`}
          >
            <i className={`fas ${bot.status === 'starting' ? 'fa-spinner fa-spin' : 'fa-play'} mr-2`}></i>
            {startMutation.isPending || bot.status === 'starting' ? 'Starting...' : 'Start'}
          </Button>
        )}
        
        <Button 
          onClick={() => setShowConsole(true)}
          className="px-4 bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-sm hover:shadow-md"
          data-testid={`button-console-${bot.id}`}
          title="Open Live Console"
        >
          <i className="fas fa-terminal"></i>
        </Button>
        
        <Button 
          onClick={() => setShowEditor(true)}
          className="px-4 bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 shadow-sm hover:shadow-md"
          data-testid={`button-editor-${bot.id}`}
          title="Edit Source Code"
        >
          <i className="fas fa-code"></i>
        </Button>
        
        <Button 
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${bot.name}? This action cannot be undone.`)) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="px-4 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-sm hover:shadow-md"
          data-testid={`button-delete-${bot.id}`}
        >
          <i className="fas fa-trash"></i>
        </Button>
      </div>
      
      {/* Live Console Component */}
      <LiveConsole 
        botId={bot.id}
        botName={bot.name}
        botStatus={bot.status}
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
      />
      
      {/* Source Editor Component */}
      <SourceEditor 
        botId={bot.id}
        botName={bot.name}
        language={bot.language}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={() => {
          toast({
            title: "✅ Code Updated",
            description: "Bot source code has been saved. Restart bot to apply changes.",
            className: "bg-blue-50 border-blue-200 text-blue-800"
          });
        }}
      />
    </div>
  );
}