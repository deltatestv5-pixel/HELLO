import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BotUploadFormProps {
  onSuccess: () => void;
}

export function BotUploadForm({ onSuccess }: BotUploadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    language: 'python' as 'python' | 'nodejs',
    termsAccepted: false
  });
  const [files, setFiles] = useState<File[]>([]);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/bots', {
        method: 'POST',
        body: data,
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Deployed!",
        description: "Your bot has been successfully deployed and is ready to use.",
      });
      setFormData({ name: '', token: '', language: 'python', termsAccepted: false });
      setFiles([]);
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.token || files.length === 0 || !formData.termsAccepted) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields and accept the terms.",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('token', formData.token);
    data.append('language', formData.language);
    
    files.forEach(file => {
      data.append('files', file);
    });

    uploadMutation.mutate(data);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 card-hover">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <i className="fas fa-cloud-upload-alt text-primary"></i>
        </div>
        <h2 className="text-xl font-semibold">Deploy New Bot</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bot Name */}
        <div>
          <Label htmlFor="botName" className="block text-sm font-medium mb-2">Bot Name</Label>
          <Input
            id="botName"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Awesome Bot"
            className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            data-testid="input-bot-name"
          />
        </div>

        {/* Bot Language */}
        <div>
          <Label className="block text-sm font-medium mb-2">Runtime Environment</Label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="python" 
                checked={formData.language === 'python'}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'python' }))}
                className="sr-only peer" 
                data-testid="radio-language-python"
              />
              <div className="p-4 border-2 border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                <div className="flex items-center gap-3">
                  <i className="fab fa-python text-2xl text-yellow-500"></i>
                  <div>
                    <div className="font-medium">Python</div>
                    <div className="text-xs text-muted-foreground">3.9+</div>
                  </div>
                </div>
              </div>
            </label>
            <label className="relative cursor-pointer">
              <input 
                type="radio" 
                name="language" 
                value="nodejs" 
                checked={formData.language === 'nodejs'}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as 'nodejs' }))}
                className="sr-only peer"
                data-testid="radio-language-nodejs"
              />
              <div className="p-4 border-2 border-border rounded-lg peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
                <div className="flex items-center gap-3">
                  <i className="fab fa-node-js text-2xl text-green-500"></i>
                  <div>
                    <div className="font-medium">Node.js</div>
                    <div className="text-xs text-muted-foreground">18+</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Bot Token */}
        <div>
          <Label htmlFor="botToken" className="block text-sm font-medium mb-2">Discord Bot Token</Label>
          <div className="relative">
            <Input
              id="botToken"
              type={showToken ? 'text' : 'password'}
              value={formData.token}
              onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
              placeholder="Paste your bot token here"
              className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors pr-12"
              data-testid="input-bot-token"
            />
            <button 
              type="button" 
              onClick={() => setShowToken(!showToken)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-token-visibility"
            >
              <i className={`fas ${showToken ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
            <i className="fas fa-shield-alt text-primary"></i>
            Your token is encrypted and stored securely
          </p>
        </div>

        {/* File Upload */}
        <div>
          <Label className="block text-sm font-medium mb-2">Source Code</Label>
          <div 
            className="file-upload-area border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer"
            onClick={() => document.getElementById('fileInput')?.click()}
            data-testid="file-upload-area"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-2xl text-muted-foreground"></i>
              </div>
              <div>
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Support for .py, .js, .json, .txt files</p>
              </div>
            </div>
            <input 
              type="file" 
              id="fileInput" 
              multiple 
              className="hidden" 
              accept=".py,.js,.json,.txt,.ts,.yml,.yaml,.md"
              onChange={handleFileChange}
              data-testid="input-file-upload"
            />
          </div>
          
          {files.length > 0 && (
            <div className="mt-3 space-y-2" data-testid="file-list">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-code text-primary"></i>
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-center gap-3">
          <Checkbox 
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: !!checked }))}
            data-testid="checkbox-terms"
          />
          <Label htmlFor="terms" className="text-sm">
            I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>
          </Label>
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          disabled={uploadMutation.isPending}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 h-auto"
          data-testid="button-deploy-bot"
        >
          {uploadMutation.isPending ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Deploying...
            </>
          ) : (
            <>
              <i className="fas fa-rocket"></i>
              Deploy Bot
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
