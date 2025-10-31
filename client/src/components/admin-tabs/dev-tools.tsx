import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, Key } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-semibold">
              ⚠️ Bitte nicht anfassen!
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Hier sind Werkzeuge für die Entwicklung der App. Diese Funktionen sollten nur von Entwicklern verwendet werden, da sie das System beeinflussen können.
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
          <CardTitle>Whiteboard Erzwingung</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
