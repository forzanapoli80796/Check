import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeWorkflowState, AREA_LABELS } from "@/lib/types";
import { Task, Category } from "@shared/schema";

interface TaskChecklistProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function TaskChecklist({ state, updateState }: TaskChecklistProps) {
  const [completedTasks, setCompletedTasks] = useState<string[]>(state.completedTasks);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!categories,
  });

  const isLoading = categoriesLoading || tasksLoading;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentCategory?.id) {
        console.error('Category not found for area:', state.selectedArea);
        console.error('Available categories:', categories);
        throw new Error(`Category not found for area: ${state.selectedArea}`);
      }
      
      console.log('Submitting checklist with categoryId:', currentCategory.id);
      
      const response = await apiRequest("POST", "/api/checklists", {
        categoryId: currentCategory.id,
        employeeName: state.employeeName,
        store: state.selectedStore,
        shiftType: state.selectedShift,
        completedTasks,
      });
      return response.json();
    },
    onSuccess: () => {
      updateState({ step: 'success', completedTasks });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Checkliste konnte nicht übermittelt werden.",
        variant: "destructive",
      });
    },
  });

  // Erweiterte Kategorie-Zuordnung mit mehreren Varianten
  const currentCategory = categories?.find(cat => {
    const areaLabel = AREA_LABELS[state.selectedArea as keyof typeof AREA_LABELS];
    console.log(`Looking for category: selectedArea="${state.selectedArea}", areaLabel="${areaLabel}", categoryName="${cat.name}"`);
    
    // Verschiedene Matching-Strategien versuchen
    const normalizedCatName = cat.name.toLowerCase().trim();
    const normalizedAreaLabel = areaLabel?.toLowerCase().trim();
    
    // 1. Exakte Übereinstimmung
    if (normalizedCatName === normalizedAreaLabel) return true;
    
    // 2. Spezielle Zuordnungen für bekannte Probleme
    const specialMappings: Record<string, string[]> = {
      'kueche': ['küche', 'kitchen', 'kueche'],
      'terminal': ['terminal', 'kasse'],
      'fahrer': ['fahrer', 'driver'],
      'inventur': ['inventur', 'inventory'],
      'sonderreinigung': ['sonderreinigung', 'reinigung', 'cleaning']
    };
    
    const mappings = specialMappings[state.selectedArea as string] || [];
    return mappings.some(mapping => normalizedCatName.includes(mapping) || mapping.includes(normalizedCatName));
  });

  console.log(`Found category:`, currentCategory);
  console.log(`Available categories:`, categories?.map(c => ({ id: c.id, name: c.name })));
  console.log(`Categories loading:`, categoriesLoading, `Tasks loading:`, tasksLoading);

  const filteredTasks = tasks?.filter(task => task.categoryId === currentCategory?.id) || [];
  
  console.log(`Filtered tasks for category ${currentCategory?.id}:`, filteredTasks.length);

  useEffect(() => {
    updateState({ totalTasks: filteredTasks.length });
  }, [filteredTasks.length]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const goBack = () => {
    updateState({ step: 'details' });
  };

  const submitChecklist = () => {
    console.log('Submit button clicked! Current state:', {
      selectedArea: state.selectedArea,
      currentCategory,
      completedTasks,
      categories: categories?.map(c => ({ id: c.id, name: c.name }))
    });
    
    if (!currentCategory) {
      console.error('No category found - checking if we need to create one');
      toast({
        title: "Kategorie nicht gefunden",
        description: `Keine Kategorie für "${AREA_LABELS[state.selectedArea as keyof typeof AREA_LABELS]}" gefunden. Bitte wenden Sie sich an den Administrator.`,
        variant: "destructive",
      });
      return;
    }
    
    submitMutation.mutate();
  };

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      desktop: Icons.Monitor,
      print: Icons.Printer,
      'spray-can': Icons.Sparkles,
      coins: Icons.Coins,
      barcode: Icons.ScanLine,
      weight: Icons.Weight,
      'shopping-cart': Icons.ShoppingCart,
      users: Icons.Users,
      utensils: Icons.Utensils,
      thermometer: Icons.Thermometer,
      fire: Icons.Flame,
      car: Icons.Car,
      map: Icons.Map,
    };
    const IconComponent = iconMap[iconName] || Icons.CheckSquare;
    return <IconComponent className="text-primary" size={20} />;
  };

  const isAllTasksCompleted = completedTasks.length === filteredTasks.length && filteredTasks.length > 0;

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="step-indicator mr-3">4</div>
            <div>
              <h2 className="text-xl font-medium">Aufgaben-Checkliste</h2>
              <p className="text-sm text-gray-600">
                {state.selectedStore} - {AREA_LABELS[state.selectedArea as keyof typeof AREA_LABELS]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Fortschritt</div>
            <div className="text-lg font-bold text-primary">
              {completedTasks.length}/{filteredTasks.length}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {filteredTasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`task-item ${isCompleted ? 'completed' : ''}`}
              >
                <div className="flex items-center flex-1">
                  <div className="mr-3">
                    {isCompleted ? (
                      <Check className="text-secondary" size={20} />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </div>
                {getIcon(task.icon)}
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={submitChecklist}
            className="flex-1 bg-secondary hover:bg-green-700"
            disabled={!isAllTasksCompleted || submitMutation.isPending}
          >
            <Check className="mr-2" size={16} />
            {submitMutation.isPending ? "Wird gesendet..." : "Liste absenden"}
          </Button>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft size={16} className="mr-2" />
            Zurück
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
