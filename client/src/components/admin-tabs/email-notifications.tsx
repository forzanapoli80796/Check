import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Save, Send, RotateCcw, Loader2, ArrowRight } from "lucide-react";

const STORES = ["JP23", "KP5", "TS17"];

interface EmailNotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
  storeEnabled?: Record<string, boolean>;
}

interface EmailNotificationsSettings {
  kugelnUsed: EmailNotificationConfig;
  kugelnLeftover: EmailNotificationConfig;
}

const EMPTY_CONFIG: EmailNotificationConfig = { enabled: true, subject: "", body: "" };

function isStoreEnabled(config: EmailNotificationConfig, store: string): boolean {
  if (!config.storeEnabled) return true;
  return config.storeEnabled[store] !== false;
}

export default function EmailNotifications() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailNotificationsSettings>({
    kugelnUsed: EMPTY_CONFIG,
    kugelnLeftover: EMPTY_CONFIG,
  });
  const [testStore, setTestStore] = useState<string>("JP23");
  const [sendingTest, setSendingTest] = useState<string | null>(null);

  const { data, isLoading } = useQuery<EmailNotificationsSettings>({
    queryKey: ["/api/email-notifications/settings"],
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: EmailNotificationsSettings) => {
      const res = await apiRequest("PUT", "/api/email-notifications/settings", newSettings);
      return res.json();
    },
    onSuccess: (saved: EmailNotificationsSettings) => {
      setSettings(saved);
      toast({ title: "Gespeichert", description: "Die E-Mail-Einstellungen wurden aktualisiert." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden.", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/email-notifications/settings/reset", {});
      return res.json();
    },
    onSuccess: (defaults: EmailNotificationsSettings) => {
      setSettings(defaults);
      toast({ title: "Zurückgesetzt", description: "Standardtexte wurden wiederhergestellt." });
    },
    onError: () => {
      toast({ title: "Fehler", description: "Zurücksetzen fehlgeschlagen.", variant: "destructive" });
    },
  });

  const updateConfig = (key: keyof EmailNotificationsSettings, patch: Partial<EmailNotificationConfig>) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const toggleEnabled = (key: keyof EmailNotificationsSettings, enabled: boolean) => {
    const updated = { ...settings, [key]: { ...settings[key], enabled } };
    setSettings(updated);
    saveMutation.mutate(updated);
  };

  const toggleStoreEnabled = (key: keyof EmailNotificationsSettings, store: string, enabled: boolean) => {
    const currentStoreEnabled = settings[key].storeEnabled || { JP23: true, KP5: true, TS17: true };
    const updated = {
      ...settings,
      [key]: {
        ...settings[key],
        storeEnabled: { ...currentStoreEnabled, [store]: enabled },
      },
    };
    setSettings(updated);
    saveMutation.mutate(updated);
  };

  const handleSave = (key: keyof EmailNotificationsSettings) => {
    saveMutation.mutate(settings);
  };

  const handleTestSend = async (type: keyof EmailNotificationsSettings) => {
    setSendingTest(type);
    try {
      const res = await apiRequest("POST", `/api/email-notifications/test/${type}`, { store: testStore });
      if (!res.ok) throw new Error("failed");
      toast({ title: "Testmail gesendet", description: `Eine Testmail für ${testStore} wurde an bestellung@forzanapoli.de verschickt.` });
    } catch {
      toast({ title: "Fehler", description: "Testmail konnte nicht gesendet werden.", variant: "destructive" });
    } finally {
      setSendingTest(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Lade Einstellungen...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Process overview */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail size={18} className="text-blue-700" />
            Wie der Kugeln-Benachrichtigungsprozess funktioniert
          </CardTitle>
          <CardDescription className="text-blue-900">
            Beim Absenden des Mengenformulars Spätschicht wird automatisch geprüft, ob eine Warn-E-Mail nötig ist.
            Beide Benachrichtigungen gelten für alle Filialen und gehen an <strong>bestellung@forzanapoli.de</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
            <span className="font-medium">Mitarbeiter füllt Mengenformular Spätschicht aus</span>
            <ArrowRight size={14} />
            <span className="font-medium">System prüft die Werte</span>
            <ArrowRight size={14} />
            <span className="font-medium">Ggf. E-Mail(s) werden versendet</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {STORES.map(store => (
              <Badge key={store} variant="outline" className="bg-white border-blue-300 text-blue-800">
                {store}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification 1: Kugeln used */}
      <NotificationCard
        title="Kugeln von morgen verwendet"
        description={'Wird ausgelöst, sobald ein Mitarbeiter bei "Habe ich Kugeln von morgen verwendet?" mit Ja antwortet und eine Menge größer 0 einträgt.'}
        config={settings.kugelnUsed}
        placeholders={["{{store}}", "{{quantity}}", "{{employeeName}}", "{{date}}"]}
        onToggle={(enabled) => toggleEnabled("kugelnUsed", enabled)}
        onChange={(patch) => updateConfig("kugelnUsed", patch)}
        onSave={() => handleSave("kugelnUsed")}
        onTestSend={() => handleTestSend("kugelnUsed")}
        isSaving={saveMutation.isPending}
        isSendingTest={sendingTest === "kugelnUsed"}
      />

      {/* Notification 2: Kugeln leftover */}
      <NotificationCard
        title="Wenige Kugeln übrig (unter 30)"
        description={'Wird ausgelöst, sobald die Antwort auf "Wie viele Kugeln sind heute übrig geblieben?" unter 30 liegt.'}
        config={settings.kugelnLeftover}
        placeholders={["{{store}}", "{{leftover}}", "{{threshold}}", "{{employeeName}}", "{{date}}"]}
        onToggle={(enabled) => toggleEnabled("kugelnLeftover", enabled)}
        onChange={(patch) => updateConfig("kugelnLeftover", patch)}
        onSave={() => handleSave("kugelnLeftover")}
        onTestSend={() => handleTestSend("kugelnLeftover")}
        isSaving={saveMutation.isPending}
        isSendingTest={sendingTest === "kugelnLeftover"}
        onToggleStore={(store, enabled) => toggleStoreEnabled("kugelnLeftover", store, enabled)}
      />

      {/* Test send controls + reset */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Testversand & Zurücksetzen</CardTitle>
          <CardDescription>Store für Testmails wählen. Testmails werden immer gesendet, auch wenn eine Benachrichtigung deaktiviert ist.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={testStore} onValueChange={setTestStore}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STORES.map(store => (
                <SelectItem key={store} value={store}>{store}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            <RotateCcw size={14} className="mr-2" />
            Auf Standardtexte zurücksetzen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationCard({
  title,
  description,
  config,
  placeholders,
  onToggle,
  onChange,
  onSave,
  onTestSend,
  isSaving,
  isSendingTest,
  onToggleStore,
}: {
  title: string;
  description: string;
  config: EmailNotificationConfig;
  placeholders: string[];
  onToggle: (enabled: boolean) => void;
  onChange: (patch: Partial<EmailNotificationConfig>) => void;
  onSave: () => void;
  onTestSend: () => void;
  isSaving: boolean;
  isSendingTest: boolean;
  onToggleStore?: (store: string, enabled: boolean) => void;
}) {
  return (
    <Card className={config.enabled ? "border-green-200" : "border-gray-200 bg-gray-50"}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {title}
              {!onToggleStore && <Badge variant="outline" className="text-xs">Alle Stores</Badge>}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-sm font-medium ${config.enabled ? "text-green-700" : "text-gray-500"}`}>
              {config.enabled ? "Aktiv" : "Deaktiviert"}
            </span>
            <Switch checked={config.enabled} onCheckedChange={onToggle} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {onToggleStore && (
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Für welche Stores soll diese Meldung erscheinen?</Label>
            <div className="flex flex-wrap gap-3 rounded-md border bg-white p-3">
              {STORES.map((store) => {
                const enabled = isStoreEnabled(config, store);
                return (
                  <div key={store} className="flex items-center gap-2">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => onToggleStore(store, checked)}
                      id={`store-toggle-${title}-${store}`}
                    />
                    <Label htmlFor={`store-toggle-${title}-${store}`} className={`text-sm ${enabled ? "text-gray-900" : "text-gray-400"}`}>
                      {store}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <Label className="text-sm font-medium mb-1 block">Betreff</Label>
          <Input
            value={config.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
          />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">Inhalt</Label>
          <Textarea
            value={config.body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={7}
            className="font-mono text-sm"
          />
        </div>
        <div className="text-xs text-gray-500">
          Verfügbare Platzhalter: {placeholders.map(p => (
            <code key={p} className="bg-gray-100 px-1 py-0.5 rounded mx-0.5">{p}</code>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={onSave} disabled={isSaving} size="sm">
            <Save size={14} className="mr-2" />
            {isSaving ? "Speichert..." : "Speichern"}
          </Button>
          <Button onClick={onTestSend} disabled={isSendingTest} variant="outline" size="sm">
            {isSendingTest ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Send size={14} className="mr-2" />}
            Testmail senden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
