import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, StickyNote, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoreWhiteboard, InsertStoreWhiteboard } from "@shared/schema";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import { useLanguage } from "@/contexts/LanguageContext";

const STORES = ["JP23", "KP5", "TS17"];
const NOTE_COLORS = [
  { name: "Gelb", value: "yellow", bgClass: "bg-yellow-100", borderClass: "border-yellow-300" },
  { name: "Blau", value: "blue", bgClass: "bg-blue-100", borderClass: "border-blue-300" },
  { name: "Grün", value: "green", bgClass: "bg-green-100", borderClass: "border-green-300" },
  { name: "Rosa", value: "pink", bgClass: "bg-pink-100", borderClass: "border-pink-300" },
  { name: "Lila", value: "purple", bgClass: "bg-purple-100", borderClass: "border-purple-300" },
];

export default function Whiteboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");

  // Fetch whiteboard notes for selected store
  const { data: notes = [], isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ['/api/whiteboard', selectedStore],
    enabled: !!selectedStore,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: InsertStoreWhiteboard) => {
      const response = await apiRequest('POST', '/api/whiteboard', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/whiteboard', selectedStore] });
      toast({
        title: "Notiz hinzugefügt",
        description: "Die Notiz wurde erfolgreich zum Whiteboard hinzugefügt.",
      });
      setShowAddNote(false);
      setEmployeeName("");
      setMessage("");
      setSelectedColor("yellow");
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht hinzugefügt werden.",
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
      queryClient.invalidateQueries({ queryKey: ['/api/whiteboard', selectedStore] });
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

  const handleAddNote = () => {
    if (!employeeName.trim() || !message.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte Name und Nachricht eingeben.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStore) return;

    createNoteMutation.mutate({
      storeName: selectedStore,
      employeeName: employeeName.trim(),
      message: message.trim(),
      color: selectedColor,
    });
  };

  const getColorClasses = (color: string | null) => {
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

  // Store selection view
  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex justify-center py-6">
          <Link href="/">
            <img 
              src={forzaCheckLogo} 
              alt="ForzaCheck Logo" 
              className="h-16 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Digitales Whiteboard</CardTitle>
                <p className="text-center text-gray-600 mt-2">
                  Wähle deinen Standort aus
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {STORES.map((store) => (
                  <Button
                    key={store}
                    onClick={() => setSelectedStore(store)}
                    className="w-full h-16 text-xl"
                    variant="outline"
                    data-testid={`button-select-store-${store}`}
                  >
                    {store}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="py-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="px-8"
            data-testid="button-back-home"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  // Whiteboard view
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex justify-center py-6">
        <Link href="/">
          <img 
            src={forzaCheckLogo} 
            alt="ForzaCheck Logo" 
            className="h-16 object-contain cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
      
      <div className="flex-1 px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Whiteboard - {selectedStore}</h1>
              <p className="text-gray-600 mt-1">Notizen für das Team</p>
            </div>
            <Button
              onClick={() => setShowAddNote(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-add-note"
            >
              <Plus size={20} className="mr-2" />
              Neue Notiz
            </Button>
          </div>

          {/* Add Note Form */}
          {showAddNote && (
            <Card className="mb-6 border-2 border-blue-300">
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
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    rows={4}
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
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddNote(false);
                      setEmployeeName("");
                      setMessage("");
                      setSelectedColor("yellow");
                    }}
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

          {/* Notes Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Lade Notizen...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <StickyNote size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Noch keine Notizen vorhanden</p>
              <p className="text-gray-500 text-sm mt-2">Erstelle die erste Notiz für dein Team!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => {
                const { bgClass, borderClass } = getColorClasses(note.color);
                return (
                  <Card 
                    key={note.id} 
                    className={`${bgClass} border-2 ${borderClass} relative`}
                    data-testid={`card-note-${note.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{note.employeeName}</p>
                          <p className="text-xs text-gray-600">{formatDate(note.createdAt)}</p>
                        </div>
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 whitespace-pre-wrap">{note.message}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="py-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => setSelectedStore(null)}
          className="px-8"
          data-testid="button-change-store"
        >
          Standort wechseln
        </Button>
      </div>
    </div>
  );
}
