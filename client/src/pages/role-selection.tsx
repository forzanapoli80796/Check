import { useState } from "react";
import { useLocation } from "wouter";
import { User, Shield, Settings, Cookie, Globe, Lock, Eye, EyeOff, StickyNote } from "lucide-react";
import logoPath from "@assets/FORZACHECK1_black_1753816621910.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CORRECT_PASSWORD = "0101";

export default function RoleSelection() {
  const [, navigate] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const selectRole = (role: string) => {
    if (role === 'admin') {
      navigate("/admin-login");
    } else {
      // Für Mitarbeiter, Betriebsleiter und Teig: Passwort abfragen
      setSelectedRole(role);
      setShowPasswordDialog(true);
      setPassword("");
      setShowPassword(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setShowPasswordDialog(false);
      
      // Navigation je nach ausgewählter Rolle
      if (selectedRole === 'mitarbeiter') {
        navigate("/employee");
      } else if (selectedRole === 'betriebsleiter') {
        navigate("/employee?role=betriebsleiter");
      } else if (selectedRole === 'teig') {
        navigate("/teig");
      }
      
      setPassword("");
      setSelectedRole(null);
    } else {
      toast({
        title: "Fehler",
        description: "Falsches Passwort",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-12">
          <img 
            src={logoPath} 
            alt="ForzaCheck Logo" 
            className="max-h-80 max-w-full mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t.startPage.title}
          </h1>
          <p className="text-gray-600">
            {t.startPage.subtitle}
          </p>
        </div>

        {/* Role Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => selectRole('mitarbeiter')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
              <User className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.employee}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.employeeDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('betriebsleiter')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
              <Shield className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.manager}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.managerDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('teig')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
              <Cookie className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.teig}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.teigDesc}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/whiteboard')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            data-testid="button-whiteboard"
          >
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
              <StickyNote className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                Digitales Whiteboard
              </span>
              <span className="text-sm text-gray-500">
                Notizen für Kollegen hinterlassen
              </span>
            </div>
          </button>
          
          <button
            onClick={() => selectRole('admin')}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
              <Settings className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block">
                {t.startPage.roles.admin}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.adminDesc}
              </span>
            </div>
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <Globe className="text-white" size={24} />
            </div>
            <div className="text-left">
              <span className="text-lg font-medium text-gray-900 block" translate="no">
                {language === 'de' ? 'English' : 'Deutsch'}
              </span>
              <span className="text-sm text-gray-500">
                {t.startPage.roles.languageDesc}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Passwort erforderlich
            </DialogTitle>
            <DialogDescription>
              Bitte geben Sie das Passwort ein, um fortzufahren.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="pr-10"
                autoFocus
                data-testid="input-role-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                data-testid="button-toggle-role-password"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword("");
                  setSelectedRole(null);
                }}
              >
                Abbrechen
              </Button>
              <Button 
                type="submit"
                disabled={!password}
                data-testid="button-submit-role-password"
              >
                Bestätigen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
