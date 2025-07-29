import { useLocation } from "wouter";
import { ClipboardCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [location, navigate] = useLocation();
  
  const isHomePage = location === "/";
  const getCurrentRole = () => {
    if (location.includes("/admin")) return "Admin";
    if (location.includes("/betriebsleiter")) return "Betriebsleiter";
    if (location.includes("/employee")) return "Mitarbeiter";
    return null;
  };

  const handleLogout = () => {
    navigate("/");
  };

  const currentRole = getCurrentRole();

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardCheck size={32} />
            <h1 className="text-2xl font-bold">ForzaCheck</h1>
          </div>
          {!isHomePage && currentRole && (
            <div className="flex items-center space-x-4">
              <span className="text-sm opacity-90">{currentRole}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-blue-700"
              >
                <LogOut size={16} className="mr-1" />
                Abmelden
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
