import { Button } from "@/components/ui/button";
import { DeltaTriangle } from "@/components/delta-triangle";
import { Search, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation('/');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative">
      {/* Animated gradient background layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-600/10 via-transparent to-blue-600/10 animate-gradient-shift-reverse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-24 sm:w-48 h-24 sm:h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* 404 content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Triangle logo container */}
        <div className="relative mx-auto mb-6 sm:mb-8 w-24 sm:w-32 h-24 sm:h-32 flex items-center justify-center fade-in" style={{animationDelay: '0.2s'}}>
          <DeltaTriangle />
        </div>

        {/* 404 icon */}
        <div className="mb-6 sm:mb-8 slide-up" style={{animationDelay: '0.4s'}}>
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-blue-500/30">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        {/* Large 404 number */}
        <div className="text-8xl sm:text-9xl lg:text-[12rem] font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4 sm:mb-6 slide-up leading-none" style={{animationDelay: '0.6s'}}>
          404
        </div>

        {/* Error title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 slide-up" style={{animationDelay: '0.8s'}}>
          Page Not Found
        </h1>

        {/* Error description */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 slide-up px-4 max-w-lg mx-auto leading-relaxed" style={{animationDelay: '1s'}}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center slide-up" style={{animationDelay: '1.2s'}}>
          <Button 
            onClick={handleGoHome}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg text-base font-semibold flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
          
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/10 px-8 py-3 rounded-lg text-base font-semibold flex items-center gap-3 transition-all duration-300 min-w-[200px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Need Support */}
        <div className="mt-12 sm:mt-16 slide-up" style={{animationDelay: '1.4s'}}>
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent backdrop-blur-md border border-blue-500/20 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <i className="fab fa-discord text-blue-400"></i>
              Need Support?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Can't find what you're looking for? Join our Discord community for instant help and support.
            </p>
            <Button 
              onClick={() => window.open('https://discord.gg/CSqqGuyf6g', '_blank')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm"
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
