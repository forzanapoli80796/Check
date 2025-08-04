import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import type { Task, Category } from "@/lib/types";

interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: string;
  shift: "frühschicht" | "spätschicht" | "both";
  shiftPhase: "schichtanfang" | "schichtende" | "both";
}

export default function AdminCategoryTasks() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [location, setLocation] = useLocation();
  const [selectedStore, setSelectedStore] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
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
    queryKey: [`/api/categories/${categoryId}/tasks`],
    enabled: !!categoryId
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/categories/${categoryId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estimatedMinutes: parseInt(data.estimatedMinutes) || 5,
          categoryId
        })
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/tasks`] });
      toast({ title: "Aufgabe erstellt" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Fehler beim Erstellen der Aufgabe", 
        variant: "destructive" 
      });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskFormData }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          estimatedMinutes: parseInt(data.estimatedMinutes) || 5
        })
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/tasks`] });
      toast({ title: "Aufgabe aktualisiert" });
      setIsDialogOpen(false);
      resetForm();
      setEditingTask(null);
    },
    onError: () => {
      toast({ 
        title: "Fehler beim Aktualisieren der Aufgabe", 
        variant: "destructive" 
      });
    }
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/tasks`] });
      toast({ title: "Aufgabe gelöscht" });
      setIsDeleting(null);
    },
    onError: () => {
      toast({ 
        title: "Fehler beim Löschen der Aufgabe", 
        variant: "destructive" 
      });
      setIsDeleting(null);
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
      estimatedMinutes: task.estimatedMinutes?.toString() || "5",
      shift: task.shift,
      shiftPhase: task.shiftPhase
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (isDeleting === id) return; // Prevent double deletion
    if (window.confirm("Möchten Sie diese Aufgabe wirklich löschen?")) {
      setIsDeleting(id);
      deleteMutation.mutate(id);
    }
  };

  const categoryTasks = tasks || [];

  // Task Card Component
  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white p-3 rounded border group relative">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(task);
          }}
        >
          <Edit size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(task.id);
          }}
          disabled={isDeleting === task.id}
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
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setLocation('/admin')}
              className="flex items-center text-gray-600 hover:text-gray-900"
              data-testid="button-back-to-admin"
            >
              <ArrowLeft className="mr-2" size={20} />
              Zurück zur Übersicht
            </button>
            <h1 className="text-xl font-semibold">
              {category?.name} - Aufgaben verwalten
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Selection */}
        {!selectedStore ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Standort auswählen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger data-testid="select-store">
                    <SelectValue placeholder="Standort wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JP23">JP23</SelectItem>
                    <SelectItem value="KP5">KP5</SelectItem>
                    <SelectItem value="TS17">TS17</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedStore && setSelectedStore(selectedStore)}
                  disabled={!selectedStore}
                  className="w-full"
                  data-testid="button-continue"
                >
                  Weiter
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Task Management */}
            <div className="space-y-6">
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Aufgaben für {selectedStore}</h2>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingTask(null);
                    setIsDialogOpen(true);
                  }}
                  data-testid="button-add-task"
                >
                  <Plus className="mr-2" size={16} />
                  Neue Aufgabe
                </Button>

                {/* Dialog for Create/Edit */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Beschreibung (optional)</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shift">Schicht</Label>
                          <Select
                            value={formData.shift}
                            onValueChange={(value) => setFormData(prev => ({ 
                              ...prev, 
                              shift: value as TaskFormData['shift'] 
                            }))}
                          >
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
                          <Label htmlFor="shiftPhase">Zeitpunkt</Label>
                          <Select
                            value={formData.shiftPhase}
                            onValueChange={(value) => setFormData(prev => ({ 
                              ...prev, 
                              shiftPhase: value as TaskFormData['shiftPhase'] 
                            }))}
                          >
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
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData(prev => ({ 
                              ...prev, 
                              priority: value as TaskFormData['priority'] 
                            }))}
                          >
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
                              .map(task => <TaskCard key={task.id} task={task} />)
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
                              .map(task => <TaskCard key={task.id} task={task} />)
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
                              .map(task => <TaskCard key={task.id} task={task} />)
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
                              .map(task => <TaskCard key={task.id} task={task} />)
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}