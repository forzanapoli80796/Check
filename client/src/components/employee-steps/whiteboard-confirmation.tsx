import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SlideToUnlock } from "@/components/ui/slide-to-unlock";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Plus, Edit2, Trash2, Image as ImageIcon, CheckSquare, Info } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { StoreWhiteboard, InsertStoreWhiteboard } from "@shared/schema";
import type { EmployeeWorkflowState } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const NOTE_COLORS = [
  "yellow",
  "blue", 
  "green",
  "pink",
  "orange"
] as const;

interface WhiteboardConfirmationProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
  onConfirmed: () => void;
}

// Funktion für automatische Farbrotation
function getNextColor(existingNotes: StoreWhiteboard[]): string {
  if (!existingNotes || existingNotes.length === 0) return NOTE_COLORS[0];
  
  const lastNote = existingNotes[0]; // Neueste Notiz ist erste im Array
  const lastColorIndex = NOTE_COLORS.indexOf(lastNote.color as any);
  const nextIndex = (lastColorIndex + 1) % NOTE_COLORS.length;
  return NOTE_COLORS[nextIndex];
}

export default function WhiteboardConfirmation({ state, updateState, goBack, onConfirmed }: WhiteboardConfirmationProps) {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<StoreWhiteboard | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [message, setMessage] = useState("");
  const [entryType, setEntryType] = useState<"task" | "info">("info");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch whiteboard notes for the selected store
  const { data: notes, isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ["/api/whiteboard", state.selectedStore],
    enabled: !!state.selectedStore,
  });

  // Fetch app setting for skip button visibility
  const { data: skipButtonSetting } = useQuery<{ settingValue: string }>({
    queryKey: ["/api/app-settings/whiteboard_skip_button_enabled"],
  });

  const showSkipButton = skipButtonSetting?.settingValue === 'true';

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

  // Save read confirmation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      await apiRequest("POST", "/api/whiteboard-reads", {
        employeeName: state.employeeName,
        store: state.selectedStore,
        shift: state.selectedShift,
        date: today,
      });
    },
    onSuccess: () => {
      onConfirmed();
    },
    onError: (error) => {
      console.error('Error confirming whiteboard read:', error);
      setIsConfirming(false);
      toast({
        title: "Fehler",
        description: "Die Bestätigung konnte nicht gespeichert werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setShowAddNote(false);
    setEmployeeName("");
    setMessage("");
    setEntryType("info");
    setUploadedImage(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    if (!employeeName.trim() || !message.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte gib deinen Namen und eine Nachricht ein.",
        variant: "destructive",
      });
      return;
    }

    // Automatische Farbzuweisung basierend auf vorherigen Notizen
    const autoColor = getNextColor(notes || []);

    const newNote: InsertStoreWhiteboard = {
      storeName: state.selectedStore!,
      employeeName: employeeName.trim(),
      message: message.trim(),
      entryType: entryType,
      color: autoColor,
      imageUrl: uploadedImage,
    };

    createNoteMutation.mutate(newNote);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !employeeName.trim() || !message.trim()) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte gib deinen Namen und eine Nachricht ein.",
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

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Möchtest du diese Notiz wirklich löschen?")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const startEditNote = (note: StoreWhiteboard) => {
    setEditingNote(note);
    setMessage(note.message);
    setEmployeeName("");
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    await confirmMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const hasNotes = notes && notes.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Add Note Button */}
      <Button
        onClick={() => setShowAddNote(true)}
        className="w-full"
        data-testid="button-add-whiteboard-note"
      >
        <Plus className="w-4 h-4 mr-2" />
        Neue Mitteilung hinzufügen
      </Button>

      {/* Notes List */}
      {hasNotes ? (
        <div className="space-y-3">
          {notes.map((note) => {
            const bgColorClass = {
              yellow: 'bg-yellow-50 border-yellow-200',
              blue: 'bg-blue-50 border-blue-200',
              green: 'bg-green-50 border-green-200',
              pink: 'bg-pink-50 border-pink-200',
              orange: 'bg-orange-50 border-orange-200',
            }[note.color || 'yellow'] || 'bg-yellow-50 border-yellow-200';

            const isTask = (note as any).entryType === 'task';

            return (
              <div 
                key={note.id} 
                className={`${bgColorClass} border p-4 rounded relative`}
                data-testid={`whiteboard-note-${note.id}`}
              >
                {/* Icon für Eintragstyp */}
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isTask ? 'text-blue-600' : 'text-gray-600'}`}>
                    {isTask ? <CheckSquare size={20} /> : <Info size={20} />}
                  </div>
                  <div className="flex-1">
                    {note.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`}
                          alt=""
                          className="w-full max-h-80 object-contain rounded"
                        />
                      </div>
                    )}
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed mb-3">
                      {note.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-300">
                  <span>Von: {note.employeeName}</span>
                  <span>
                    {format(new Date(note.createdAt!), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditNote(note)}
                    data-testid={`button-edit-note-${note.id}`}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    data-testid={`button-delete-note-${note.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Löschen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine aktuellen Mitteilungen</p>
        </div>
      )}

      {/* Confirmation Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-900 font-medium text-center">
            ✓ Durch das Schieben des Sliders bestätige ich, dass ich alle Mitteilungen gelesen und zur Kenntnis genommen habe.
          </p>
        </CardContent>
      </Card>

      {/* Slide to Unlock */}
      <SlideToUnlock
        onUnlock={handleConfirm}
        text="Zum Bestätigen schieben"
        isLoading={isConfirming}
        disabled={isConfirming}
      />

      {/* Mobile-freundliche Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => updateState({ step: 'area' })}
          className="w-full sm:flex-1 h-12 text-base"
          data-testid="button-back-to-area"
        >
          ← Zurück zur Startseite
        </Button>
        
        {showSkipButton && (
          <Button
            variant="secondary"
            onClick={() => onConfirmed()}
            className="w-full sm:flex-1 h-12 text-base"
            data-testid="button-skip-whiteboard"
          >
            Beim nächsten Mal trotzdem erzwingen
          </Button>
        )}
      </div>

      {/* Add/Edit Note Dialog */}
      <Dialog open={showAddNote || editingNote !== null} onOpenChange={(open) => {
        if (!open) {
          setShowAddNote(false);
          setEditingNote(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Mitteilung bearbeiten' : 'Neue Mitteilung'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="employee-name">Dein Name</Label>
              <Input
                id="employee-name"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Name eingeben"
                data-testid="input-note-employee-name"
              />
            </div>

            <div>
              <Label htmlFor="message">Mitteilung</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mitteilung eingeben..."
                rows={4}
                data-testid="input-note-message"
              />
            </div>

            {!editingNote && (
              <>
                <div>
                  <Label>Eintragstyp</Label>
                  <ToggleGroup 
                    type="single" 
                    value={entryType}
                    onValueChange={(value) => value && setEntryType(value as "task" | "info")}
                    className="justify-start mt-2"
                  >
                    <ToggleGroupItem value="info" aria-label="Information">
                      <Info className="h-4 w-4 mr-2" />
                      Information
                    </ToggleGroupItem>
                    <ToggleGroupItem value="task" aria-label="Aufgabe">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Aufgabe
                    </ToggleGroupItem>
                  </ToggleGroup>
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
                    className="w-full mt-2"
                    data-testid="button-upload-image"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird hochgeladen...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {uploadedImage ? 'Bild ändern' : 'Bild hochladen'}
                      </>
                    )}
                  </Button>
                  {uploadedImage && (
                    <div className="mt-2">
                      <img
                        src={`/api/whiteboard-image?path=${encodeURIComponent(uploadedImage)}`}
                        alt="Vorschau"
                        className="w-full max-h-40 object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddNote(false);
                  setEditingNote(null);
                  resetForm();
                }}
                className="flex-1"
                data-testid="button-cancel-note"
              >
                Abbrechen
              </Button>
              <Button
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                className="flex-1"
                data-testid="button-save-note"
              >
                {(createNoteMutation.isPending || updateNoteMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  editingNote ? 'Aktualisieren' : 'Hinzufügen'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
