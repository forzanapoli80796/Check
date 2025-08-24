import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category, Task } from "@shared/schema";

const ICON_OPTIONS = [
  // Arbeit & Büro
  { value: "desktop", label: "Monitor", icon: Icons.Monitor },
  { value: "briefcase", label: "Aktentasche", icon: Icons.Briefcase },
  { value: "clipboard-list", label: "Checkliste", icon: Icons.ClipboardList },
  { value: "clipboard-check", label: "Checkliste Check", icon: Icons.ClipboardCheck },
  { value: "file-text", label: "Dokument", icon: Icons.FileText },
  { value: "folder", label: "Ordner", icon: Icons.Folder },
  { value: "archive", label: "Archiv", icon: Icons.Archive },
  { value: "printer", label: "Drucker", icon: Icons.Printer },
  { value: "phone", label: "Telefon", icon: Icons.Phone },
  
  // Küche & Essen
  { value: "utensils", label: "Besteck", icon: Icons.Utensils },
  { value: "coffee", label: "Kaffee", icon: Icons.Coffee },
  { value: "pizza", label: "Pizza", icon: Icons.Pizza },
  { value: "cake", label: "Kuchen", icon: Icons.Cake },
  { value: "soup", label: "Suppe", icon: Icons.Soup },
  { value: "beer", label: "Bier", icon: Icons.Beer },
  { value: "wine", label: "Wein", icon: Icons.Wine },
  { value: "milk", label: "Milch", icon: Icons.Milk },
  { value: "cherry", label: "Kirsche", icon: Icons.Cherry },
  
  // Transport & Fahrzeuge
  { value: "car", label: "Auto", icon: Icons.Car },
  { value: "truck", label: "LKW", icon: Icons.Truck },
  { value: "bike", label: "Fahrrad", icon: Icons.Bike },
  { value: "plane", label: "Flugzeug", icon: Icons.Plane },
  { value: "train", label: "Zug", icon: Icons.Train },
  { value: "ship", label: "Schiff", icon: Icons.Ship },
  { value: "bus", label: "Bus", icon: Icons.Bus },
  
  // Reinigung & Wartung
  { value: "broom", label: "Besen", icon: Icons.Brush },
  { value: "wrench", label: "Schraubenschlüssel", icon: Icons.Wrench },
  { value: "hammer", label: "Hammer", icon: Icons.Hammer },
  { value: "sparkles", label: "Funkeln", icon: Icons.Sparkles },
  { value: "trash", label: "Mülleimer", icon: Icons.Trash },
  { value: "recycle", label: "Recycling", icon: Icons.Recycle },
  
  // Zeit & Kalender
  { value: "calendar", label: "Kalender", icon: Icons.Calendar },
  { value: "calendar-check", label: "Kalender Check", icon: Icons.CalendarCheck },
  { value: "calendar-days", label: "Kalender Tage", icon: Icons.CalendarDays },
  { value: "clock", label: "Uhr", icon: Icons.Clock },
  { value: "timer", label: "Timer", icon: Icons.Timer },
  { value: "alarm-clock", label: "Wecker", icon: Icons.AlarmClock },
  
  // Menschen & Teams
  { value: "users", label: "Benutzer", icon: Icons.Users },
  { value: "user", label: "Person", icon: Icons.User },
  { value: "user-check", label: "Benutzer Check", icon: Icons.UserCheck },
  { value: "user-plus", label: "Benutzer Hinzufügen", icon: Icons.UserPlus },
  { value: "users-round", label: "Team", icon: Icons.UsersRound },
  
  // Einstellungen & System
  { value: "cog", label: "Einstellungen", icon: Icons.Settings },
  { value: "sliders", label: "Regler", icon: Icons.Sliders },
  { value: "tool", label: "Werkzeug", icon: Icons.Wrench },
  { value: "shield", label: "Schild", icon: Icons.Shield },
  { value: "lock", label: "Schloss", icon: Icons.Lock },
  { value: "key", label: "Schlüssel", icon: Icons.Key },
  
  // Lager & Inventar
  { value: "package", label: "Paket", icon: Icons.Package },
  { value: "box", label: "Box", icon: Icons.Box },
  { value: "warehouse", label: "Lager", icon: Icons.Warehouse },
  { value: "shopping-cart", label: "Einkaufswagen", icon: Icons.ShoppingCart },
  { value: "barcode", label: "Barcode", icon: Icons.Barcode },
  { value: "calculator", label: "Taschenrechner", icon: Icons.Calculator },
  
  // Verschiedenes
  { value: "star", label: "Stern", icon: Icons.Star },
  { value: "heart", label: "Herz", icon: Icons.Heart },
  { value: "flag", label: "Flagge", icon: Icons.Flag },
  { value: "bell", label: "Glocke", icon: Icons.Bell },
  { value: "bookmark", label: "Lesezeichen", icon: Icons.Bookmark },
  { value: "tag", label: "Tag", icon: Icons.Tag },
  { value: "home", label: "Haus", icon: Icons.Home },
  { value: "building", label: "Gebäude", icon: Icons.Building },
];

