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
import type { AppSetting } from "@shared/schema";

const AUFGABENPLANER_URL_KEY = "aufgabenplaner_url";

export function SettingsManagement() {
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState("");

  const { data: aufgabenplanerSetting } = useQuery<AppSetting>({
    queryKey: ["/api/app-settings/aufgabenplaner_url"],
    retry: false,
  });

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

    </div>
  );
}
