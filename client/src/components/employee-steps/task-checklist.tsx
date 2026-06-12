import { useState, useEffect } from "react";
import { ArrowLeft, Check, CalendarDays } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeWorkflowState } from "@/lib/types";
import { Task, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslatedTask } from "@/lib/taskTranslations";

interface TaskChecklistProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function TaskChecklist({ state, updateState, goBack }: TaskChecklistProps) {
  const { t, language } = useLanguage();
  const [completedTasks, setCompletedTasks] = useState<string[]>(state.completedTasks);
  const [earliestExpiryDate, setEarliestExpiryDate] = useState<string>("");
  const [productDetails, setProductDetails] = useState<string>("");
  const [lateShiftDate, setLateShiftDate] = useState<string>("");
  const [ballsForTomorrow, setBallsForTomorrow] = useState<string>("");
  const [newBalls, setNewBalls] = useState<string>("");
  const [lunchShiftDate, setLunchShiftDate] = useState<string>("");
  const [ballsForToday, setBallsForToday] = useState<string>("");
  const [redBags, setRedBags] = useState<string>("");
  const [blackBags, setBlackBags] = useState<string>("");
  const [drinksBags, setDrinksBags] = useState<string>("");

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
      if (!state.selectedArea) {
        throw new Error('No area selected');
      }
      
      const submissionData: any = {
        categoryId: state.selectedArea,
        employeeName: state.employeeName,
        store: state.selectedStore,
        shiftType: state.selectedAreaUseShifts === false 
          ? 'keine_schicht' 
          : `${state.selectedShift}_${state.selectedShiftPhase}`,
        completedTasks,
        comments: null,
      };
      
      // Add special fields based on category (areaName defined at component level)
      if (areaName === 'MHD-Check') {
        submissionData.mhdExpiryDate = earliestExpiryDate || null;
        submissionData.mhdProductDetails = productDetails || null;
      } else if (areaName === 'Mengenformular Spätschicht') {
        submissionData.lateShiftDate = lateShiftDate || null;
        submissionData.ballsForTomorrow = ballsForTomorrow ? parseInt(ballsForTomorrow) : null;
        submissionData.newBalls = newBalls ? parseInt(newBalls) : null;
      } else if (areaName === 'Mengenformular Frühschicht' || areaName === 'Mengenformular Mittagsschicht') {
        submissionData.lunchShiftDate = lunchShiftDate || null;
        submissionData.ballsForToday = ballsForToday ? parseInt(ballsForToday) : null;
      }
      if (redBags !== "" || blackBags !== "" || drinksBags !== "") {
        submissionData.redBags = redBags !== "" ? parseInt(redBags) : null;
        submissionData.blackBags = blackBags !== "" ? parseInt(blackBags) : null;
        submissionData.drinksBags = drinksBags !== "" ? parseInt(drinksBags) : null;
      }
      
      const response = await apiRequest("POST", "/api/checklists", submissionData);
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

  // Kategorie direkt über ID finden
  const currentCategory = categories?.find(cat => cat.id === state.selectedArea);
  // areaName: state.selectedAreaName (set at click time) is the most reliable source
  const areaName = state.selectedAreaName || currentCategory?.name || '';

  const filteredTasks = tasks?.filter(task => {
    if (task.categoryId !== currentCategory?.id) return false;
    
    // Filter by selected store
    if (task.stores && state.selectedStore && !task.stores.includes(state.selectedStore)) {
      return false;
    }
    
    // Only apply shift filtering if category uses shifts
    if (state.selectedAreaUseShifts !== false) {
      // Filter by selected shift
      if (task.shift !== 'both' && task.shift !== state.selectedShift) {
        return false;
      }
      
      // Filter by selected shift phase
      if (task.shiftPhase !== 'both' && task.shiftPhase !== state.selectedShiftPhase) {
        return false;
      }
    }
    
    return true;
  }) || [];

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

