import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AppLogo from "@/components/app-logo";
import { useLanguage } from "@/contexts/LanguageContext";

const CORRECT_PASSWORD = "0101";

export default function EmployeePassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Get role from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get('role') || 'mitarbeiter';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      // Navigate based on role
      if (role === 'mitarbeiter') {
        navigate("/employee");
      } else if (role === 'teig') {
        navigate("/teig");
      }
    } else {
      toast({
        title: "Fehler",
        description: "Falsches Passwort",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const goBack = () => {
    navigate("/");
  };

  const getRoleTitle = () => {
    switch(role) {
      case 'teig':
        return t.startPage.roles.teig;
      default:
        return t.startPage.roles.employee;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <AppLogo asLink imgClassName="h-32 object-contain" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Passwort erforderlich
          </CardTitle>
          <CardDescription>
            Bitte gib das Passwort für {getRoleTitle()} ein
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="forzacheck-employee"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e as any); }}
                placeholder="Passwort eingeben"
                className="pr-10"
                autoFocus
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-password"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={goBack}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              <Button 
                type="button"
                onClick={handleSubmit as any}
                className="flex-1"
                data-testid="button-submit"
              >
                Bestätigen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}