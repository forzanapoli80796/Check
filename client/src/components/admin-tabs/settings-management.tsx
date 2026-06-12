import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Save, Key, LogOut, Loader2, Download } from "lucide-react";

export function SettingsManagement() {
  const { toast } = useToast();
  const [appPassword, setAppPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const { data: appPassData } = useQuery({
    queryKey: ["/api/app-settings/app_password"],
    retry: false,
  });

  const { data: adminPassData } = useQuery({
    queryKey: ["/api/app-settings/admin_password"],
    retry: false,
  });

  const updateAppPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("PUT", "/api/app-settings/app_password", { value: password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/app_password"] });
      toast({ title: "Erfolgreich geändert", description: "Das App-Passwort wurde aktualisiert." });
      setAppPassword("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "App-Passwort konnte nicht geändert werden.", variant: "destructive" });
    },
  });

  const updateAdminPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("PUT", "/api/app-settings/admin_password", { value: password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/admin_password"] });
      toast({ title: "Erfolgreich geändert", description: "Das Admin-Passwort wurde aktualisiert." });
      setAdminPassword("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Admin-Passwort konnte nicht geändert werden.", variant: "destructive" });
    },
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handleBackupDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/admin/backup");
      if (!response.ok) throw new Error("Backup fehlgeschlagen");
      const blob = await response.blob();
      const date = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forzacheck-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup heruntergeladen", description: "Die Datei wurde erfolgreich gespeichert." });
    } catch {
      toast({ title: "Fehler", description: "Backup konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("appAuthenticated");
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            System-Einstellungen
          </CardTitle>
          <CardDescription>
            Globale Einstellungen für das ForzaCheck-System
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Passwörter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Passwörter verwalten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="app-password" className="font-medium">App-Passwort ändern</Label>
            <p className="text-sm text-gray-600 mb-2">
              Aktuelles Passwort: {(appPassData as any)?.settingValue || "0101"}
            </p>
            <div className="flex gap-2">
              <Input
                id="app-password"
                type="text"
                placeholder="Neues Passwort eingeben"
                value={appPassword}
                onChange={e => setAppPassword(e.target.value)}
                data-testid="input-app-password"
              />
              <Button
                onClick={() => updateAppPasswordMutation.mutate(appPassword)}
                disabled={!appPassword || updateAppPasswordMutation.isPending}
                data-testid="button-update-app-password"
              >
                {updateAppPasswordMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
                ) : "Ändern"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="admin-password" className="font-medium">Admin-Passwort ändern</Label>
            <p className="text-sm text-gray-600 mb-2">
              Aktuelles Passwort: {(adminPassData as any)?.settingValue || "0001"}
            </p>
            <div className="flex gap-2">
              <Input
                id="admin-password"
                type="text"
                placeholder="Neues Passwort eingeben"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                data-testid="input-admin-password"
              />
              <Button
                onClick={() => updateAdminPasswordMutation.mutate(adminPassword)}
                disabled={!adminPassword || updateAdminPasswordMutation.isPending}
                data-testid="button-update-admin-password"
              >
                {updateAdminPasswordMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
                ) : "Ändern"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datenbank-Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Datenbank-Backup
          </CardTitle>
          <CardDescription>
            Alle Daten als JSON-Datei herunterladen – Kategorien, Aufgaben, Checklisten, Teig-Daten und mehr.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleBackupDownload}
            disabled={isDownloading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isDownloading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird erstellt...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Backup herunterladen</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* App-Zugang */}
      <Card>
        <CardHeader>
          <CardTitle>App-Zugang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Ausloggen und zur App-Passwort-Seite zurückkehren. Damit kannst du testen, ob das neue Passwort funktioniert.
          </p>
          <Button onClick={handleLogout} variant="outline" data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Ausloggen und Passwort testen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