  const submitChecklist = () => {
    if (!currentCategory) {
      console.error('No category found - checking if we need to create one');
      toast({
        title: "Arbeitsbereich nicht gefunden",
        description: `Keine Aufgaben für den ausgewählten Arbeitsbereich gefunden. Bitte wende dich an den Administrator.`,
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

  const canSubmit = filteredTasks.length > 0; // Allow submission even if not all tasks are completed

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
            <div className="step-indicator mr-3">5</div>
            <div>
              <h2 className="text-xl font-medium">{t.employee.taskCompletion.title}</h2>
              <p className="text-sm text-gray-600">
                {state.selectedStore} - {(state.selectedAreaName && (t.employee.areaSelection.areas as any)[state.selectedAreaName]) || state.selectedAreaName || t.admin.areas.title}
              </p>
              {state.selectedAreaUseShifts !== false && (
                <p className="text-xs text-gray-500 mt-1">
                  {state.selectedShift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift} - 
                  {state.selectedShiftPhase === 'schichtanfang' ? ` ${t.employee.shiftPhase.start}` : ` ${t.employee.shiftPhase.end}`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">{t.employee.taskCompletion.progress || 'Fortschritt'}</div>
            <div className="text-lg font-bold text-primary">
              {completedTasks.length}/{filteredTasks.length}
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">{t.employee.taskCompletion.noTasks || 'Keine Aufgaben für diese Schichtphase gefunden.'}</p>
            <p className="text-sm text-gray-400 mt-2">
              {state.selectedShift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift} - 
              {state.selectedShiftPhase === 'schichtanfang' ? ` ${t.employee.shiftPhase.start}` : ` ${t.employee.shiftPhase.end}`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {t.employee.taskCompletion.contactAdmin || 'Bitte wende dich an deinen Administrator.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {filteredTasks.map((task) => {
              const isCompleted = completedTasks.includes(task.id);
              const translatedTask = getTranslatedTask({
                ...task,
                description: task.description || undefined
              }, language);
              const isLiefertaschen = task.title === 'Liefertaschen zählen';

              if (isLiefertaschen) {
                const allFilled = redBags !== "" && blackBags !== "" && drinksBags !== "";
                return (
                  <div key={task.id} className={`task-item ${allFilled ? 'completed' : ''}`} onClick={undefined}>
                    <div className="flex-1">
                      <div className="flex items-center mb-4">
                        <div className="mr-3">
                          {allFilled ? (
                            <Check className="text-secondary" size={20} />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-400 rounded"></div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-800">{language === 'de' ? 'Liefertaschen zählen' : 'Count delivery bags'}</h4>
                      </div>

                      {/* Pizza-Liefertaschen */}
                      <div className="ml-8 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'de' ? 'Pizza-Liefertaschen' : 'Pizza delivery bags'}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="red-bags" className="text-sm font-medium mb-1 block text-red-700">
                              🔴 {language === 'de' ? 'Anzahl ROT' : 'Amount RED'}
                            </Label>
                            <Input
                              id="red-bags"
                              type="number"
                              min="0"
                              value={redBags}
                              onChange={(e) => { e.stopPropagation(); setRedBags(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="0"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="black-bags" className="text-sm font-medium mb-1 block text-gray-800">
                              ⚫ {language === 'de' ? 'Anzahl SCHWARZ' : 'Amount BLACK'}
                            </Label>
                            <Input
                              id="black-bags"
                              type="number"
                              min="0"
                              value={blackBags}
                              onChange={(e) => { e.stopPropagation(); setBlackBags(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="0"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Getränke/Dessert-Liefertaschen */}
                      <div className="ml-8">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'de' ? 'Getränke/Dessert-Liefertaschen' : 'Drinks/Dessert delivery bags'}</p>
                        <div>
                          <Label htmlFor="drinks-bags" className="text-sm font-medium mb-1 block text-gray-700">
                            {language === 'de' ? 'Anzahl' : 'Amount'}
                          </Label>
                          <Input
                            id="drinks-bags"
                            type="number"
                            min="0"
                            value={drinksBags}
                            onChange={(e) => { e.stopPropagation(); setDrinksBags(e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0"
                            className="w-full max-w-[160px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

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
                    <h4 className="font-medium text-gray-800">{translatedTask.title}</h4>
                    <p className="text-sm text-gray-600">{translatedTask.description}</p>
                  </div>
                </div>
                {getIcon(task.icon)}
              </div>
              );
            })}
          </div>
        )}

        {/* MHD-Check specific fields */}
        {areaName === 'MHD-Check' && (
          <div className="space-y-4 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <CalendarDays className="inline mr-2" size={16} />
                {language === 'de' ? 'Welches MHD ist das jüngste und läuft zuerst ab?' : 'Which expiry date is the earliest and expires first?'}
              </Label>
              <Input
                type="date"
                value={earliestExpiryDate}
                onChange={(e) => setEarliestExpiryDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="product-details" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Welches Produkt?' : 'Which product?'}
              </Label>
              <Textarea
                id="product-details"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder={language === 'de' ? 'Gib hier das Produkt ein...' : 'Enter the product here...'}
                className="w-full min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* Mengenformular Spätschicht specific fields */}
        {areaName === 'Mengenformular Spätschicht' && (
          <div className="space-y-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <CalendarDays className="inline mr-2" size={16} />
                {language === 'de' ? 'Datum wählen' : 'Select Date'}
              </Label>
              <Input
                type="date"
                value={lateShiftDate}
                onChange={(e) => setLateShiftDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="balls-tomorrow" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Wie viele Kugeln haben wir für morgen?' : 'How many dough balls do we have for tomorrow?'}
              </Label>
              <Input
                id="balls-tomorrow"
                type="number"
                min="0"
                value={ballsForTomorrow}
                onChange={(e) => setBallsForTomorrow(e.target.value)}
                placeholder={language === 'de' ? 'Anzahl eingeben...' : 'Enter amount...'}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="new-balls" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Wie viele davon sind neu?' : 'How many of them are new?'}
              </Label>
              <Input
                id="new-balls"
                type="number"
                min="0"
                value={newBalls}
                onChange={(e) => setNewBalls(e.target.value)}
                placeholder={language === 'de' ? 'Anzahl eingeben...' : 'Enter amount...'}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Mengenformular Frühschicht specific fields */}
        {(areaName === 'Mengenformular Frühschicht' || areaName === 'Mengenformular Mittagsschicht') && (
          <div className="space-y-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <CalendarDays className="inline mr-2" size={16} />
                {language === 'de' ? 'Datum wählen' : 'Select Date'}
              </Label>
              <Input
                type="date"
                value={lunchShiftDate}
                onChange={(e) => setLunchShiftDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="balls-today" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Wie viele Kugeln haben wir für heute?' : 'How many dough balls do we have for today?'}
              </Label>
              <Input
                id="balls-today"
                type="number"
                min="0"
                value={ballsForToday}
                onChange={(e) => setBallsForToday(e.target.value)}
                placeholder={language === 'de' ? 'Anzahl eingeben...' : 'Enter amount...'}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={submitChecklist}
            className="flex-1 bg-secondary hover:bg-green-700"
            disabled={!canSubmit || submitMutation.isPending}
          >
            <Check className="mr-2" size={16} />
            {submitMutation.isPending ? t.employee.taskCompletion.submitting || "Wird gesendet..." : t.employee.taskCompletion.submit}
          </Button>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft size={16} className="mr-2" />
            {t.common.back}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
