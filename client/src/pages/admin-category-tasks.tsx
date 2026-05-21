import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useLocation, useRoute, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Category, Task } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AppLogo from "@/components/app-logo";

// Dynamic schema based on category's useShifts setting
const createTaskFormSchema = (useShifts: boolean) => {
  const baseSchema = {
    title: z.string().min(1, "Titel ist erforderlich"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]),
    estimatedMinutes: z.string(),
    stores: z.array(z.string()).min(1, "Mindestens ein Standort muss ausgewählt werden")
  };

  if (useShifts) {
    return z.object({
      ...baseSchema,
      shift: z.enum(["frühschicht", "spätschicht", "both"]),
      shiftPhase: z.enum(["schichtanfang", "schichtende", "both"]),
    });
  }

  return z.object({
    ...baseSchema,
    shift: z.enum(["frühschicht", "spätschicht", "both"]).default("both"),
    shiftPhase: z.enum(["schichtanfang", "schichtende", "both"]).default("both"),
  });
};

type TaskFormData = {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: string;
  shift: "frühschicht" | "spätschicht" | "both";
  shiftPhase: "schichtanfang" | "schichtende" | "both";
  stores: string[];
};

export default function AdminCategoryTasks() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin-category-tasks/:categoryId/:store");
  const { toast } = useToast();
  
  const categoryId = params?.categoryId || "";
  const store = params?.store || "";
  
  // Redirect if no categoryId
  useEffect(() => {
    if (!categoryId) {
      navigate("/admin");
    }
  }, [categoryId, navigate]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    estimatedMinutes: "5",
    shift: "both",
    shiftPhase: "both",
    stores: ["JP23", "KP5", "TS17"] // Default to all stores
  });

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !!categoryId
  });
  
  // Debug category loading
  useEffect(() => {
    console.log('Category loaded:', category, 'Loading:', categoryLoading, 'CategoryId:', categoryId);
  }, [category, categoryLoading, categoryId]);

  // Fetch tasks for this category
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    select: (data) => data.filter(task => task.categoryId === categoryId)
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!categoryId) {
        throw new Error("Keine Kategorie-ID vorhanden");
      }
      const response = await apiRequest('POST', '/api/tasks', {
        ...data,
        estimatedMinutes: parseInt(data.estimatedMinutes) || 5,
        categoryId: categoryId,
        icon: 'check'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Aufgabe erstellt",
        description: "Die neue Aufgabe wurde erfolgreich hinzugefügt."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Erstellen",
        description: error.message || "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: TaskFormData & { id: string }) => {
      const response = await apiRequest('PUT', `/api/tasks/${id}`, {
        ...data,
        estimatedMinutes: parseInt(data.estimatedMinutes) || 5
      });
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
      shiftPhase: "both",
      stores: ["JP23", "KP5", "TS17"]
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes || "5",
      shift: task.shift,
      shiftPhase: task.shiftPhase,
      stores: task.stores || ["JP23", "KP5", "TS17"]
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use dynamic schema based on category's useShifts setting
    const taskFormSchema = createTaskFormSchema(category?.useShifts !== false);
    
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
        description: "Bitte überprüfe deine Eingaben.",
        variant: "destructive"
      });
    }
  };

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  
  const handleDelete = (id: string) => {
    if (deleteMutation.isPending || deletingTaskId === id) return; // Prevent double-clicks
    
    if (confirm("Möchtest du diese Aufgabe wirklich löschen?")) {
      setDeletingTaskId(id);
      deleteMutation.mutate(id, {
        onSettled: () => {
          setDeletingTaskId(null);
        }
      });
    }
  };

  const categoryTasks = tasks || [];

  // Create a task card component to avoid repetition
  const TaskCard = ({ task }: { task: Task }) => (
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
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(task.id);
          }}
          disabled={deleteMutation.isPending || deletingTaskId === task.id}
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
      {task.stores && task.stores.length > 0 && (
        <div className="flex items-center mt-2 text-xs">
          <span className="text-gray-600">Standorte: </span>
          <div className="ml-1 flex gap-1">
            {task.stores.map(store => (
              <span key={store} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {store}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/"><AppLogo imgClassName="h-8 object-contain" /></Link>
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
            Aufgaben für diesen Arbeitsbereich und Standort
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
                {category?.useShifts === true && (
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
                          {(() => {
                            const excluded = category?.excludedShiftCombos ?? [];
                            const shift = formData.shift;
                            const showAnfang = shift === "both" || !excluded.includes(`${shift}_schichtanfang`);
                            const showEnde = shift === "both" || !excluded.includes(`${shift}_schichtende`);
                            return <>
                              {showAnfang && <SelectItem value="schichtanfang">Schichtanfang</SelectItem>}
                              {showEnde && <SelectItem value="schichtende">Schichtende</SelectItem>}
                              <SelectItem value="both">Beide</SelectItem>
                            </>;
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
                <div>
                  <Label>Standorte</Label>
                  <div className="space-y-2 mt-2">
                    {["JP23", "KP5", "TS17"].map((storeOption) => (
                      <div key={storeOption} className="flex items-center space-x-2">
                        <Checkbox
                          id={`store-${storeOption}`}
                          checked={formData.stores.includes(storeOption)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              stores: checked
                                ? [...prev.stores, storeOption]
                                : prev.stores.filter(s => s !== storeOption)
                            }));
                          }}
                        />
                        <Label
                          htmlFor={`store-${storeOption}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {storeOption}
                        </Label>
                      </div>
                    ))}
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
            {category?.useShifts === false ? (
              // Simple list for categories without shifts
              <div>
                <h5 className="font-medium text-gray-700 mb-4">Alle Aufgaben</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {categoryTasks.length === 0 && (
                    <p className="text-gray-400 text-sm col-span-full">
                      Noch keine Aufgaben vorhanden. Klicke auf "Neue Aufgabe" um zu beginnen.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Grid with shifts for categories with shifts
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}