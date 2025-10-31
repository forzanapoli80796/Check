import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, RotateCcw, Key, LogOut } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DevTools() {
  const { toast } = useToast();
  const [appPassword, setAppPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Load current passwords (values only, not displayed for security)
  const { data: appPassData } = useQuery({
    queryKey: ["/api/app-settings/app_password"],
    retry: false,
  });
  
  const { data: adminPassData } = useQuery({
    queryKey: ["/api/app-settings/admin_password"],
    retry: false,
  });

  const { data: skipButtonData } = useQuery({
    queryKey: ["/api/app-settings/whiteboard_skip_button_enabled"],
    retry: false,
  });

  const skipButtonEnabled = (skipButtonData as any)?.settingValue === 'true';

  const updateAppPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("PUT", "/api/app-settings/app_password", { value: password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/app_password"] });
      toast({
        title: "Erfolgreich geändert",
        description: "Das App-Passwort wurde aktualisiert.",
      });
      setAppPassword("");
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "App-Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
      console.error("Error updating app password:", error);
    },
  });

  const updateAdminPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("PUT", "/api/app-settings/admin_password", { value: password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/admin_password"] });
      toast({
        title: "Erfolgreich geändert",
        description: "Das Admin-Passwort wurde aktualisiert.",
      });
      setAdminPassword("");
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Admin-Passwort konnte nicht geändert werden.",
        variant: "destructive",
      });
      console.error("Error updating admin password:", error);
    },
  });
  
  const updateSkipButtonMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PUT", "/api/app-settings/whiteboard_skip_button_enabled", { value: enabled ? 'true' : 'false' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/whiteboard_skip_button_enabled"] });
      toast({
        title: "Erfolgreich geändert",
        description: "Die Whiteboard-Skip-Button-Einstellung wurde aktualisiert.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Einstellung konnte nicht geändert werden.",
        variant: "destructive",
      });
      console.error("Error updating skip button setting:", error);
    },
  });

  const resetWhiteboardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/whiteboard-reads/reset");
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich zurückgesetzt",
        description: "Alle Whiteboard-Bestätigungen wurden gelöscht. Mitarbeiter müssen das Whiteboard heute erneut lesen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Whiteboard-Bestätigungen konnten nicht zurückgesetzt werden.",
        variant: "destructive",
      });
      console.error("Error resetting whiteboard reads:", error);
    },
  });

  const handleResetWhiteboard = () => {
    if (confirm("Möchten Sie wirklich alle Whiteboard-Bestätigungen zurücksetzen? Alle Mitarbeiter müssen das Whiteboard heute erneut lesen.")) {
      resetWhiteboardMutation.mutate();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("appAuthenticated");
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700 font-semibold">
              ⚠️ Entwickler-Werkzeuge
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Diese Funktionen sind für die Systemkonfiguration und sollten nur von autorisierten Administratoren verwendet werden.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Passwörter verwalten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="app-password" className="font-medium">
              App-Passwort ändern
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Aktuelles Passwort: {(appPassData as any)?.settingValue || "0101"}
            </p>
            <div className="flex gap-2">
              <Input
                id="app-password"
                type="text"
                placeholder="Neues Passwort eingeben"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                data-testid="input-app-password"
              />
              <Button
                onClick={() => updateAppPasswordMutation.mutate(appPassword)}
                disabled={!appPassword || updateAppPasswordMutation.isPending}
                data-testid="button-update-app-password"
              >
                {updateAppPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Ändern"
                )}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="admin-password" className="font-medium">
              Admin-Passwort ändern
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Aktuelles Passwort: {(adminPassData as any)?.settingValue || "0001"}
            </p>
            <div className="flex gap-2">
              <Input
                id="admin-password"
                type="text"
                placeholder="Neues Passwort eingeben"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                data-testid="input-admin-password"
              />
              <Button
                onClick={() => updateAdminPasswordMutation.mutate(adminPassword)}
                disabled={!adminPassword || updateAdminPasswordMutation.isPending}
                data-testid="button-update-admin-password"
              >
                {updateAdminPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Ändern"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whiteboard Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="skip-button-toggle" className="font-medium">
                "Trotzdem fortfahren" Button anzeigen
              </Label>
              <p className="text-sm text-gray-600">
                Wenn aktiviert, können Mitarbeiter das Whiteboard überspringen, ohne es zu lesen.
              </p>
            </div>
            <Switch
              id="skip-button-toggle"
              checked={skipButtonEnabled}
              onCheckedChange={(checked) => updateSkipButtonMutation.mutate(checked)}
              disabled={updateSkipButtonMutation.isPending}
              data-testid="switch-whiteboard-skip-button"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-gray-600 mb-4">
              Setzt alle Whiteboard-Bestätigungen zurück. Nach dem Zurücksetzen müssen alle Mitarbeiter das Whiteboard heute erneut lesen.
            </p>
            <Button
              onClick={handleResetWhiteboard}
              disabled={resetWhiteboardMutation.isPending}
              variant="destructive"
              data-testid="button-reset-whiteboard"
            >
              {resetWhiteboardMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird zurückgesetzt...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Whiteboard-Erzwingung zurücksetzen
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App-Zugang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Ausloggen und zur App-Passwort-Seite zurückkehren. Damit kannst du testen, ob das neue Passwort funktioniert.
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Ausloggen und Passwort testen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
