import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Category, Task } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

const taskFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  estimatedMinutes: z.string(),
  shift: z.enum(["frühschicht", "spätschicht", "both"]),
  shiftPhase: z.enum(["schichtanfang", "schichtende", "both"])
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export default function AdminCategoryTasks() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin-category-tasks/:categoryId/:store");
  const { toast } = useToast();
  
  const categoryId = params?.categoryId || "";
  const store = params?.store || "";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    estimatedMinutes: "5",
    shift: "both",
    shiftPhase: "both"
  });

  // Fetch category details
  const { data: category } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !!categoryId
  });

  // Fetch tasks for this category
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    select: (data) => data.filter(task => task.categoryId === categoryId)
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) => 
      apiRequest('/api/tasks', {
        method: 'POST',
        body: { ...data, categoryId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Aufgabe erstellt",
        description: "Die Aufgabe wurde erfolgreich hinzugefügt."
      });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: TaskFormData & { id: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
      toast({
        title: "Aufgabe aktualisiert",
        description: "Die Aufgabe wurde erfolgreich geändert."
      });
    }
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Aufgabe gelöscht",
        description: "Die Aufgabe wurde erfolgreich entfernt."
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      estimatedMinutes: "5",
      shift: "both",
      shiftPhase: "both"
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
      shift: task.shift,
      shiftPhase: task.shiftPhase
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = taskFormSchema.parse(formData);
      if (editingTask) {
        updateMutation.mutate({ id: editingTask.id, ...result });
      } else {
        createMutation.mutate(result);
      }
    } catch (error) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte überprüfen Sie Ihre Eingaben.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Möchten Sie diese Aufgabe wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };

  const categoryTasks = tasks || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src={forzaCheckLogo} alt="ForzaCheck" className="h-10" />
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Aufgaben verwalten: {category?.name} - {store}
          </h1>
          <p className="text-gray-600 mt-1">
            Verwalten Sie die Aufgaben für diesen Arbeitsbereich und Standort
          </p>
        </div>

        {/* Add Task Button */}
        <div className="mb-6 flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus size={16} className="mr-2" />
                Neue Aufgabe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                  <Label htmlFor="description">Beschreibung (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shift">Schicht</Label>
                    <Select value={formData.shift} onValueChange={(value) => setFormData(prev => ({ ...prev, shift: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frühschicht">Frühschicht</SelectItem>
                        <SelectItem value="spätschicht">Spätschicht</SelectItem>
                        <SelectItem value="both">Beide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shiftPhase">Schichtphase</Label>
                    <Select value={formData.shiftPhase} onValueChange={(value) => setFormData(prev => ({ ...prev, shiftPhase: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schichtanfang">Schichtanfang</SelectItem>
                        <SelectItem value="schichtende">Schichtende</SelectItem>
                        <SelectItem value="both">Beide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priorität</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedMinutes">Geschätzte Minuten</Label>
                    <Input
                      id="estimatedMinutes"
                      type="number"
                      value={formData.estimatedMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTask ? "Aktualisieren" : "Erstellen"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                      setEditingTask(null);
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks Grid */}
        <Card className="border">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Frühschicht Column */}
              <div>
                <h5 className="font-medium text-green-700 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Frühschicht
                </h5>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Schichtanfang */}
                  <div>
                    <h6 className="text-sm font-medium text-blue-600 mb-2">Start</h6>
                    <div className="space-y-2 min-h-[200px] bg-blue-50 p-3 rounded">
                      {categoryTasks
                        .filter(task => 
                          (task.shift === 'frühschicht' || task.shift === 'both') && 
                          (task.shiftPhase === 'schichtanfang' || task.shiftPhase === 'both')
                        )
                        .map(task => (
                          <div key={task.id} className="bg-white p-3 rounded border group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            </div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-gray-600 text-xs mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100' :
                                task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                              }`}>
                                {task.priority === 'high' ? 'Hoch' : 
                                 task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </span>
                              <span className="ml-2">{task.estimatedMinutes} Min.</span>
                            </div>
                          </div>
                        ))
                      }
                      {categoryTasks.filter(task => 
                        (task.shift === 'frühschicht' || task.shift === 'both') && 
                        (task.shiftPhase === 'schichtanfang' || task.shiftPhase === 'both')
                      ).length === 0 && (
                        <p className="text-gray-400 text-xs">Keine Aufgaben</p>
                      )}
                    </div>
                  </div>

                  {/* Schichtende */}
                  <div>
                    <h6 className="text-sm font-medium text-purple-600 mb-2">Ende</h6>
                    <div className="space-y-2 min-h-[200px] bg-purple-50 p-3 rounded">
                      {categoryTasks
                        .filter(task => 
                          (task.shift === 'frühschicht' || task.shift === 'both') && 
                          (task.shiftPhase === 'schichtende' || task.shiftPhase === 'both')
                        )
                        .map(task => (
                          <div key={task.id} className="bg-white p-3 rounded border group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            </div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-gray-600 text-xs mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100' :
                                task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                              }`}>
                                {task.priority === 'high' ? 'Hoch' : 
                                 task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </span>
                              <span className="ml-2">{task.estimatedMinutes} Min.</span>
                            </div>
                          </div>
                        ))
                      }
                      {categoryTasks.filter(task => 
                        (task.shift === 'frühschicht' || task.shift === 'both') && 
                        (task.shiftPhase === 'schichtende' || task.shiftPhase === 'both')
                      ).length === 0 && (
                        <p className="text-gray-400 text-xs">Keine Aufgaben</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spätschicht Column */}
              <div>
                <h5 className="font-medium text-orange-700 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Spätschicht
                </h5>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Schichtanfang */}
                  <div>
                    <h6 className="text-sm font-medium text-blue-600 mb-2">Start</h6>
                    <div className="space-y-2 min-h-[200px] bg-blue-50 p-3 rounded">
                      {categoryTasks
                        .filter(task => 
                          (task.shift === 'spätschicht' || task.shift === 'both') && 
                          (task.shiftPhase === 'schichtanfang' || task.shiftPhase === 'both')
                        )
                        .map(task => (
                          <div key={task.id} className="bg-white p-3 rounded border group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            </div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-gray-600 text-xs mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100' :
                                task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                              }`}>
                                {task.priority === 'high' ? 'Hoch' : 
                                 task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </span>
                              <span className="ml-2">{task.estimatedMinutes} Min.</span>
                            </div>
                          </div>
                        ))
                      }
                      {categoryTasks.filter(task => 
                        (task.shift === 'spätschicht' || task.shift === 'both') && 
                        (task.shiftPhase === 'schichtanfang' || task.shiftPhase === 'both')
                      ).length === 0 && (
                        <p className="text-gray-400 text-xs">Keine Aufgaben</p>
                      )}
                    </div>
                  </div>

                  {/* Schichtende */}
                  <div>
                    <h6 className="text-sm font-medium text-purple-600 mb-2">Ende</h6>
                    <div className="space-y-2 min-h-[200px] bg-purple-50 p-3 rounded">
                      {categoryTasks
                        .filter(task => 
                          (task.shift === 'spätschicht' || task.shift === 'both') && 
                          (task.shiftPhase === 'schichtende' || task.shiftPhase === 'both')
                        )
                        .map(task => (
                          <div key={task.id} className="bg-white p-3 rounded border group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(task)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(task.id)}
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            </div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-gray-600 text-xs mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                task.priority === 'high' ? 'bg-red-100' :
                                task.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                              }`}>
                                {task.priority === 'high' ? 'Hoch' : 
                                 task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </span>
                              <span className="ml-2">{task.estimatedMinutes} Min.</span>
                            </div>
                          </div>
                        ))
                      }
                      {categoryTasks.filter(task => 
                        (task.shift === 'spätschicht' || task.shift === 'both') && 
                        (task.shiftPhase === 'schichtende' || task.shiftPhase === 'both')
                      ).length === 0 && (
                        <p className="text-gray-400 text-xs">Keine Aufgaben</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}