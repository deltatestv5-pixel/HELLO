import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const error = urlParams.get('error');

      if (error) {
        toast({
          title: "Authentication Failed",
          description: "Discord authentication was cancelled or failed.",
          variant: "destructive",
        });
        setLocation('/');
        return;
      }

      if (success === 'true') {
        try {
          // Invalidate and refetch user data
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          
          // Fetch user data to get username for welcome message
          const response = await apiRequest('GET', '/api/auth/me');
          const userData = await response.json();
          
          toast({
            title: "Welcome to Delta!",
            description: `Successfully logged in as ${userData.username}`,
          });
          
          // Clean up URL and redirect to dashboard
          window.history.replaceState({}, document.title, '/');
          setLocation('/');
        } catch (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to complete Discord authentication.",
            variant: "destructive",
          });
          setLocation('/');
        }
      } else {
        // No success parameter, redirect to home
        setLocation('/');
      }
    };

    handleCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated gradient background layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-600/10 via-transparent to-blue-600/10 animate-gradient-shift-reverse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="text-center relative z-10">
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          <div className="triangle-glow"></div>
          <div className="w-10 h-10 bg-white clip-path-triangle feature-icon-animate"></div>
        </div>
        <div className="mb-4">
          <svg className="w-16 h-16 text-blue-400 mb-4 mx-auto block feature-icon-animate" style={{animationDelay: '0.5s'}} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
        </div>
        <div className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Authenticating with Discord
        </div>
        <div className="text-gray-300 flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          Please wait while we complete your login
        </div>
      </div>
    </div>
  );
}
