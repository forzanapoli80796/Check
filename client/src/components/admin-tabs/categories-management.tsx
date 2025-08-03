import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category, Task } from "@shared/schema";

const ICON_OPTIONS = [
  { value: "desktop", label: "Monitor", icon: Icons.Monitor },
  { value: "utensils", label: "Utensils", icon: Icons.Utensils },
  { value: "car", label: "Car", icon: Icons.Car },
  { value: "clipboard-list", label: "Clipboard", icon: Icons.ClipboardList },
  { value: "broom", label: "Broom", icon: Icons.Brush },
  { value: "cog", label: "Settings", icon: Icons.Settings },
  { value: "users", label: "Users", icon: Icons.Users },
];

export default function CategoriesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "desktop",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: categories, isLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: tasks, error: tasksError } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: 3,
    retryDelay: 1000,
  });

  // Error handling for production
  if (categoriesError || tasksError) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium text-red-600 mb-2">Verbindungsfehler</h3>
        <p className="text-gray-600 mb-4">
          Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.
        </p>
        <Button onClick={() => window.location.reload()}>
          Seite neu laden
        </Button>
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // Use setTimeout to ensure DOM operations complete before state changes
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({
          title: "Arbeitsbereich erstellt",
          description: "Der neue Arbeitsbereich wurde erfolgreich erstellt.",
        });
      }, 100);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Arbeitsbereich konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      // Use setTimeout to ensure DOM operations complete before state changes
      setTimeout(() => {
        setIsDialogOpen(false);
        resetForm();
        setEditingCategory(null);
        toast({
          title: "Arbeitsbereich aktualisiert",
          description: "Der Arbeitsbereich wurde erfolgreich aktualisiert.",
        });
      }, 100);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Arbeitsbereich konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Arbeitsbereich gelöscht",
        description: "Der Arbeitsbereich wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Arbeitsbereich konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "desktop",
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Sind Sie sicher, dass Sie diesen Arbeitsbereich löschen möchten?")) {
      deleteMutation.mutate(id);
    }
  };

  const getTaskCount = (categoryId: string) => {
    return tasks?.filter(task => task.categoryId === categoryId).length || 0;
  };

  const getIcon = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent size={20} />;
    }
    return <Icons.Settings size={20} />;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Arbeitsbereiche verwalten</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus size={16} className="mr-2" />
              Neuer Arbeitsbereich
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Arbeitsbereich bearbeiten" : "Neuer Arbeitsbereich"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              <div className="flex space-x-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? "Aktualisieren" : "Erstellen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                    setEditingCategory(null);
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <Card key={category.id} className="bg-gray-50 border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{category.name}</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/location-selection?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}`)}
                  >
                    <Plus size={16} className="text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit size={16} className="text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {getTaskCount(category.id)} Aufgaben
              </p>
              <div className="flex items-center text-sm text-gray-500">
                {getIcon(category.icon)}
                <span className="ml-2">{category.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}