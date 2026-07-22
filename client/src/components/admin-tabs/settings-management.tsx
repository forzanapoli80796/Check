import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, Save, Key, LogOut, Loader2, Download, Github, CheckCircle2, XCircle, Clock, Info, Upload, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  const { data: jsonBackupData, refetch: refetchJsonBackup } = useQuery({
    queryKey: ["/api/app-settings/json_backup_last"],
    retry: false,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast({ title: "Ungültige Datei", description: "Bitte eine .json Backup-Datei auswählen.", variant: "destructive" });
      return;
    }
    setRestoreFile(file);
    setShowRestoreConfirm(true);
    e.target.value = "";
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    setShowRestoreConfirm(false);
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Wiederherstellung erfolgreich", description: "Alle Daten wurden aus dem Backup wiederhergestellt." });
        queryClient.invalidateQueries();
      } else {
        toast({ title: "Fehler", description: result.message || "Wiederherstellung fehlgeschlagen.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Fehler", description: "Datei konnte nicht gelesen werden.", variant: "destructive" });
    } finally {
      setIsRestoring(false);
      setRestoreFile(null);
    }
  };

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
      refetchJsonBackup();
    } catch {
      toast({ title: "Fehler", description: "Backup konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const { data: githubStatus, refetch: refetchGithubStatus } = useQuery<{ lastBackup: string | null; hasToken: boolean }>({
    queryKey: ["/api/admin/github-backup/status"],
    retry: false,
  });

  const [isGithubPushing, setIsGithubPushing] = useState(false);
  const [githubResult, setGithubResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleGithubBackup = async () => {
    setIsGithubPushing(true);
    setGithubResult(null);
    try {
      const res = await fetch("/api/admin/github-backup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const fileInfo = data.filesCount ? ` (${data.filesCount} Dateien)` : "";
        setGithubResult({ ok: true, msg: `Quellcode erfolgreich auf GitHub gesichert${fileInfo}.` });
        refetchGithubStatus();
      } else {
        setGithubResult({ ok: false, msg: data.message || "Backup fehlgeschlagen." });
      }
    } catch {
      setGithubResult({ ok: false, msg: "Verbindungsfehler." });
    } finally {
      setIsGithubPushing(false);
    }
  };

  const formatLastBackup = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
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
            Alle Daten als JSON-Datei herunterladen – Kategorien, Aufgaben, Checklisten, Teig-Daten, Whiteboard-Einträge, Inventar, Mitarbeiter-Nachrichten und Einstellungen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(jsonBackupData as any)?.settingValue ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="shrink-0" />
              Letzter Backup: <span className="font-medium text-gray-800">
                {new Date((jsonBackupData as any).settingValue).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Clock size={14} />
              Noch kein Backup durchgeführt
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleBackupDownload}
              disabled={isDownloading || isRestoring}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isDownloading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird erstellt...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" />Backup herunterladen</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring || isDownloading}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isRestoring ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird wiederhergestellt...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Backup einspielen</>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* GitHub-Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5 text-gray-800" />
            GitHub-Backup
          </CardTitle>
          <CardDescription>
            Den kompletten Webapp-Quellcode ins GitHub-Repo sichern –{" "}
            <span className="font-medium text-gray-700">github.com/forzanapoli80796/check</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token-Status */}
          {githubStatus && !githubStatus.hasToken && (
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
              <XCircle size={16} className="text-orange-600 mt-0.5 shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold">GITHUB_TOKEN fehlt</p>
                <p className="mt-0.5">Bitte Token in den Replit Secrets eintragen (Schlüssel-Symbol links in Replit). Anleitung unten.</p>
              </div>
            </div>
          )}

          {/* Letzter Backup */}
          {githubStatus?.lastBackup && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={14} className="shrink-0" />
              Letzter Backup: <span className="font-medium text-gray-800">{formatLastBackup(githubStatus.lastBackup)}</span>
            </div>
          )}
          {githubStatus && !githubStatus.lastBackup && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Clock size={14} />
              Noch kein Backup durchgeführt
            </p>
          )}

          {/* Ergebnis nach Klick */}
          {githubResult && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              githubResult.ok
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {githubResult.ok
                ? <CheckCircle2 size={16} className="shrink-0" />
                : <XCircle size={16} className="shrink-0" />}
              {githubResult.msg}
            </div>
          )}

          {/* Button */}
          <Button
            onClick={handleGithubBackup}
            disabled={isGithubPushing}
            className="bg-gray-900 hover:bg-gray-700 text-white"
          >
            {isGithubPushing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Wird gesichert…</>
            ) : (
              <><Github className="w-4 h-4 mr-2" />Jetzt auf GitHub sichern</>
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

      {/* Restore confirmation dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Backup einspielen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Datei: <strong>{restoreFile?.name}</strong>
              </span>
              <span className="block font-semibold text-red-700">
                Achtung: Alle aktuellen Daten (Kategorien, Aufgaben, Checklisten, Whiteboard usw.) werden unwiderruflich durch die Backup-Daten ersetzt.
              </span>
              <span className="block">Bist du sicher?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreFile(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Ja, jetzt wiederherstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
