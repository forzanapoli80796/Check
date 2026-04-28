import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

export default function AppPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Load app password from database
  const { data: appPassData, isLoading } = useQuery({
    queryKey: ["/api/app-settings/app_password"],
    retry: false,
  });

  // Check if already authenticated
  const isAuthenticated = sessionStorage.getItem("appAuthenticated") === "true";
  
  // If already authenticated, redirect to role selection (using useEffect to prevent React warning)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/role-selection");
    }
  }, [isAuthenticated, navigate]);

  // Don't render form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get password from database, fallback to default "0101"
    const correctPassword = (appPassData as any)?.settingValue || "0101";
    
    if (password === correctPassword) {
      sessionStorage.setItem("appAuthenticated", "true");
      navigate("/role-selection");
    } else {
      toast({
        title: "Falsches Passwort",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img 
          src={forzaCheckLogo} 
          alt="ForzaCheck Logo" 
          className="h-32 sm:h-48 object-contain"
        />
        <p className="mt-2 text-sm font-medium text-gray-500 tracking-wide">Version 2.0</p>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            App-Zugang
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Bitte geben Sie das Passwort ein, um fortzufahren
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600">Lade Einstellungen...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  className="pr-10 text-lg"
                  autoFocus
                  data-testid="input-app-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={!password}
                data-testid="button-submit-password"
              >
                Anmelden
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-6 text-xs text-gray-500 text-center">
        © 2024 ForzaCheck - Alle Rechte vorbehalten
      </p>
    </div>
  );
}