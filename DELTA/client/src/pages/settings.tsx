import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Save, 
  Moon, 
  Sun, 
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  LogOut,
  Eye,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserSettings {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    discordId: string;
    createdAt: string;
  };
  settings: {
    notifications: {
      email: boolean;
      discord: boolean;
      botStatus: boolean;
      security: boolean;
    };
    theme: string;
    botLimit: number;
    storageLimit: string;
  };
}

interface SecurityData {
  securityScore: number;
  issues: string[];
  lastLogin: string;
  accountAge: number;
  connectedServices: string[];
  twoFactorEnabled: boolean;
}

interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  success: boolean;
}

export default function Settings() {
  const { data: authUser } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: userSettings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/user/settings"],
    enabled: !!authUser,
  });

  const { data: securityData, isLoading: securityLoading } = useQuery<SecurityData>({
    queryKey: ["/api/user/security"],
    enabled: !!authUser,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<{activity: ActivityEntry[]}>({
    queryKey: ["/api/user/activity"],
    enabled: !!authUser,
  });

  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notifications, setNotifications] = useState({
    email: true,
    discord: false,
    botStatus: true,
    security: true,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when settings load
  useEffect(() => {
    if (userSettings?.settings.notifications) {
      setNotifications(userSettings.settings.notifications);
    }
  }, [userSettings]);

  const updateNotificationsMutation = useMutation({
    mutationFn: async (newNotifications: typeof notifications) => {
      const response = await apiRequest('PUT', '/api/user/settings/notifications', newNotifications);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Settings saved",
        description: "Your notification preferences have been updated",
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Save failed",
        description: error.message || "Failed to update notification settings",
        variant: "destructive"
      });
    }
  });

  const disconnectDiscordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/disconnect-discord');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🔗 Discord disconnected",
        description: "You have been logged out successfully",
      });
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Disconnect failed",
        description: error.message || "Failed to disconnect Discord",
        variant: "destructive"
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (confirmation: string) => {
      const response = await apiRequest('DELETE', '/api/user/account', { confirmation });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "🗑️ Account deleted",
        description: "Your account has been permanently deleted",
      });
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Deletion failed",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateNotificationsMutation.mutateAsync(notifications);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectDiscord = () => {
    disconnectDiscordMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === 'DELETE') {
      deleteAccountMutation.mutate(deleteConfirmation);
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login': return <LogOut className="w-4 h-4 text-blue-400" />;
      case 'bot created': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'settings updated': return <Shield className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (settingsLoading || !userSettings) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <Header user={authUser} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header user={authUser} />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences, security, and bot hosting settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Profile Settings */}
          <Card className="modern-card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription>
                Your Discord account information and hosting preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 glass-card rounded-lg">
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 bg-cover bg-center flex items-center justify-center text-white text-lg font-medium"
                  style={{ backgroundImage: userSettings.user.avatar ? `url(${userSettings.user.avatar})` : undefined }}
                >
                  {!userSettings.user.avatar && userSettings.user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{userSettings.user.username}</h3>
                  <p className="text-sm text-muted-foreground">Discord User ID: {userSettings.user.discordId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                      Free Plan
                    </Badge>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active since {new Date(userSettings.user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Bot Limit</Label>
                    <p className="text-xs text-muted-foreground">Maximum bots you can host</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">{userSettings.settings.botLimit}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Storage Limit</Label>
                    <p className="text-xs text-muted-foreground">Total file storage available</p>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">{userSettings.settings.storageLimit}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="modern-card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-400" />
                </div>
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how DELTA looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Theme Preference</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs">Light</span>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs">Dark</span>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs">System</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Theme changes are saved automatically and sync across all your sessions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="modern-card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
                Notifications
              </CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label htmlFor="discord-notifications" className="text-sm font-medium">Discord DMs</Label>
                    <p className="text-xs text-muted-foreground">Get notified via Discord direct messages</p>
                  </div>
                  <Switch
                    id="discord-notifications"
                    checked={notifications.discord}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, discord: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label htmlFor="bot-status-notifications" className="text-sm font-medium">Bot Status Updates</Label>
                    <p className="text-xs text-muted-foreground">Alerts when your bots go offline or encounter errors</p>
                  </div>
                  <Switch
                    id="bot-status-notifications"
                    checked={notifications.botStatus}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, botStatus: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                  <div>
                    <Label htmlFor="security-notifications" className="text-sm font-medium">Security Alerts</Label>
                    <p className="text-xs text-muted-foreground">Important security and account updates</p>
                  </div>
                  <Switch
                    id="security-notifications"
                    checked={notifications.security}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, security: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="modern-card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Score */}
              {!securityLoading && securityData && (
                <div className="p-4 glass-card rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Security Score</h4>
                      <p className="text-xs text-muted-foreground">Based on your account security measures</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getSecurityScoreColor(securityData.securityScore)}`}>
                        {securityData.securityScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {securityData.securityScore >= 80 ? 'Excellent' : 
                         securityData.securityScore >= 60 ? 'Good' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Account age: {securityData.accountAge} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Discord connected</span>
                    </div>
                  </div>
                  
                  {securityData.issues.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">Recommendations:</span>
                      </div>
                      <ul className="text-xs text-muted-foreground mt-1 ml-6 list-disc">
                        {securityData.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Connected Services */}
              <div className="p-4 glass-card rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Connected Services</h4>
                    <p className="text-xs text-muted-foreground">Manage your connected accounts</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">D</span>
                    </div>
                    <div>
                      <div className="font-medium">Discord</div>
                      <div className="text-xs text-muted-foreground">Connected via OAuth</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectDiscord}
                    disabled={disconnectDiscordMutation.isPending}
                  >
                    {disconnectDiscordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Disconnect
                  </Button>
                </div>
              </div>
                
              {/* Recent Activity */}
              <div className="p-4 glass-card rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Recent Activity</h4>
                    <p className="text-xs text-muted-foreground">Your recent account activity</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>
                
                {activityLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {activityData?.activity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                          {getActionIcon(activity.action)}
                          <div className="flex-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span>{activity.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.ip} • {activity.success ? 'Success' : 'Failed'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
                
              {/* Danger Zone */}
              <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                <div className="mb-4">
                  <h4 className="font-medium text-red-400">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground">These actions cannot be undone</p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This will permanently delete your account and all associated data:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>All your bots will be stopped and deleted</li>
                          <li>All uploaded files will be permanently removed</li>
                          <li>Your Discord connection will be revoked</li>
                          <li>This action cannot be undone</li>
                        </ul>
                        <p className="font-medium mt-3">Type "DELETE" to confirm:</p>
                        <Input
                          placeholder="Type DELETE to confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== 'DELETE' || deleteAccountMutation.isPending}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {deleteAccountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Delete Account Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving || updateNotificationsMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2"
            >
              {isSaving || updateNotificationsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}