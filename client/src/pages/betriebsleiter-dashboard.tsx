import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, X, Camera, FileText } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Category, InsertChecklist } from "@shared/schema";
import { STORES } from "@/lib/types";

export default function BetriebsleiterDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [taskImages, setTaskImages] = useState<Record<string, string[]>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  // Nur Betriebsleiter-Kategorie laden
  const betriebsleiterCategory = categories.find(c => c.name.toLowerCase().includes('betriebsleiter'));

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!betriebsleiterCategory
  });

  // Nur Aufgaben für Betriebsleiter-Kategorie
  const betriebsleiterTasks = tasks.filter(t => t.categoryId === betriebsleiterCategory?.id);

  const submitMutation = useMutation({
    mutationFn: async (checklist: InsertChecklist & { images?: string[]; taskImages?: Record<string, string[]>; taskNotes?: Record<string, string> }) => {
      console.log("Mutation started with data:", checklist);
      const response = await apiRequest('POST', '/api/checklists', checklist);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich eingereicht",
        description: "Ihre Betriebsleiter-Aufgaben wurden erfolgreich abgeschlossen.",
      });
      // Formular zurücksetzen
      setSelectedStore('');
      setCompletedTasks([]);
      setTaskImages({});
      setTaskNotes({});
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Beim Einreichen ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  });

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        try {
          // Berechne neue Dimensionen unter Beibehaltung des Seitenverhältnisses
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = (width * maxWidth) / height;
              height = maxWidth;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Weißer Hintergrund für bessere JPEG-Kompatibilität
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          // Bild zeichnen
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Image load failed'));
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          // Überprüfe Dateigröße
          const maxSizeInMB = 10;
          if (file.size > maxSizeInMB * 1024 * 1024) {
            toast({
              title: "Datei zu groß",
              description: `Bitte wählen Sie ein Bild unter ${maxSizeInMB}MB.`,
              variant: "destructive",
            });
            continue;
          }

          const compressedBase64 = await compressImage(file);
          setTaskImages(prev => ({
            ...prev,
            [taskId]: [...(prev[taskId] || []), compressedBase64]
          }));
          
          console.log('Bild erfolgreich komprimiert und hinzugefügt');
        } catch (error) {
          console.error('Fehler beim Komprimieren des Bildes:', error);
          toast({
            title: "Fehler",
            description: "Bild konnte nicht verarbeitet werden.",
            variant: "destructive",
          });
        }
      }
    }
    
    // Input zurücksetzen für erneute Auswahl
    event.target.value = '';
  };

  const removeTaskImage = (taskId: string, imageIndex: number) => {
    setTaskImages(prev => ({
      ...prev,
      [taskId]: prev[taskId]?.filter((_, i) => i !== imageIndex) || []
    }));
  };

  const handleNoteChange = (taskId: string, note: string) => {
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: note
    }));
  };

  const handleSubmit = () => {
    console.log("Debug values:", {
      selectedStore,
      betriebsleiterCategory: betriebsleiterCategory?.id,
      completedTasks
    });

    if (!selectedStore || selectedStore.trim() === '') {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte wählen Sie einen Store aus.",
        variant: "destructive",
      });
      return;
    }

    if (!betriebsleiterCategory) {
      toast({
        title: "Fehler",
        description: "Betriebsleiter-Kategorie nicht gefunden.",
        variant: "destructive",
      });
      return;
    }

    // Alle Bilder zu einem Array zusammenfassen
    const allImages = Object.values(taskImages).flat();
    
    const checklistData: InsertChecklist & { images?: string[]; taskImages?: Record<string, string[]>; taskNotes?: Record<string, string> } = {
      categoryId: betriebsleiterCategory.id,
      store: selectedStore,
      employeeName: "Betriebsleiter",
      shiftType: "Standard",
      completedTasks,
      images: allImages,
      taskImages: taskImages,
      taskNotes: taskNotes,
    };

    console.log("Submitting checklist:", checklistData);
    console.log("Store check passed - submitting now");
    submitMutation.mutate(checklistData);
  };

  if (!betriebsleiterCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Logo Header */}
        <div className="flex justify-center py-6">
          <img 
            src={forzaCheckLogo} 
            alt="ForzaCheck Logo" 
            className="h-16 object-contain"
          />
        </div>
        
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">
                  Betriebsleiter-Kategorie muss erst im Admin-Bereich erstellt werden.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Footer mit Zurück Button */}
        <div className="py-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="px-8"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-6">
        <img 
          src={forzaCheckLogo} 
          alt="ForzaCheck Logo" 
          className="h-16 object-contain"
        />
      </div>
      
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Betriebsleiter Aufgaben</h1>
            <p className="text-gray-600">Ihre täglichen Aufgaben und Kontrollen</p>
          </div>

        <div className="space-y-6">
          {/* Store-Auswahl */}
          <Card>
            <CardHeader>
              <CardTitle>Store auswählen</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedStore} 
                onValueChange={(value) => {
                  console.log("Store selected:", value);
                  setSelectedStore(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Store auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStore && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Store {selectedStore} ausgewählt
                </p>
              )}
            </CardContent>
          </Card>



          {/* Aufgaben */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle size={20} />
                Betriebsleiter Aufgaben ({completedTasks.length}/{betriebsleiterTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {betriebsleiterTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Keine Aufgaben für Betriebsleiter definiert. 
                  Bitte wenden Sie sich an den Administrator.
                </p>
              ) : (
                <div className="space-y-4">
                  {betriebsleiterTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <Checkbox
                          id={task.id}
                          checked={completedTasks.includes(task.id)}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                        />
                        <div className="flex-1">
                          <label htmlFor={task.id} className="font-medium cursor-pointer">
                            {task.title}
                          </label>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Optionale Zusatz-Informationen für diese Aufgabe */}
                      <div className="ml-6 space-y-4 border-t pt-3 mt-3">
                        {/* Notiz-Textfeld */}
                        <div>
                          <Label htmlFor={`note-${task.id}`} className="text-sm font-medium flex items-center gap-2 mb-2">
                            <FileText size={14} />
                            Notiz zu dieser Aufgabe (optional)
                          </Label>
                          <Textarea
                            id={`note-${task.id}`}
                            placeholder="Zusätzliche Bemerkungen, Beobachtungen oder Details..."
                            value={taskNotes[task.id] || ''}
                            onChange={(e) => handleNoteChange(task.id, e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>

                        {/* Bild-Upload */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.getElementById(`file-${task.id}`) as HTMLInputElement;
                                input?.click();
                              }}
                              className="flex items-center gap-2"
                            >
                              <Camera size={14} />
                              Bilder hinzufügen (optional)
                            </Button>
                            {taskImages[task.id]?.length > 0 && (
                              <span className="text-sm text-gray-500">
                                {taskImages[task.id].length} Bild(er)
                              </span>
                            )}
                          </div>
                          
                          <input
                            id={`file-${task.id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e, task.id)}
                            className="hidden"
                          />

                          {/* Bild-Vorschau für diese Aufgabe */}
                          {taskImages[task.id]?.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {taskImages[task.id].map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image}
                                    alt={`${task.title} Bild ${index + 1}`}
                                    className="w-full h-20 object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeTaskImage(task.id, index)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                  >
                                    <X size={10} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          {betriebsleiterTasks.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <Button 
                  onClick={() => {
                    console.log("Submit button clicked! Store:", selectedStore);
                    handleSubmit();
                  }}
                  disabled={submitMutation.isPending || !selectedStore || selectedStore.trim() === ''}
                  className="w-full"
                  size="lg"
                >
                  {submitMutation.isPending ? "Wird eingereicht..." : "Aufgaben einreichen"}
                </Button>
                
                {(!selectedStore || selectedStore.trim() === '') && (
                  <p className="text-sm text-amber-600 mt-2 text-center">
                    ⚠️ Bitte wählen Sie zuerst einen Store aus
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>
      
      {/* Footer mit Zurück Button */}
      <div className="py-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
          className="px-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>
      </div>
    </div>
  );
}