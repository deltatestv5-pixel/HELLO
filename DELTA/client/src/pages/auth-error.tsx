import { Button } from "@/components/ui/button";
import { DeltaTriangle } from "@/components/delta-triangle";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthError() {
  const [, setLocation] = useLocation();

  const handleRetry = () => {
    // Clear any stored auth state and redirect to home
    window.location.href = '/';
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden bg-gradient-to-br from-red-900/20 via-purple-900/40 to-blue-900/20 relative">
      {/* Animated gradient background layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-purple-500/15 to-blue-500/10 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-600/5 via-transparent to-red-600/5 animate-gradient-shift-reverse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-24 sm:w-48 h-24 sm:h-48 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Error content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Triangle logo container */}
        <div className="relative mx-auto mb-6 sm:mb-8 w-24 sm:w-32 h-24 sm:h-32 flex items-center justify-center fade-in" style={{animationDelay: '0.2s'}}>
          <DeltaTriangle />
        </div>

        {/* Error icon */}
        <div className="mb-6 sm:mb-8 slide-up" style={{animationDelay: '0.4s'}}>
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-red-500/30">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Error title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4 sm:mb-6 slide-up leading-tight" style={{animationDelay: '0.6s'}}>
          Authentication Failed
        </h1>

        {/* Error description */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 slide-up px-4 max-w-lg mx-auto leading-relaxed" style={{animationDelay: '0.8s'}}>
          We encountered an issue while trying to authenticate with Discord. This might be due to a temporary server issue or configuration problem.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center slide-up" style={{animationDelay: '1s'}}>
          <Button 
            onClick={handleRetry}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg text-base font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleGoHome}
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/10 px-8 py-3 rounded-lg text-base font-semibold flex items-center gap-3 transition-all duration-300 min-w-[200px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Home
          </Button>
        </div>

        {/* Need Support */}
        <div className="mt-12 sm:mt-16 slide-up" style={{animationDelay: '1.2s'}}>
          <div className="bg-gradient-to-br from-red-500/10 via-orange-500/10 to-transparent backdrop-blur-md border border-red-500/20 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <i className="fab fa-discord text-red-400"></i>
              Need Support?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Authentication issues can be tricky. Get instant help from our community and resolve this quickly.
            </p>
            <Button 
              onClick={() => window.open('https://discord.gg/CSqqGuyf6g', '_blank')}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white text-sm"
            >
              <i className="fab fa-discord mr-2"></i>
              Get Help on Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}