import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

const APP_PASSWORD = "0101"; // Das Haupt-Passwort für die App

export default function AppPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if already authenticated
  const isAuthenticated = sessionStorage.getItem("appAuthenticated") === "true";
  
  // If already authenticated, redirect to role selection
  if (isAuthenticated) {
    navigate("/role-selection");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === APP_PASSWORD) {
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
      <div className="mb-8">
        <img 
          src={forzaCheckLogo} 
          alt="ForzaCheck Logo" 
          className="h-32 sm:h-48 object-contain"
        />
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
        </CardContent>
      </Card>
      
      <p className="mt-6 text-xs text-gray-500 text-center">
        © 2024 ForzaCheck - Alle Rechte vorbehalten
      </p>
    </div>
  );
}