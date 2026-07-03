import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, CalendarDays, PenLine, Trash2, Clock } from "lucide-react";
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
  const [mhdStockCount, setMhdStockCount] = useState<string>("");
  const [lateShiftDate, setLateShiftDate] = useState<string>("");
  const [ballsForTomorrow, setBallsForTomorrow] = useState<string>("");
  const [newBalls, setNewBalls] = useState<string>("");
  const [usedTomorrowBalls, setUsedTomorrowBalls] = useState<string>(""); // "ja" | "nein" | ""
  const [lunchShiftDate, setLunchShiftDate] = useState<string>("");
  const [ballsForToday, setBallsForToday] = useState<string>("");
  const [redBags, setRedBags] = useState<string>("");
  const [blackBags, setBlackBags] = useState<string>("");
  const [drinksBags, setDrinksBags] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showTimeError, setShowTimeError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    setIsTouchDevice(
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    );
  }, []);

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
        submissionData.mhdStockCount = mhdStockCount || null;
      } else if (
        areaName === 'Mengenformular Spätschicht' ||
        areaName === 'Küche Spätschicht – Checkliste & Mengenformular'
      ) {
        submissionData.lateShiftDate = new Date().toISOString().split('T')[0];
        submissionData.ballsForTomorrow = ballsForTomorrow ? parseInt(ballsForTomorrow) : null;
        submissionData.newBalls = newBalls ? parseInt(newBalls) : null;
      } else if (
        areaName === 'Mengenformular Frühschicht' ||
        areaName === 'Mengenformular Mittagsschicht' ||
        areaName === 'Küche Frühschicht – Checkliste & Mengenformular'
      ) {
        submissionData.lunchShiftDate = new Date().toISOString().split('T')[0];
        submissionData.ballsForToday = ballsForToday ? parseInt(ballsForToday) : null;
      }
      if (redBags !== "" || blackBags !== "" || drinksBags !== "") {
        submissionData.redBags = redBags !== "" ? parseInt(redBags) : null;
        submissionData.blackBags = blackBags !== "" ? parseInt(blackBags) : null;
        submissionData.drinksBags = drinksBags !== "" ? parseInt(drinksBags) : null;
      }

      if (signature) {
        submissionData.signature = signature;
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

  // Automatically add/remove "Liefertaschen zählen" from completedTasks when bags fields change
  useEffect(() => {
    const liefertaschenTask = filteredTasks.find(t => t.title === 'Liefertaschen zählen');
    if (!liefertaschenTask) return;
    const allFilled = redBags !== "" && blackBags !== "" && drinksBags !== "";
    setCompletedTasks(prev => {
      const alreadyIn = prev.includes(liefertaschenTask.id);
      if (allFilled && !alreadyIn) return [...prev, liefertaschenTask.id];
      if (!allFilled && alreadyIn) return prev.filter(id => id !== liefertaschenTask.id);
      return prev;
    });
  }, [redBags, blackBags, drinksBags]);

  const isWithinTimeWindow = (): boolean => {
    const shift = state.selectedShift;
    // No restriction for categories without shifts
    if (!shift || shift === null) return true;
    // TS17 has no time window restriction (single shift with START/ENDE)
    if (state.selectedStore === 'TS17') return true;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const minutes = h * 60 + m;
    if (shift === 'frühschicht') {
      // 10:00 – 17:00
      return minutes >= 10 * 60 && minutes < 17 * 60;
    }
    if (shift === 'spätschicht') {
      // 16:00 – 22:30
      return minutes >= 16 * 60 && minutes < 22 * 60 + 30;
    }
    return true;
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

    if (!isWithinTimeWindow()) {
      setShowTimeError(true);
      return;
    }

    setShowTimeError(false);
    submitMutation.mutate();
  };

  // Signature pad helpers
  const isKuecheChecklist =
    areaName === 'Küche Frühschicht – Checkliste & Mengenformular' ||
    areaName === 'Küche Spätschicht – Checkliste & Mengenformular';
  const needsSignature = isKuecheChecklist && isTouchDevice;

  const getCanvasPos = (canvas: HTMLCanvasElement, e: TouchEvent | MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const initCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleSignatureStart = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvas(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getCanvasPos(canvas, e.nativeEvent as any);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleSignatureMove = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(canvas, e.nativeEvent as any);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleSignatureEnd = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
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

  const allTasksDone =
    filteredTasks.length > 0 &&
    filteredTasks.every(t => completedTasks.includes(t.id));

  const isSpaetschichtMengenformular =
    areaName === 'Mengenformular Spätschicht' || areaName === 'Küche Spätschicht – Checkliste & Mengenformular';

  const isFruehschichtMengenformular =
    areaName === 'Mengenformular Frühschicht' ||
    areaName === 'Mengenformular Mittagsschicht' ||
    areaName === 'Küche Frühschicht – Checkliste & Mengenformular';

  const mengenformularDone = isSpaetschichtMengenformular
    ? ballsForTomorrow !== "" && usedTomorrowBalls !== "" && (usedTomorrowBalls === "nein" || newBalls !== "")
    : isFruehschichtMengenformular
      ? !!ballsForToday
      : true;

  const signatureDone = !needsSignature || !!signature;

  const mhdDone = areaName !== 'MHD-Check' || (!!earliestExpiryDate && !!productDetails && !!mhdStockCount);

  const canSubmit = allTasksDone && mengenformularDone && signatureDone && mhdDone;

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
                  {state.selectedStore === 'TS17'
                    ? (state.selectedShiftPhase === 'schichtanfang' ? 'START' : 'ENDE')
                    : `${state.selectedShift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift} - ${state.selectedShiftPhase === 'schichtanfang' ? t.employee.shiftPhase.start : t.employee.shiftPhase.end}`
                  }
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
              {state.selectedStore === 'TS17'
                ? (state.selectedShiftPhase === 'schichtanfang' ? 'START' : 'ENDE')
                : `${state.selectedShift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift} - ${state.selectedShiftPhase === 'schichtanfang' ? t.employee.shiftPhase.start : t.employee.shiftPhase.end}`
              }
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
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                type="date"
                value={earliestExpiryDate}
                onChange={(e) => setEarliestExpiryDate(e.target.value)}
                className={`w-full ${!earliestExpiryDate ? 'border-red-300' : ''}`}
              />
            </div>
            <div>
              <Label htmlFor="product-details" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Welches Produkt?' : 'Which product?'}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="product-details"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder={language === 'de' ? 'Gib hier das Produkt ein...' : 'Enter the product here...'}
                className={`w-full min-h-[80px] ${!productDetails ? 'border-red-300' : ''}`}
              />
            </div>
            <div>
              <Label htmlFor="mhd-stock-count" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Wie viel ist davon auf Lager?' : 'How much is in stock?'}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="mhd-stock-count"
                type="text"
                value={mhdStockCount}
                onChange={(e) => setMhdStockCount(e.target.value)}
                placeholder={language === 'de' ? 'Menge eingeben...' : 'Enter quantity...'}
                className={`w-full ${!mhdStockCount ? 'border-red-300' : ''}`}
              />
            </div>
          </div>
        )}

        {/* Mengenformular Spätschicht specific fields */}
        {(areaName === 'Mengenformular Spätschicht' || areaName === 'Küche Spätschicht – Checkliste & Mengenformular') && (
          <div className="space-y-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-sm tracking-widest text-blue-800 uppercase">
              Mengenformular Spätschicht
            </h3>

            {/* Frage 1: Ja/Nein + Anzahl bei Ja */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {language === 'de' ? 'Habe ich Kugeln von morgen verwendet?' : 'Did I use dough balls from tomorrow?'}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => { setUsedTomorrowBalls("ja"); setNewBalls(""); }}
                  className={`flex-1 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                    usedTomorrowBalls === "ja"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {language === 'de' ? 'Ja' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setUsedTomorrowBalls("nein"); setNewBalls("0"); }}
                  className={`flex-1 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                    usedTomorrowBalls === "nein"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {language === 'de' ? 'Nein' : 'No'}
                </button>
              </div>
              {usedTomorrowBalls === "ja" && (
                <Input
                  type="number"
                  min="1"
                  value={newBalls}
                  onChange={(e) => setNewBalls(e.target.value)}
                  placeholder={language === 'de' ? 'Anzahl verwendete Kugeln...' : 'Amount of balls used...'}
                  className="w-full"
                  autoFocus
                />
              )}
            </div>

            {/* Frage 2: Zahl */}
            <div>
              <Label htmlFor="balls-leftover" className="text-sm font-medium mb-2 block">
                {language === 'de' ? 'Wie viele Kugeln sind heute übrig geblieben?' : 'How many dough balls are left over today?'}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="balls-leftover"
                type="number"
                min="0"
                value={ballsForTomorrow}
                onChange={(e) => setBallsForTomorrow(e.target.value)}
                placeholder={language === 'de' ? 'Anzahl eingeben...' : 'Enter amount...'}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Mengenformular Frühschicht specific fields */}
        {(areaName === 'Mengenformular Frühschicht' || areaName === 'Mengenformular Mittagsschicht' || areaName === 'Küche Frühschicht – Checkliste & Mengenformular') && (
          <div className="space-y-4 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-sm tracking-widest text-green-800 uppercase">
              Mengenformular Frühschicht
            </h3>
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

        {/* Digital Signature – always shown for Küche checklists, required on touch devices */}
        {isKuecheChecklist && (
          <div className="mb-6 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <PenLine size={18} className="text-gray-600" />
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                {language === 'de' ? 'Digitale Unterschrift' : 'Digital Signature'}
                {needsSignature
                  ? <span className="text-red-500 ml-1">*</span>
                  : <span className="text-gray-400 ml-1 normal-case text-xs font-normal">({language === 'de' ? 'optional' : 'optional'})</span>
                }
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {language === 'de'
                ? 'Bitte im Feld unten unterschreiben, bevor du absendest.'
                : 'Please sign in the field below before submitting.'}
            </p>
            <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-white">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full touch-none block"
                style={{ cursor: 'crosshair' }}
                onTouchStart={handleSignatureStart}
                onTouchMove={handleSignatureMove}
                onTouchEnd={handleSignatureEnd}
                onMouseDown={handleSignatureStart}
                onMouseMove={handleSignatureMove}
                onMouseUp={handleSignatureEnd}
                onMouseLeave={handleSignatureEnd}
              />
              {!signature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-300 text-sm select-none">
                    {language === 'de' ? '✍ Hier unterschreiben' : '✍ Sign here'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              {signature ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <Check size={12} /> {language === 'de' ? 'Unterschrift vorhanden' : 'Signature captured'}
                </span>
              ) : (
                <span className="text-xs text-red-500">
                  {language === 'de' ? 'Unterschrift erforderlich' : 'Signature required'}
                </span>
              )}
              {signature && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSignature}
                  className="text-xs text-gray-500 hover:text-red-500 h-7 px-2"
                >
                  <Trash2 size={12} className="mr-1" />
                  {language === 'de' ? 'Löschen' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        )}

        {showTimeError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex gap-3">
            <Clock className="text-red-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-red-700 mb-1">
                Du kannst die Liste aktuell nicht absenden.
              </p>
              <p className="text-sm text-red-600 mb-2">
                Die Übermittlung ist nur innerhalb der vorgesehenen Zeitfenster möglich:
              </p>
              <p className="text-sm text-red-700 font-medium">
                ☀️ Frühschicht: 10:00 bis 17:00 Uhr
              </p>
              <p className="text-sm text-red-700 font-medium">
                🌙 Spätschicht: 16:00 bis 22:30 Uhr
              </p>
              <p className="text-sm text-red-600 mt-2">
                Bitte sende die Liste innerhalb des entsprechenden Zeitfensters ab.
              </p>
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
