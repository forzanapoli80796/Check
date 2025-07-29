import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import * as Icons from "lucide-react";
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

const ICON_OPTIONS = [
  { value: "desktop", label: "Monitor", icon: Icons.Monitor },
  { value: "print", label: "Printer", icon: Icons.Printer },
  { value: "spray-can", label: "Spray", icon: Icons.Sparkles },
  { value: "coins", label: "Coins", icon: Icons.Coins },
  { value: "barcode", label: "Barcode", icon: Icons.ScanLine },
  { value: "weight", label: "Weight", icon: Icons.Weight },
  { value: "shopping-cart", label: "Shopping Cart", icon: Icons.ShoppingCart },
  { value: "users", label: "Users", icon: Icons.Users },
  { value: "utensils", label: "Utensils", icon: Icons.Utensils },
  { value: "thermometer", label: "Thermometer", icon: Icons.Thermometer },
  { value: "fire", label: "Fire", icon: Icons.Flame },
  { value: "car", label: "Car", icon: Icons.Car },
  { value: "map", label: "Map", icon: Icons.Map },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Niedrig", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Mittel", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Hoch", color: "bg-red-100 text-red-800" },
];

export default function TasksManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    icon: "desktop",
    priority: "medium",
    estimatedMinutes: "5",
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
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
      await apiRequest("DELETE", `/api/tasks/${id}`);
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
      icon: "desktop",
      priority: "medium",
      estimatedMinutes: "5",
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      categoryId: task.categoryId,
      icon: task.icon,
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes || "5",
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
    if (confirm("Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?")) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(cat => cat.id === categoryId)?.name || "Unbekannt";
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = PRIORITY_OPTIONS.find(opt => opt.value === priority);
    return priorityOption || PRIORITY_OPTIONS[1]; // default to medium
  };

  const getIcon = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent size={20} />;
    }
    return <Icons.Settings size={20} />;
  };

  if (tasksLoading || categoriesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Aufgaben verwalten</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
                <Label htmlFor="categoryId">Kategorie</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <IconComponent size={16} className="mr-2" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="estimatedMinutes">Geschätzte Dauer (Minuten)</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                />
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

      <div className="space-y-4">
        {tasks?.map((task) => {
          const priorityBadge = getPriorityBadge(task.priority);
          return (
            <Card key={task.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={priorityBadge.color}>
                        {getCategoryName(task.categoryId)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      {getIcon(task.icon)}
                      <span>Priorität: {priorityBadge.label}</span>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>~{task.estimatedMinutes} Min</span>
                      </div>
                    </div>
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
    </div>
  );
}