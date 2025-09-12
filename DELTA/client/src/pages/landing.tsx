import { DeltaTriangle } from "@/components/delta-triangle";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const handleDiscordLogin = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/discord');
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to initiate Discord login:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative">
      {/* Animated gradient background layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-600/10 via-transparent to-blue-600/10 animate-gradient-shift-reverse"></div>
        <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-24 sm:w-48 h-24 sm:h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Logo and branding */}
      <div className="relative z-10 text-center max-w-6xl mx-auto">
        {/* Triangle logo container */}
        <div className="relative mx-auto mb-6 sm:mb-8 w-24 sm:w-32 h-24 sm:h-32 flex items-center justify-center fade-in" style={{animationDelay: '0.2s'}}>
          <DeltaTriangle />
        </div>

        {/* Delta text */}
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-6 sm:mb-8 slide-up leading-tight" style={{animationDelay: '0.4s'}}>
          Delta
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 slide-up px-4" style={{animationDelay: '0.6s'}}>
          Self-Hosted Discord Bot Platform
        </p>

        {/* Login button */}
        <div className="slide-up mb-12 sm:mb-16" style={{animationDelay: '0.8s'}}>
          <Button 
            onClick={handleDiscordLogin}
            className="discord-btn text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold flex items-center mx-auto gap-2 sm:gap-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
            data-testid="button-discord-login"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0188 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
            <span className="whitespace-nowrap">Login with Discord</span>
          </Button>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto slide-up" style={{animationDelay: '1s'}}>
          <div className="text-center p-6 sm:p-8 rounded-2xl feature-card-gradient bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-purple-600/10 backdrop-blur-md border border-blue-500/20 card-hover transition-all duration-500 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-blue-500/25 feature-icon-animate">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 9v12h6v-8h6v8h6V9l-9-8z"/>
                <path d="M12 16l-2-2v6l2-2 2 2v-6l-2 2z"/>
              </svg>
            </div>
            <h3 className="font-bold mb-3 text-base sm:text-lg text-blue-100">Instant Deployment</h3>
            <p className="text-sm sm:text-base text-blue-200/90 leading-relaxed">Deploy your bots in seconds with our automated pipeline</p>
          </div>
          <div className="text-center p-6 sm:p-8 rounded-2xl feature-card-gradient bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-pink-600/10 backdrop-blur-md border border-purple-500/20 card-hover transition-all duration-500 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-purple-500/25 feature-icon-animate">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h3 className="font-bold mb-3 text-base sm:text-lg text-purple-100">Secure & Reliable</h3>
            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed">24/7 uptime with enterprise-grade security</p>
          </div>
          <div className="text-center p-6 sm:p-8 rounded-2xl feature-card-gradient bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-green-600/10 backdrop-blur-md border border-emerald-500/20 card-hover transition-all duration-500 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/10 sm:col-span-2 lg:col-span-1">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-emerald-500/25 feature-icon-animate">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
            </div>
            <h3 className="font-bold mb-3 text-base sm:text-lg text-emerald-100">Multi-Language</h3>
            <p className="text-sm sm:text-base text-emerald-200/90 leading-relaxed">Support for Python and Node.js environments</p>
          </div>
        </div>

        {/* Additional info for mobile */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground/80">
            Self-hosted solution • Fast deployment • Resource monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
