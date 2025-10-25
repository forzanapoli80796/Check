import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon } from "lucide-react";
import type { Setting } from "@shared/schema";

const WHITEBOARD_ENFORCEMENT_KEY = "enforce_whiteboard_reading";

export function SettingsManagement() {
  const { toast } = useToast();

  // Fetch the whiteboard enforcement setting
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Get the specific setting
  const whiteboardEnforcementSetting = settings?.find(
    s => s.key === WHITEBOARD_ENFORCEMENT_KEY
  );

  const isEnforced = whiteboardEnforcementSetting?.value ?? false;

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("PUT", `/api/settings/${WHITEBOARD_ENFORCEMENT_KEY}`, {
        value: enabled,
        description: "Erzwingt, dass Mitarbeiter das Whiteboard pro Schicht lesen müssen"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Erfolg",
        description: "Einstellung wurde aktualisiert",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Einstellung konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    updateSettingMutation.mutate(checked);
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
            Verwalten Sie globale Einstellungen für das ForzaCheck-System
          </CardDescription>
        </CardHeader>
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
              onCheckedChange={handleToggle}
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
