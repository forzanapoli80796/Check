import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StickyNote, Trash2, Plus, Edit2, Image as ImageIcon, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoreWhiteboard, InsertStoreWhiteboard } from "@shared/schema";
import type { EmployeeWorkflowState } from "@/lib/types";
import {
  RichTextEditor,
  WhiteboardMessage,
  whiteboardMessageHasText,
} from "@/components/whiteboard-rich-text";

const NOTE_COLORS = [
  { name: "Gelb", value: "yellow", bgClass: "bg-yellow-100", borderClass: "border-yellow-300" },
  { name: "Blau", value: "blue", bgClass: "bg-blue-100", borderClass: "border-blue-300" },
  { name: "Grün", value: "green", bgClass: "bg-green-100", borderClass: "border-green-300" },
  { name: "Rosa", value: "pink", bgClass: "bg-pink-100", borderClass: "border-pink-300" },
  { name: "Lila", value: "purple", bgClass: "bg-purple-100", borderClass: "border-purple-300" },
];

const EXPIRY_OPTIONS = [
  { label: "Kein Ablaufdatum", value: null },
  { label: "1 Stunde", hours: 1 },
  { label: "4 Stunden", hours: 4 },
  { label: "8 Stunden", hours: 8 },
  { label: "1 Tag", hours: 24 },
  { label: "3 Tage", hours: 72 },
  { label: "1 Woche", hours: 168 },
];

