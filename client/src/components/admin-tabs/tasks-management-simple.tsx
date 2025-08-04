import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Task, Category } from "@shared/schema";

export default function TasksManagementSimple() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        categoryId: "",
        shift: "both",
        shiftPhase: "both",
      });
      setEditingTask(null);
      toast({
        title: "Aufgabe erstellt",
        description: "Die neue Aufgabe wurde erfolgreich erstellt.",
      });
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast({
        title: "Fehler",
        description: "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createMutation.isPending) return;
    createMutation.mutate(formData);
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(cat => cat.id === categoryId)?.name || "Unbekannt";
  };

  if (tasksLoading || categoriesLoading) {
    return <div>Laden...</div>;
  }

  console.log('TASKS DATA:', tasks);
  console.log('CATEGORIES DATA:', categories);

  return (
    <div>
      {/* DEBUG BOX */}
      <div className="mb-4 p-4 bg-red-100 border-2 border-red-500">
        <h3 className="font-bold text-red-800">DEBUG INFO</h3>
        <p>Tasks Array: {tasks ? `${tasks.length} Aufgaben` : 'undefined'}</p>
        <p>Categories: {categories ? `${categories.length} Kategorien` : 'undefined'}</p>
        <p>Loading: Tasks={tasksLoading ? 'Ja' : 'Nein'}, Categories={categoriesLoading ? 'Ja' : 'Nein'}</p>
        {tasks && tasks.length > 0 && (
          <p>Erste Aufgabe: {tasks[0].title}</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Aufgaben verwalten</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                title: "",
                description: "",
                categoryId: "",
                shift: "both",
                shiftPhase: "both",
              });
              setEditingTask(null);
              setIsDialogOpen(true);
            }}>
              <Plus size={16} className="mr-2" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="categoryId">Arbeitsbereich</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Arbeitsbereich wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shift">Schicht</Label>
                <Select 
                  value={formData.shift} 
                  onValueChange={(value) => setFormData({ ...formData, shift: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Beide Schichten</SelectItem>
                    <SelectItem value="frühschicht">Frühschicht</SelectItem>
                    <SelectItem value="spätschicht">Spätschicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shiftPhase">Schichtphase</Label>
                <Select 
                  value={formData.shiftPhase} 
                  onValueChange={(value) => setFormData({ ...formData, shiftPhase: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Start und Ende</SelectItem>
                    <SelectItem value="schichtanfang">Schichtanfang</SelectItem>
                    <SelectItem value="schichtende">Schichtende</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Erstelle..." : "Erstellen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
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
                    <p className="text-sm text-gray-600">{task.description || 'Keine Beschreibung'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Aufgaben gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
}