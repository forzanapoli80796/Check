import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Link, Save, Key, RotateCcw, LogOut, Loader2 } from "lucide-react";
import type { AppSetting } from "@shared/schema";

const AUFGABENPLANER_URL_KEY = "aufgabenplaner_url";

export function SettingsManagement() {
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const { data: aufgabenplanerSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/aufgabenplaner_url"],
    retry: false,
  });

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

  const skipButtonEnabled = (skipButtonData as any)?.settingValue === "true";

  useEffect(() => {
    if (aufgabenplanerSetting?.settingValue) {
      setUrlInput(aufgabenplanerSetting.settingValue);
    }
  }, [aufgabenplanerSetting]);

  const updateUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest("PUT", `/api/app-settings/${AUFGABENPLANER_URL_KEY}`, { value: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/aufgabenplaner_url"] });
      toast({ title: "Erfolg", description: "Aufgabenplaner-Link wurde gespeichert" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Link konnte nicht gespeichert werden", variant: "destructive" });
    },
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

  const updateSkipButtonMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest("PUT", "/api/app-settings/whiteboard_skip_button_enabled", { value: enabled ? "true" : "false" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-settings/whiteboard_skip_button_enabled"] });
      toast({ title: "Erfolgreich geändert", description: "Die Whiteboard-Skip-Button-Einstellung wurde aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Einstellung konnte nicht geändert werden.", variant: "destructive" });
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
    onError: () => {
      toast({ title: "Fehler", description: "Whiteboard-Bestätigungen konnten nicht zurückgesetzt werden.", variant: "destructive" });
    },
  });

  const handleResetWhiteboard = () => {
    if (confirm("Möchtest du wirklich alle Whiteboard-Bestätigungen zurücksetzen? Alle Mitarbeiter müssen das Whiteboard heute erneut lesen.")) {
      resetWhiteboardMutation.mutate();
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

      {/* Aufgabenplaner URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="w-5 h-5 text-green-600" />
            Aufgabenplaner
          </CardTitle>
          <CardDescription>
            Lege den Link fest, der beim Klick auf die "Aufgabenplaner"-Kachel geöffnet wird
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="aufgabenplaner-url" className="text-base font-medium">Hyperlink</Label>
            <div className="flex gap-3">
              <Input
                id="aufgabenplaner-url"
                type="url"
                placeholder="https://example.com/aufgaben"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => updateUrlMutation.mutate(urlInput)}
                disabled={updateUrlMutation.isPending || !urlInput.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
            {aufgabenplanerSetting?.settingValue && (
              <p className="text-sm text-gray-500">
                Aktueller Link: <span className="text-green-700 font-medium">{aufgabenplanerSetting.settingValue}</span>
              </p>
            )}
          </div>
        </CardContent>
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

      {/* Whiteboard Einstellungen */}
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
              onCheckedChange={checked => updateSkipButtonMutation.mutate(checked)}
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
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird zurückgesetzt...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-2" />Whiteboard-Erzwingung zurücksetzen</>
              )}
            </Button>
          </div>
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