interface WhiteboardStepProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function WhiteboardStep({ state, updateState, goBack }: WhiteboardStepProps) {
  const { toast } = useToast();
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<StoreWhiteboard | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("none");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch whiteboard notes for selected store
  const { data: notes = [], isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ['/api/whiteboard', state.selectedStore],
    enabled: !!state.selectedStore,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertStoreWhiteboard) => {
      const response = await apiRequest('POST', '/api/whiteboard', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiteboard', state.selectedStore] });
      toast({
        title: "Notiz hinzugefügt",
        description: "Die Notiz wurde erfolgreich zum Whiteboard hinzugefügt.",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, message, editorName }: { id: string; message: string; editorName: string }) => {
      const response = await apiRequest('PATCH', `/api/whiteboard/${id}`, { message, editorName });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiteboard', state.selectedStore] });
      toast({
        title: "Notiz aktualisiert",
        description: "Die Notiz wurde erfolgreich bearbeitet.",
      });
      setEditingNote(null);
      setEmployeeName("");
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht bearbeitet werden.",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/whiteboard/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiteboard', state.selectedStore] });
      toast({
        title: "Notiz gelöscht",
        description: "Die Notiz wurde erfolgreich entfernt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setShowAddNote(false);
    setEmployeeName("");
    setMessage("");
    setSelectedColor("yellow");
    setSelectedExpiry("none");
    setUploadedImage(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Das Bild darf maximal 5MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result as string;
        const response = await apiRequest('POST', '/api/upload/whiteboard-image', { image: base64Image });
        const data = await response.json();
        setUploadedImage(data.imageUrl);
        toast({
          title: "Bild hochgeladen",
          description: "Das Bild wurde erfolgreich hochgeladen.",
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Das Bild konnte nicht hochgeladen werden.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddNote = () => {
    if (!employeeName.trim() || !whiteboardMessageHasText(message)) {
      toast({
        title: "Fehler",
        description: "Bitte Name und Nachricht eingeben.",
        variant: "destructive",
      });
      return;
    }

    if (!state.selectedStore) return;

    let expiresAt: Date | undefined;
    if (selectedExpiry !== "none") {
      const hours = parseInt(selectedExpiry);
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    createNoteMutation.mutate({
      storeName: state.selectedStore,
      employeeName: employeeName.trim(),
      message: message.trim(),
      color: selectedColor,
      imageUrl: uploadedImage,
      ...(expiresAt ? { expiresAt } : {}),
    } as any);
  };

  const handleEditNote = (note: StoreWhiteboard) => {
    setEditingNote(note);
    setMessage(note.message);
    setEmployeeName("");
  };

  const handleUpdateNote = () => {
    if (!editingNote || !whiteboardMessageHasText(message) || !employeeName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte Name und Nachricht eingeben.",
        variant: "destructive",
      });
      return;
    }

    updateNoteMutation.mutate({
      id: editingNote.id,
      message: message.trim(),
      editorName: employeeName.trim(),
    });
  };

  const getColorClasses = (color: string | null, isAdminNote?: boolean) => {
    if (isAdminNote) return { bgClass: "bg-red-600", borderClass: "border-red-700" };
    const colorObj = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];
    return { bgClass: colorObj.bgClass, borderClass: colorObj.borderClass };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpiryText = (expiresAt: Date | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Läuft ab in ${days} Tag${days > 1 ? 'en' : ''}`;
    if (hours > 0) return `Läuft ab in ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    return "Läuft bald ab";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Digitales Whiteboard - {state.selectedStore}</CardTitle>
        <p className="text-gray-600 mt-2">Team-Notizen mit Bildern und Ablaufdatum</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => setShowAddNote(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
          data-testid="button-add-note"
        >
          <Plus size={20} className="mr-2" />
          Neue Notiz erstellen
        </Button>

        {/* Add Note Form */}
        {showAddNote && (
          <Card className="border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="text-xl">Neue Notiz erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employeeName">Dein Name</Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Name eingeben"
                  data-testid="input-employee-name"
                />
              </div>
              <div>
                <Label htmlFor="message">Nachricht</Label>
                <RichTextEditor
                  id="message"
                  value={message}
                  onChange={setMessage}
                  placeholder="Nachricht eingeben..."
                  data-testid="input-message"
                />
              </div>
              <div>
                <Label>Farbe auswählen</Label>
                <div className="flex gap-2 mt-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-12 h-12 rounded-lg border-2 ${color.bgClass} ${
                        selectedColor === color.value ? 'border-gray-900 ring-2 ring-gray-900' : color.borderClass
                      }`}
                      data-testid={`button-color-${color.value}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="expiry">Ablaufdatum (optional)</Label>
                <Select value={selectedExpiry} onValueChange={setSelectedExpiry}>
                  <SelectTrigger id="expiry" data-testid="select-expiry">
                    <SelectValue placeholder="Ablaufdatum wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Ablaufdatum</SelectItem>
                    <SelectItem value="1">1 Stunde</SelectItem>
                    <SelectItem value="4">4 Stunden</SelectItem>
                    <SelectItem value="8">8 Stunden</SelectItem>
                    <SelectItem value="24">1 Tag</SelectItem>
                    <SelectItem value="72">3 Tage</SelectItem>
                    <SelectItem value="168">1 Woche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bild hinzufügen (optional)</Label>
                <div className="mt-2">
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
                    className="w-full"
                    data-testid="button-upload-image"
                  >
                    <ImageIcon size={16} className="mr-2" />
                    {isUploading ? "Wird hochgeladen..." : uploadedImage ? "Bild ändern" : "Bild hochladen"}
                  </Button>
                  {uploadedImage && (
                    <div className="mt-2">
                      <img src={`/api/whiteboard-image?path=${encodeURIComponent(uploadedImage)}`} alt="Vorschau" className="max-h-40 rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  data-testid="button-cancel-note"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={createNoteMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-note"
                >
                  {createNoteMutation.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => {
          setEditingNote(null);
          setMessage("");
          setEmployeeName("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notiz bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editorName">Dein Name</Label>
                <Input
                  id="editorName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Name eingeben"
                  data-testid="input-editor-name"
                />
              </div>
              <div>
                <Label htmlFor="editMessage">Nachricht</Label>
                <RichTextEditor
                  id="editMessage"
                  value={message}
                  onChange={setMessage}
                  placeholder="Nachricht eingeben..."
                  data-testid="input-edit-message"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingNote(null);
                    setMessage("");
                    setEmployeeName("");
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleUpdateNote}
                  disabled={updateNoteMutation.isPending}
                  data-testid="button-update-note"
                >
                  {updateNoteMutation.isPending ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notes Display */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Lade Notizen...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Noch keine Notizen vorhanden</p>
            <p className="text-gray-500 text-sm mt-2">Erstelle die erste Notiz für dein Team!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isAdminNote = (note as any).isAdminNote === true;
              const { bgClass, borderClass } = getColorClasses(note.color, isAdminNote);
              const expiryText = getExpiryText((note as any).expiresAt);
              const editHistory = (note.editedBy as any[]) || [];
              
              return (
                <Card 
                  key={note.id} 
                  className={`${bgClass} border-2 ${borderClass}`}
                  data-testid={`card-note-${note.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold ${isAdminNote ? "text-white" : "text-gray-900"}`}>{note.employeeName}</p>
                          {isAdminNote && (
                            <span className="text-xs font-bold bg-white text-red-600 px-2 py-0.5 rounded-full shrink-0">ADMIN</span>
                          )}
                        </div>
                        <p className={`text-xs ${isAdminNote ? "text-red-100" : "text-gray-600"}`}>{formatDate(note.createdAt)}</p>
                        {expiryText && (
                          <p className={`text-xs flex items-center gap-1 mt-1 ${isAdminNote ? "text-red-200" : "text-orange-600"}`}>
                            <Clock size={12} /> {expiryText}
                          </p>
                        )}
                      </div>
                      {!isAdminNote && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          data-testid={`button-edit-note-${note.id}`}
                        >
                          <Edit2 size={16} className="text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </Button>
                      </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <WhiteboardMessage
                      message={note.message}
                      className={isAdminNote ? "text-white font-medium" : "text-gray-800"}
                    />
                    {note.imageUrl && (
                      <img src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`} alt="Notiz Bild" className="max-h-60 rounded-lg mt-2" />
                    )}
                    {editHistory.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${isAdminNote ? "border-red-500" : "border-gray-300"}`}>
                        <p className={`text-xs font-semibold flex items-center gap-1 ${isAdminNote ? "text-red-100" : "text-gray-700"}`}>
                          <User size={12} /> Bearbeitungsverlauf:
                        </p>
                        <div className="mt-1 space-y-1">
                          {editHistory.map((edit: any, idx: number) => (
                            <p key={idx} className={`text-xs ${isAdminNote ? "text-red-200" : "text-gray-600"}`}>
                              {edit.name} • {formatDate(edit.editedAt)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Button
          onClick={() => updateState({ step: 'area' })}
          variant="outline"
          className="w-full"
          data-testid="button-back"
        >
          Zurück
        </Button>
      </CardContent>
    </Card>
  );
}
