import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import AuthCallback from "@/pages/auth-callback";
import AuthError from "@/pages/auth-error";
import Support from "@/pages/support";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <div className="triangle-glow"></div>
            <div className="w-8 h-8 bg-white clip-path-triangle animate-triangleFloat"></div>
          </div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/error" component={AuthError} />
      <Route path="/support" component={Support} />
      <Route path="/settings" component={Settings} />
      {user ? (
        <Route path="/" component={Dashboard} />
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <AuthenticatedApp />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
