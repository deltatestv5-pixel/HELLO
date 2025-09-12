import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsCards } from "@/components/stats-cards";
import { BotUploadForm } from "@/components/bot-upload-form";
import { EnhancedBotCard } from "@/components/enhanced-bot-card";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/lib/websocket";
import { type Bot } from "@shared/schema";
import { RefreshCw, BarChart3, Bot as BotIcon, Plus, Home, Settings } from "lucide-react";

export default function Dashboard() {
  const { data: user } = useQuery<{ id: string; username: string; discriminator?: string; avatar?: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: botsData, refetch: refetchBots } = useQuery<{ bots: Bot[] }>({
    queryKey: ["/api/bots"],
  });

  const bots = botsData?.bots || [];

  // Set up WebSocket for real-time updates
  useWebSocket(user?.id, (data) => {
    if (data.type === 'bot_status_update' || data.type === 'bot_deleted') {
      refetchBots();
    }
  });

  const handleRefreshAll = () => {
    refetchBots();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header user={user} />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Section - Mobile First */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {user?.username}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your Discord bots with ease
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={handleRefreshAll}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                data-testid="button-refresh-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 sm:mb-8">
          <StatsCards bots={bots} />
        </div>

        {/* Mobile-First Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Bot Upload Section - Full width on mobile, sidebar on desktop */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="xl:sticky xl:top-24">
              <BotUploadForm onSuccess={refetchBots} />
            </div>
          </div>

          {/* Bots List Section - Full width on mobile, main content on desktop */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            {/* Bots Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Your Bots</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {bots.length} of 1 bot deployed
                </p>
              </div>
            </div>

            {/* Bots Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6" data-testid="bots-container">
              {bots.length === 0 ? (
                <div className="col-span-full">
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BotIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bots deployed yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Deploy your first Discord bot to get started with our hosting platform
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Deploy Your First Bot
                    </Button>
                  </div>
                </div>
              ) : (
                bots.map((bot: Bot) => (
                  <EnhancedBotCard key={bot.id} bot={bot} onUpdate={refetchBots} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2">
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <Home className="w-4 h-4" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <BotIcon className="w-4 h-4" />
            <span className="text-xs">Bots</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">Stats</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2">
            <Settings className="w-4 h-4" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>

      {/* Add bottom padding for mobile navigation */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
}
