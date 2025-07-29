import { useLocation } from "wouter";
import { User, UserCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RoleSelection() {
  const [, navigate] = useLocation();

  const selectRole = (role: string) => {
    if (role === 'admin') {
      navigate("/admin-login");
    } else if (role === 'mitarbeiter') {
      navigate("/employee");
    } else if (role === 'betriebsleiter') {
      navigate("/betriebsleiter");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-medium text-center mb-6">Rolle auswählen</h2>
          <div className="space-y-4">
            <Button
              onClick={() => selectRole('mitarbeiter')}
              className="role-button mitarbeiter"
            >
              <User size={24} />
              <span>Mitarbeiter</span>
            </Button>
            
            <Button
              onClick={() => selectRole('betriebsleiter')}
              className="role-button betriebsleiter"
            >
              <UserCheck size={24} />
              <span>Betriebsleiter</span>
            </Button>
            
            <Button
              onClick={() => selectRole('admin')}
              className="role-button admin"
            >
              <Settings size={24} />
              <span>Admin</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
