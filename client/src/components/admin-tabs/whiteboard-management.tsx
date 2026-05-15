import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Plus, Edit2, Trash2, Clock, User, Image as ImageIcon, Store, RotateCcw, Loader2 as Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoreWhiteboard, InsertStoreWhiteboard } from "@shared/schema";
import { STORES } from "@/lib/types";


function WhiteboardSettings() {
  const { toast } = useToast();

  const { data: skipButtonData } = useQuery({
    queryKey: ["/api/app-settings/whiteboard_skip_button_enabled"],
    retry: false,
  });

  const skipButtonEnabled = (skipButtonData as any)?.settingValue === "true";

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

  const handleReset = () => {
    if (confirm("Möchtest du wirklich alle Whiteboard-Bestätigungen zurücksetzen? Alle Mitarbeiter müssen das Whiteboard heute erneut lesen.")) {
      resetWhiteboardMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Whiteboard Einstellungen</CardTitle>
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
            onClick={handleReset}
            disabled={resetWhiteboardMutation.isPending}
            variant="destructive"
            data-testid="button-reset-whiteboard"
          >
            {resetWhiteboardMutation.isPending ? (
              <><Loader className="w-4 h-4 mr-2 animate-spin" />Wird zurückgesetzt...</>
            ) : (
              <><RotateCcw className="w-4 h-4 mr-2" />Whiteboard-Erzwingung zurücksetzen</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const NOTE_COLORS = [
  { name: "Gelb", value: "yellow", bgClass: "bg-yellow-100", borderClass: "border-yellow-300", dotClass: "bg-yellow-400" },
  { name: "Blau", value: "blue", bgClass: "bg-blue-100", borderClass: "border-blue-300", dotClass: "bg-blue-400" },
  { name: "Grün", value: "green", bgClass: "bg-green-100", borderClass: "border-green-300", dotClass: "bg-green-400" },
  { name: "Rosa", value: "pink", bgClass: "bg-pink-100", borderClass: "border-pink-300", dotClass: "bg-pink-400" },
  { name: "Lila", value: "purple", bgClass: "bg-purple-100", borderClass: "border-purple-300", dotClass: "bg-purple-400" },
];

const EXPIRY_OPTIONS = [
  { label: "Kein Ablaufdatum", value: "none" },
  { label: "1 Stunde", value: "1" },
  { label: "4 Stunden", value: "4" },
  { label: "8 Stunden", value: "8" },
  { label: "1 Tag", value: "24" },
  { label: "3 Tage", value: "72" },
  { label: "1 Woche", value: "168" },
];

function formatDateTime(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getExpiryText(expiresAt: Date | string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return "Abgelaufen";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `Läuft ab in ${days} Tag${days > 1 ? "en" : ""}`;
  if (hours > 0) return `Läuft ab in ${hours} Stunde${hours > 1 ? "n" : ""}`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `Läuft ab in ${minutes} Minute${minutes !== 1 ? "n" : ""}`;
}

function getColorClasses(color: string | null) {
  return NOTE_COLORS.find(c => c.value === color) ?? NOTE_COLORS[0];
}

interface NoteCardProps {
  note: StoreWhiteboard;
  storeName: string;
  onEdit: (note: StoreWhiteboard) => void;
  onDelete: (id: string, storeName: string) => void;
  isDeleting: boolean;
}

function NoteCard({ note, storeName, onEdit, onDelete, isDeleting }: NoteCardProps) {
  const colors = getColorClasses(note.color);
  const expiryText = getExpiryText((note as any).expiresAt ?? null);
  const editHistory: any[] = (note.editedBy as any[]) ?? [];

  return (
    <Card className={`${colors.bgClass} border-2 ${colors.borderClass}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{note.employeeName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(note.createdAt)}</p>
            {expiryText && (
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <Clock size={11} /> {expiryText}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(note)}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <Edit2 size={15} className="text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(note.id, storeName)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <Trash2 size={15} className="text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.message}</p>
        {note.imageUrl && (
          <img
            src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`}
            alt="Notiz Bild"
            className="max-h-48 rounded-lg mt-1"
          />
        )}
        {editHistory.length > 0 && (
          <div className="pt-2 border-t border-gray-300">
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <User size={11} /> Bearbeitungsverlauf:
            </p>
            {editHistory.map((edit: any, idx: number) => (
              <p key={idx} className="text-xs text-gray-500 mt-0.5">
                {edit.name} · {formatDateTime(edit.editedAt)}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StoreColumnProps {
  storeName: string;
  onAddNote: (store: string) => void;
  onEdit: (note: StoreWhiteboard) => void;
  onDelete: (id: string, storeName: string) => void;
  deletingId: string | null;
}

function StoreColumn({ storeName, onAddNote, onEdit, onDelete, deletingId }: StoreColumnProps) {
  const { data: notes = [], isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ["/api/whiteboard", storeName],
    refetchInterval: 30000,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-gray-600" />
          <h3 className="font-bold text-lg text-gray-800">{storeName}</h3>
          <Badge variant="secondary" className="text-xs">
            {notes.length} {notes.length === 1 ? "Eintrag" : "Einträge"}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => onAddNote(storeName)}
          className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
        >
          <Plus size={14} className="mr-1" />
          Neue Info
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-gray-400 text-sm">Lade Einträge…</div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <StickyNote size={32} className="mb-2" />
          <p className="text-sm">Keine Einträge vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              storeName={storeName}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingId === note.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WhiteboardManagement() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addDialogStore, setAddDialogStore] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<StoreWhiteboard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [addColor, setAddColor] = useState("yellow");
  const [addExpiry, setAddExpiry] = useState("none");
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const resetAddForm = () => {
    setAddName("");
    setAddMessage("");
    setAddColor("yellow");
    setAddExpiry("none");
    setAddImageUrl(null);
    setAddDialogStore(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertStoreWhiteboard) => {
      const res = await apiRequest("POST", "/api/whiteboard", data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiteboard", variables.storeName] });
      toast({ title: "Info hinzugefügt", description: "Der Eintrag wurde erfolgreich erstellt." });
      resetAddForm();
    },
    onError: () => {
      toast({ title: "Fehler", description: "Der Eintrag konnte nicht erstellt werden.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, message, editorName }: { id: string; message: string; editorName: string }) => {
      const res = await apiRequest("PATCH", `/api/whiteboard/${id}`, { message, editorName });
      return res.json();
    },
    onSuccess: () => {
      STORES.forEach(store => {
        queryClient.invalidateQueries({ queryKey: ["/api/whiteboard", store] });
      });
      toast({ title: "Info aktualisiert", description: "Der Eintrag wurde erfolgreich bearbeitet." });
      setEditingNote(null);
      setEditName("");
      setEditMessage("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Der Eintrag konnte nicht bearbeitet werden.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string; storeName: string }) => {
      const res = await apiRequest("DELETE", `/api/whiteboard/${id}`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiteboard", variables.storeName] });
      setDeletingId(null);
      toast({ title: "Info gelöscht", description: "Der Eintrag wurde entfernt." });
    },
    onError: () => {
      setDeletingId(null);
      toast({ title: "Fehler", description: "Der Eintrag konnte nicht gelöscht werden.", variant: "destructive" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Datei zu groß", description: "Das Bild darf maximal 5 MB groß sein.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result as string;
        const res = await apiRequest("POST", "/api/upload/whiteboard-image", { image: base64Image });
        const data = await res.json();
        setAddImageUrl(data.imageUrl);
        toast({ title: "Bild hochgeladen" });
      } catch {
        toast({ title: "Fehler", description: "Bild konnte nicht hochgeladen werden.", variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!addName.trim() || !addMessage.trim() || !addDialogStore) {
      toast({ title: "Fehler", description: "Bitte Name und Nachricht eingeben.", variant: "destructive" });
      return;
    }
    let expiresAt: Date | undefined;
    if (addExpiry !== "none") {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(addExpiry));
    }
    createMutation.mutate({
      storeName: addDialogStore,
      employeeName: addName.trim(),
      message: addMessage.trim(),
      color: addColor,
      imageUrl: addImageUrl,
      ...(expiresAt ? { expiresAt } : {}),
    } as any);
  };

  const handleEdit = (note: StoreWhiteboard) => {
    setEditingNote(note);
    setEditMessage(note.message);
    setEditName("");
  };

  const handleUpdate = () => {
    if (!editingNote || !editMessage.trim() || !editName.trim()) {
      toast({ title: "Fehler", description: "Bitte Name und Nachricht eingeben.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editingNote.id, message: editMessage.trim(), editorName: editName.trim() });
  };

  const handleDelete = (id: string, storeName: string) => {
    setDeletingId(id);
    deleteMutation.mutate({ id, storeName });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Digitales Whiteboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Übersicht aller Einträge pro Store – sekundengenau aktualisiert</p>
        </div>
      </div>

      {/* 3-column store grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STORES.map(store => (
          <StoreColumn
            key={store}
            storeName={store}
            onAddNote={setAddDialogStore}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={!!addDialogStore} onOpenChange={open => { if (!open) resetAddForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Info hinzufügen – {addDialogStore}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Name eingeben"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="add-message">Nachricht</Label>
              <Textarea
                id="add-message"
                value={addMessage}
                onChange={e => setAddMessage(e.target.value)}
                placeholder="Nachricht eingeben…"
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Farbe</Label>
              <div className="flex gap-2 mt-2">
                {NOTE_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setAddColor(color.value)}
                    title={color.name}
                    className={`w-10 h-10 rounded-lg border-2 ${color.bgClass} ${
                      addColor === color.value
                        ? "border-gray-900 ring-2 ring-gray-900"
                        : color.borderClass
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="add-expiry">Ablaufdatum (optional)</Label>
              <Select value={addExpiry} onValueChange={setAddExpiry}>
                <SelectTrigger id="add-expiry" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bild (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full mt-1"
              >
                <ImageIcon size={15} className="mr-2" />
                {isUploading ? "Wird hochgeladen…" : addImageUrl ? "Bild ändern" : "Bild hochladen"}
              </Button>
              {addImageUrl && (
                <img
                  src={`/api/whiteboard-image?path=${encodeURIComponent(addImageUrl)}`}
                  alt="Vorschau"
                  className="max-h-36 rounded-lg mt-2"
                />
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetAddForm}>Abbrechen</Button>
              <Button
                onClick={handleAdd}
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? "Wird gespeichert…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Einstellungen */}
      <WhiteboardSettings />

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={open => { if (!open) { setEditingNote(null); setEditName(""); setEditMessage(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Info bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-700">Ursprünglicher Eintrag von {editingNote?.employeeName}</p>
              <p className="mt-1 text-xs">{formatDateTime(editingNote?.createdAt ?? null)}</p>
            </div>
            <div>
              <Label htmlFor="edit-name">Dein Name (als Bearbeiter)</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Name eingeben"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-message">Nachricht</Label>
              <Textarea
                id="edit-message"
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
                placeholder="Nachricht eingeben…"
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => { setEditingNote(null); setEditName(""); setEditMessage(""); }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? "Wird gespeichert…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