export default function CategoriesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "desktop",
    iconColor: "#000000",
    useShifts: true,
    categoryType: "shifts" as "shifts" | "simple" | "inventory",
    parentId: null as string | null,
    isSubcategoryParent: false,
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
      console.log('Creating category with data:', data);
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
      iconColor: "#000000",
      useShifts: true,
      categoryType: "shifts",
      parentId: null,
      isSubcategoryParent: false,
    });
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
      iconColor: category.iconColor || "#000000",
      useShifts: category.useShifts !== false,
      categoryType: category.categoryType || (category.useShifts !== false ? "shifts" : "simple"),
      parentId: category.parentId || null,
      isSubcategoryParent: category.isSubcategoryParent || false,
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
    // Check if this category has subcategories
    const hasSubcategories = categories?.some(cat => cat.parentId === id);
    if (hasSubcategories) {
      toast({
        title: "Löschen nicht möglich",
        description: "Diese Kategorie hat Unterkategorien. Bitte löschen Sie zuerst die Unterkategorien.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Sind Sie sicher, dass Sie diesen Arbeitsbereich löschen möchten?")) {
      deleteMutation.mutate(id);
    }
  };

  const getTaskCount = (categoryId: string) => {
    return tasks?.filter(task => task.categoryId === categoryId).length || 0;
  };

  const getSubcategoriesCount = (categoryId: string) => {
    return categories?.filter(cat => cat.parentId === categoryId).length || 0;
  };

  const getIcon = (iconName: string, color?: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent size={20} style={{ color: color || '#000000' }} />;
    }
    return <Icons.Settings size={20} style={{ color: color || '#000000' }} />;
  };

  // Get main categories (those without parentId)
  const mainCategories = categories?.filter(cat => !cat.parentId) || [];
  
  // Get subcategories for a given parent
  const getSubcategories = (parentId: string) => {
    return categories?.filter(cat => cat.parentId === parentId) || [];
  };

  // Get potential parent categories for the dropdown (exclude current category and its subcategories when editing)
  const getPotentialParents = () => {
    if (!categories) return [];
    
    // Filter out categories that can't be parents
    let potentialParents = categories.filter(cat => {
      // Can't be a parent to itself
      if (editingCategory && cat.id === editingCategory.id) return false;
      // Can't be a subcategory (no nested subcategories)
      if (cat.parentId) return false;
      return true;
    });
    
    return potentialParents;
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
          <DialogContent className="max-w-md">
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
                  data-testid="input-category-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="textarea-category-description"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger data-testid="select-category-icon">
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
              
              {/* Icon Color Selection */}
              <div>
                <Label htmlFor="iconColor">Icon Farbe</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="iconColor"
                    type="color"
                    value={formData.iconColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, iconColor: e.target.value }))}
                    className="w-20 h-10 cursor-pointer"
                    data-testid="input-icon-color"
                  />
                  <Input
                    type="text"
                    value={formData.iconColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, iconColor: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    data-testid="input-icon-color-text"
                  />
                  <div className="w-10 h-10 rounded border flex items-center justify-center" style={{ backgroundColor: formData.iconColor }}>
                    {(() => {
                      const selectedIcon = ICON_OPTIONS.find(opt => opt.value === formData.icon);
                      if (selectedIcon) {
                        const IconComponent = selectedIcon.icon;
                        return <IconComponent size={20} style={{ color: 'white' }} />;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Parent Category Selection */}
              <div>
                <Label htmlFor="parentId">Übergeordnete Kategorie (optional)</Label>
                <Select 
                  value={formData.parentId || "none"} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    parentId: value === "none" ? null : value,
                    // If it becomes a subcategory, it can't be a parent
                    isSubcategoryParent: value === "none" ? prev.isSubcategoryParent : false
                  }))}
                >
                  <SelectTrigger data-testid="select-parent-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span>Keine (Hauptkategorie)</span>
                    </SelectItem>
                    {getPotentialParents().map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center">
                          {getIcon(cat.icon, cat.iconColor || undefined)}
                          <span className="ml-2">{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Wählen Sie eine übergeordnete Kategorie, um diese als Unterkategorie zu erstellen.
                </p>
              </div>

              {/* Only show if not a subcategory */}
              {!formData.parentId && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSubcategoryParent"
                    checked={formData.isSubcategoryParent}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isSubcategoryParent: checked as boolean }))
                    }
                    data-testid="checkbox-subcategory-parent"
                  />
                  <Label htmlFor="isSubcategoryParent" className="text-sm cursor-pointer">
                    Hat Unterkategorien (zeigt Kategorieauswahl)
                  </Label>
                </div>
              )}

              {/* Only show category type if not marked as having subcategories */}
              {!formData.isSubcategoryParent && (
                <div>
                  <Label htmlFor="categoryType">Checklisten-Typ</Label>
                  <Select 
                    value={formData.categoryType || (formData.useShifts ? "shifts" : "simple")} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      categoryType: value as "shifts" | "simple" | "inventory",
                      useShifts: value === "shifts" 
                    }))}
                  >
                    <SelectTrigger data-testid="select-category-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shifts">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Option 1: Mit Schichten</span>
                          <span className="text-xs text-gray-500">Frühschicht und Spätschicht</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="simple">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Option 2: Einfache Checkliste</span>
                          <span className="text-xs text-gray-500">Ohne Schichteinteilung</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inventory">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Option 3: Mit Mengenerfassung</span>
                          <span className="text-xs text-gray-500">Für Inventur und Bestandsaufnahme</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-category"
                >
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
                  data-testid="button-cancel"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {mainCategories.map((category) => {
          const subcategories = getSubcategories(category.id);
          const hasSubcategories = subcategories.length > 0;
          
          return (
            <div key={category.id}>
              {/* Main Category Card */}
              <Card className={`${hasSubcategories ? 'border-primary' : 'bg-gray-50'} border`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <h4 className="font-medium">{category.name}</h4>
                        {category.isSubcategoryParent && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Hauptkategorie
                          </Badge>
                        )}
                      </div>
                      <Badge variant={category.useShifts !== false ? "default" : "secondary"} className="mt-1 text-xs w-fit">
                        {category.isSubcategoryParent 
                          ? `${getSubcategoriesCount(category.id)} Unterkategorien`
                          : category.useShifts !== false 
                            ? "Mit Schichten" 
                            : "Einfache Checkliste"}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {!category.isSubcategoryParent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/location-selection?categoryId=${category.id}&categoryName=${encodeURIComponent(category.name)}&admin=true`)}
                          title="Aufgaben verwalten"
                        >
                          <Plus size={16} className="text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        data-testid={`button-edit-${category.id}`}
                      >
                        <Edit size={16} className="text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${category.id}`}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {!category.isSubcategoryParent && (
                    <p className="text-sm text-gray-600 mb-2">
                      {getTaskCount(category.id)} Aufgaben
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    {getIcon(category.icon, category.iconColor || undefined)}
                    <span className="ml-2">{category.description}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subcategories */}
              {hasSubcategories && (
                <div className="ml-8 mt-2 space-y-2">
                  {subcategories.map((subcat) => (
                    <Card key={subcat.id} className="bg-blue-50 border-l-4 border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ChevronRight size={16} className="text-gray-400 mr-2" />
                            <div className="flex flex-col">
                              <h5 className="font-medium text-sm">{subcat.name}</h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {subcat.categoryType === "inventory" 
                                    ? "Mit Mengenerfassung"
                                    : subcat.useShifts !== false 
                                      ? "Mit Schichten" 
                                      : "Einfache Checkliste"}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {getTaskCount(subcat.id)} Aufgaben
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/location-selection?categoryId=${subcat.id}&categoryName=${encodeURIComponent(subcat.name)}&admin=true`)}
                              title="Aufgaben verwalten"
                            >
                              <Plus size={14} className="text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(subcat)}
                              data-testid={`button-edit-${subcat.id}`}
                            >
                              <Edit size={14} className="text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(subcat.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${subcat.id}`}
                            >
                              <Trash2 size={14} className="text-red-600" />
                            </Button>
                          </div>
                        </div>
                        {subcat.description && (
                          <p className="text-xs text-gray-500 mt-2 ml-6">
                            {subcat.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}