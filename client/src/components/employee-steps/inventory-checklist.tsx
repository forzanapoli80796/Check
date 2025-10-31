import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Category, Task, InsertChecklist, InsertInventoryItem } from "@shared/schema";
import type { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

const UNIT_OPTIONS = [
  { value: "stück", label: "Stück" },
  { value: "einheit", label: "Einheit" },
  { value: "karton", label: "Karton" },
  { value: "liter", label: "Liter" },
  { value: "kg", label: "KG" },
];

interface InventoryChecklistProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

interface InventoryTaskData {
  taskId: string;
  quantity: number;
  unit: string;
  completed: boolean;
}

export default function InventoryChecklist({ state, updateState, goBack }: InventoryChecklistProps) {
  const [inventoryData, setInventoryData] = useState<Map<string, InventoryTaskData>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!categories,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // First create the checklist
      if (!state.selectedArea) throw new Error("No category selected");

      const completedTasks = Array.from(inventoryData.values())
        .filter(item => item.completed)
        .map(item => item.taskId);

      const checklistData: InsertChecklist = {
        categoryId: state.selectedArea,
        employeeName: state.employeeName,
        store: state.selectedStore!,
        shiftType: 'keine_schicht', // Inventory categories have no shifts
        completedTasks,
      };

      const checklistResponse = await apiRequest("POST", "/api/checklists", checklistData);
      const checklist = await checklistResponse.json();

      // Then create inventory items for completed tasks
      const inventoryPromises = Array.from(inventoryData.values())
        .filter(item => item.completed && item.quantity >= 0)
        .map(item => {
          const inventoryItem: InsertInventoryItem = {
            checklistId: checklist.id,
            taskId: item.taskId,
            quantity: item.quantity,
            unit: item.unit,
          };
          return apiRequest("POST", "/api/inventory-items", inventoryItem);
        });

      await Promise.all(inventoryPromises);
      return checklist;
    },
    onSuccess: () => {
      updateState({ step: 'success', completedTasks: Array.from(inventoryData.values()).filter(item => item.completed).map(item => item.taskId) });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Inventur konnte nicht übermittelt werden.",
        variant: "destructive",
      });
    },
  });

  // Use the selected category instead of looking for any inventory category
  const filteredTasks = tasks?.filter(task => {
    if (task.categoryId !== state.selectedArea) return false;
    
    // Filter by selected store
    if (task.stores && state.selectedStore && !task.stores.includes(state.selectedStore)) {
      return false;
    }
    
    return true;
  }) || [];

  const updateInventoryItem = (taskId: string, updates: Partial<InventoryTaskData>) => {
    setInventoryData(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(taskId) || { taskId, quantity: 0, unit: "stück", completed: false };
      newMap.set(taskId, { ...current, ...updates });
      return newMap;
    });
  };

  const getInventoryItem = (taskId: string): InventoryTaskData => {
    return inventoryData.get(taskId) || { taskId, quantity: 0, unit: "stück", completed: false };
  };

  const completedCount = Array.from(inventoryData.values()).filter(item => item.completed).length;
  const allTasksCompleted = filteredTasks.length > 0 && completedCount === filteredTasks.length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Lade Inventur-Aufgaben...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <Package size={48} className="mx-auto text-blue-600" />
        <h2 className="text-2xl font-bold">{state.selectedAreaName || 'Mengenerfassung'} - {state.selectedStore}</h2>
        <p className="text-gray-600">
          Mitarbeiter: {state.employeeName}
        </p>
        <p className="text-gray-600">
          Erfassen Sie die Mengen für jeden Artikel
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            Fortschritt: {completedCount} von {filteredTasks.length} Artikeln erfasst
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const itemData = getInventoryItem(task.id);
          return (
            <Card key={task.id} className={`border-2 ${itemData.completed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{task.title}</span>
                  {itemData.completed && <CheckCircle className="text-green-600" size={24} />}
                </CardTitle>
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`quantity-${task.id}`}>Menge</Label>
                    <Input
                      id={`quantity-${task.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={itemData.quantity || ""}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 0;
                        updateInventoryItem(task.id, { quantity });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`unit-${task.id}`}>Einheit</Label>
                    <Select
                      value={itemData.unit}
                      onValueChange={(unit) => updateInventoryItem(task.id, { unit })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant={itemData.completed ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    if (itemData.quantity >= 0) {
                      updateInventoryItem(task.id, { completed: !itemData.completed });
                    } else {
                      toast({
                        title: language === 'de' ? "Menge erforderlich" : "Quantity required",
                        description: language === 'de' 
                          ? "Bitte geben Sie eine gültige Menge an (0 oder mehr)." 
                          : "Please enter a valid quantity (0 or more).",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {itemData.completed ? "✓ Erfasst" : "Als erfasst markieren"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Keine Inventur-Aufgaben verfügbar.</p>
            <p className="text-sm text-gray-500 mt-2">
              Der Administrator muss zuerst Aufgaben für die Inventur-Kategorie erstellen.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredTasks.length > 0 && (
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => updateState({ step: 'area' })}
            className="flex-1"
          >
            Zurück
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!allTasksCompleted || submitMutation.isPending}
            className="flex-1"
          >
            {submitMutation.isPending ? "Übermittlung..." : "Inventur übermitteln"}
          </Button>
        </div>
      )}
    </div>
  );
}