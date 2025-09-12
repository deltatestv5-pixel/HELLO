import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";

export default function Support() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const handleDiscordJoin = () => {
    window.open('https://discord.gg/CSqqGuyf6g', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header user={user} />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="support-hero-gradient rounded-3xl p-8 sm:p-12 mb-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="relative mx-auto mb-8 w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
              <i className="fab fa-discord text-5xl text-blue-400 relative z-10"></i>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Need Help?
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Join our Discord community for instant support, bot showcases, and connect with other developers
            </p>
            
            <Button
              onClick={handleDiscordJoin}
              className="discord-btn text-white px-8 py-4 text-lg font-semibold rounded-xl h-auto"
            >
              <i className="fab fa-discord mr-3 text-xl"></i>
              Join Discord Server
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Instant Support */}
          <div className="glass-card rounded-2xl p-8 text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <i className="fas fa-headset text-2xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold mb-4">Instant Support</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get real-time help from our community and moderators. Questions answered within minutes!
            </p>
          </div>

          {/* Bot Showcase */}
          <div className="glass-card rounded-2xl p-8 text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
              <i className="fas fa-robot text-2xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold mb-4">Bot Showcase</h3>
            <p className="text-muted-foreground leading-relaxed">
              Share your amazing bots with the community and get inspired by others' creations.
            </p>
          </div>

          {/* Developer Community */}
          <div className="glass-card rounded-2xl p-8 text-center card-hover">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <i className="fas fa-users text-2xl text-white"></i>
            </div>
            <h3 className="text-xl font-bold mb-4">Developer Community</h3>
            <p className="text-muted-foreground leading-relaxed">
              Connect with fellow developers, share code snippets, and collaborate on projects.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="modern-card-gradient rounded-2xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="fas fa-question-circle text-blue-400 mr-3"></i>
                How do I deploy my bot?
              </h3>
              <p className="text-muted-foreground">
                Simply upload your bot files using our dashboard, configure your Discord bot token, and hit deploy. Your bot will be online in seconds!
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="fas fa-question-circle text-purple-400 mr-3"></i>
                What programming languages are supported?
              </h3>
              <p className="text-muted-foreground">
                We currently support Python and Node.js bots. More languages coming soon!
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="fas fa-question-circle text-green-400 mr-3"></i>
                Is the hosting really free?
              </h3>
              <p className="text-muted-foreground">
                Yes! We provide free 24/7 hosting for Discord bots with reasonable resource limits. Perfect for getting started.
              </p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <i className="fas fa-question-circle text-pink-400 mr-3"></i>
                How can I monitor my bot's performance?
              </h3>
              <p className="text-muted-foreground">
                Our dashboard provides real-time monitoring including CPU usage, memory consumption, uptime, and live logs.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
          <p className="text-muted-foreground mb-6">
            Our community is always ready to help you succeed with your Discord bot projects.
          </p>
          <Button
            onClick={handleDiscordJoin}
            variant="outline"
            className="border-2 border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/10 px-6 py-3"
          >
            <i className="fab fa-discord mr-2"></i>
            Get Support on Discord
          </Button>
        </div>
      </main>
    </div>
  );
}