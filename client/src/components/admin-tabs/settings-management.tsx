import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Link, Save } from "lucide-react";
import type { Setting, AppSetting } from "@shared/schema";

const WHITEBOARD_ENFORCEMENT_KEY = "enforce_whiteboard_reading";
const AUFGABENPLANER_URL_KEY = "aufgabenplaner_url";

export function SettingsManagement() {
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState("");

  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const { data: aufgabenplanerSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/aufgabenplaner_url"],
    retry: false,
  });

  useEffect(() => {
    if (aufgabenplanerSetting?.settingValue) {
      setUrlInput(aufgabenplanerSetting.settingValue);
    }
  }, [aufgabenplanerSetting]);

  const whiteboardEnforcementSetting = settings?.find(
    s => s.key === WHITEBOARD_ENFORCEMENT_KEY
  );
  const isEnforced = whiteboardEnforcementSetting?.value ?? false;

  const updateSettingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("PUT", `/api/settings/${WHITEBOARD_ENFORCEMENT_KEY}`, {
        value: enabled,
        description: "Erzwingt, dass Mitarbeiter das Whiteboard pro Schicht lesen müssen"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Erfolg", description: "Einstellung wurde aktualisiert" });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Einstellung konnte nicht aktualisiert werden", variant: "destructive" });
    },
  });

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

      {/* Aufgabenplaner URL Setting */}
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
            <Label htmlFor="aufgabenplaner-url" className="text-base font-medium">
              Hyperlink
            </Label>
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

      {/* Whiteboard Enforcement Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Whiteboard Lesebestätigung</CardTitle>
          <CardDescription>
            Legt fest, ob Mitarbeiter das Whiteboard einmal pro Schicht lesen müssen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="whiteboard-enforcement" className="text-base font-medium">
                Whiteboard-Pflicht aktivieren
              </Label>
              <p className="text-sm text-gray-500">
                Wenn aktiviert, müssen Mitarbeiter einmal pro Schicht das Whiteboard lesen und bestätigen,
                bevor sie ihre Aufgaben sehen können.
              </p>
            </div>
            <Switch
              id="whiteboard-enforcement"
              checked={isEnforced}
              onCheckedChange={v => updateSettingMutation.mutate(v)}
              disabled={updateSettingMutation.isPending}
              data-testid="toggle-whiteboard-enforcement"
            />
          </div>

          {isEnforced && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ✓ Whiteboard-Pflicht ist aktiv. Mitarbeiter müssen das Whiteboard einmal pro Schicht bestätigen.
              </p>
            </div>
          )}

          {!isEnforced && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                Whiteboard-Pflicht ist deaktiviert. Mitarbeiter können das Whiteboard freiwillig ansehen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
