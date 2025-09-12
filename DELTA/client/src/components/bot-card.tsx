import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Bot } from "@shared/schema";

interface BotCardProps {
  bot: Bot;
  onUpdate: () => void;
}

export function BotCard({ bot, onUpdate }: BotCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const { toast } = useToast();

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/bots/${bot.id}/start`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Bot Starting", description: `${bot.name} is starting up...` });
      } else {
        toast({ title: "Start Failed", description: data.message || "Failed to start bot", variant: "destructive" });
      }
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Start Failed", description: error.message, variant: "destructive" });
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
      case 'error': return 'status-offline';
      default: return 'status-offline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Online';
      case 'stopped': return 'Offline';
      case 'starting': return 'Starting';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-500';
      case 'stopped': return 'text-red-400';
      case 'starting': return 'text-yellow-500';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const memoryPercentage = bot.memoryUsage ? (parseFloat(bot.memoryUsage.replace('MB', '')) / 512) * 100 : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-6 card-hover" data-testid={`card-bot-${bot.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <i className={`fab ${bot.language === 'python' ? 'fa-python text-yellow-500' : 'fa-node-js text-green-500'}`}></i>
          </div>
          <div>
            <h3 className="font-semibold" data-testid={`text-bot-name-${bot.id}`}>{bot.name}</h3>
            <p className="text-sm text-muted-foreground">
              {bot.language === 'python' ? 'Python' : 'Node.js'} • Created {bot.createdAt ? new Date(bot.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`}></div>
          <span className={`text-sm font-medium ${getStatusTextColor(bot.status)}`} data-testid={`text-bot-status-${bot.id}`}>
            {getStatusText(bot.status)}
          </span>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Memory Usage</span>
          <span data-testid={`text-memory-usage-${bot.id}`}>{bot.memoryUsage} / 512 MB</span>
        </div>
        <Progress value={memoryPercentage} className="h-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {bot.status === 'running' ? 'Uptime' : 'Last seen'}
          </span>
          <span data-testid={`text-uptime-${bot.id}`}>
            {bot.status === 'running' ? bot.uptime : 
             bot.lastStarted ? new Date(bot.lastStarted).toLocaleString() : 'Never'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {bot.status === 'running' ? (
          <Button 
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            data-testid={`button-stop-${bot.id}`}
          >
            <i className="fas fa-pause"></i>
            <span>Stop</span>
          </Button>
        ) : (
          <Button 
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
            data-testid={`button-start-${bot.id}`}
          >
            <i className="fas fa-play"></i>
            <span>Start</span>
          </Button>
        )}
        
        <Button 
          onClick={() => restartMutation.mutate()}
          disabled={restartMutation.isPending}
          className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
          data-testid={`button-restart-${bot.id}`}
        >
          <i className="fas fa-redo"></i>
          <span>Restart</span>
        </Button>
        
        <Button 
          onClick={() => setShowLogs(!showLogs)}
          className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          data-testid={`button-logs-${bot.id}`}
        >
          <i className="fas fa-file-alt"></i>
        </Button>
        
        <Button 
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${bot.name}? This action cannot be undone.`)) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="p-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
          data-testid={`button-delete-${bot.id}`}
        >
          <i className="fas fa-trash"></i>
        </Button>
      </div>
    </div>
  );
}
