import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Task, Category } from "@shared/schema";



export default function TasksManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogKey, setDialogKey] = useState(0); // Add key for force re-render
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    shift: "both" as "frühschicht" | "spätschicht" | "both",
    shiftPhase: "both" as "schichtanfang" | "schichtende" | "both",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Add default values for missing fields
      const taskData = {
        ...data,
        icon: "desktop",
        priority: "medium", 
        estimatedMinutes: "5"
      };
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // Force dialog re-render and close safely
      setDialogKey(prev => prev + 1);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Aufgabe erstellt",
        description: "Die neue Aufgabe wurde erfolgreich erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // Add default values for missing fields
      const taskData = {
        ...data,
        icon: "desktop",
        priority: "medium",
        estimatedMinutes: "5"
      };
      const response = await apiRequest("PUT", `/api/tasks/${id}`, taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      // Force dialog re-render and close safely
      setDialogKey(prev => prev + 1);
      setIsDialogOpen(false);
      resetForm();
      setEditingTask(null);
      toast({
        title: "Aufgabe aktualisiert",
        description: "Die Aufgabe wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.code || 'DELETE_ERROR');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Aufgabe gelöscht",
        description: "Die Aufgabe wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      shift: "both",
      shiftPhase: "both",
    });
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      categoryId: task.categoryId,
      shift: task.shift || "both",
      shiftPhase: task.shiftPhase || "both",
    });
    setDialogKey(prev => prev + 1); // Force dialog re-render
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?")) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(cat => cat.id === categoryId)?.name || "Unbekannt";
  };

  // Filter tasks based on search term
  const filteredTasks = tasks?.filter(task => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      getCategoryName(task.categoryId).toLowerCase().includes(searchLower)
    );
  }) || [];



  if (tasksLoading || categoriesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  console.log('Tasks data:', tasks?.length, 'Filtered tasks:', filteredTasks?.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Aufgaben verwalten</h3>
        <Dialog key={dialogKey} open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // When dialog closes, reset after a short delay
            setTimeout(() => {
              resetForm();
              setEditingTask(null);
            }, 100);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingTask(null);
              setIsDialogOpen(true);
            }}>
              <Plus size={16} className="mr-2" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="categoryId">Arbeitsbereich</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Arbeitsbereich auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shift">Schichttyp</Label>
                <Select value={formData.shift} onValueChange={(value: "frühschicht" | "spätschicht" | "both") => setFormData(prev => ({ ...prev, shift: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Schichttyp auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Früh- und Spätschicht</SelectItem>
                    <SelectItem value="frühschicht">Nur Frühschicht</SelectItem>
                    <SelectItem value="spätschicht">Nur Spätschicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shiftPhase">Schichtphase</Label>
                <Select value={formData.shiftPhase} onValueChange={(value: "schichtanfang" | "schichtende" | "both") => setFormData(prev => ({ ...prev, shiftPhase: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Schichtphase auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Anfang und Ende</SelectItem>
                    <SelectItem value="schichtanfang">Nur Schichtanfang</SelectItem>
                    <SelectItem value="schichtende">Nur Schichtende</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info für Inventur-Arbeitsbereich */}
              {formData.categoryId && categories?.find(cat => cat.id === formData.categoryId)?.name === "Inventur" && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Inventur-Hinweis:</strong> Erstellen Sie hier nur den Artikel-Namen (z.B. "Pizza Margherita", "Tomatensauce"). 
                    Die Einheiten (Stück, Liter, KG) werden später beim Erfassen von den Mitarbeitern ausgewählt.
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTask ? "Aktualisieren" : "Erstellen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Aufgaben durchsuchen... (Titel, Beschreibung, Arbeitsbereich)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <Button 
            variant="outline" 
            onClick={() => setSearchTerm("")}
            size="sm"
          >
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Search Results Counter */}
      {searchTerm && (
        <div className="text-sm text-gray-600">
          {filteredTasks.length} von {tasks?.length || 0} Aufgaben gefunden
        </div>
      )}

      <div className="space-y-4">
        {filteredTasks.map((task) => {
          return (
            <Card key={task.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className="bg-blue-100 text-blue-800">
                        {getCategoryName(task.categoryId)}
                      </Badge>
                      <Badge className={`text-xs ${
                        (task.shift || 'both') === 'frühschicht' ? 'bg-green-100 text-green-800' :
                        (task.shift || 'both') === 'spätschicht' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(task.shift || 'both') === 'frühschicht' ? 'Früh' :
                         (task.shift || 'both') === 'spätschicht' ? 'Spät' : 'Beide'}
                      </Badge>
                      <Badge className={`text-xs ${
                        (task.shiftPhase || 'both') === 'schichtanfang' ? 'bg-blue-100 text-blue-800' :
                        (task.shiftPhase || 'both') === 'schichtende' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {(task.shiftPhase || 'both') === 'schichtanfang' ? 'Start' :
                         (task.shiftPhase || 'both') === 'schichtende' ? 'Ende' : 'Start+Ende'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit size={16} className="text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Tasks Message */}
      {filteredTasks.length === 0 && tasks && tasks.length > 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500">Keine Aufgaben gefunden für "{searchTerm}"</p>
          <Button 
            variant="outline" 
            onClick={() => setSearchTerm("")}
            className="mt-2"
          >
            Suche zurücksetzen
          </Button>
        </div>
      )}

      {/* Debug Info */}
      {tasks && (
        <div className="mb-4 p-3 bg-yellow-50 rounded">
          <p className="text-sm">Debug: {tasks.length} Aufgaben geladen, {filteredTasks.length} gefiltert</p>
        </div>
      )}

      {/* No Tasks at all */}
      {(!tasks || tasks.length === 0) && (
        <div className="text-center py-8">
          <p className="text-gray-500">Noch keine Aufgaben erstellt.</p>
          <p className="text-sm text-gray-400 mt-1">Erstellen Sie die erste Aufgabe mit dem Button oben.</p>
        </div>
      )}
    </div>
  );
}