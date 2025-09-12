import { type Bot } from "@shared/schema";

interface StatsCardsProps {
  bots: Bot[];
}

export function StatsCards({ bots }: StatsCardsProps) {
  const totalBots = bots.length;
  const onlineBots = bots.filter(bot => bot.status === 'running').length;
  const uptime = totalBots > 0 ? ((onlineBots / totalBots) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Bots</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-total-bots">{totalBots}</p>
          </div>
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary"></i>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500" data-testid="text-online-bots">{onlineBots}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-check-circle text-emerald-500"></i>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Uptime</p>
            <p className="text-2xl font-bold mt-1" data-testid="text-uptime">{uptime}%</p>
          </div>
          <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-accent"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
