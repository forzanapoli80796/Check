import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";
import type { EmployeeWorkflowState } from "@/lib/types";
import * as Icons from "lucide-react";

interface SubcategorySelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

const MENGENFORMULAR_NAMES = ['Mengenformular Frühschicht', 'Mengenformular Spätschicht'];

export default function SubcategorySelection({ state, updateState, goBack }: SubcategorySelectionProps) {
  const { t } = useLanguage();
  const [pendingSubcategory, setPendingSubcategory] = useState<Category | null>(null);
  const [sliderConfirmed, setSliderConfirmed] = useState(false);

  const { data: subcategories = [], isLoading } = useQuery<Category[]>({
    queryKey: [`/api/categories/${state.selectedArea}/subcategories`],
    enabled: !!state.selectedArea,
  });

  const selectSubcategory = (subcategory: Category) => {
    // Check if this is a whiteboard subcategory - go directly to whiteboard view
    if (subcategory.categoryType === 'whiteboard') {
      updateState({ 
        selectedArea: subcategory.id, 
        selectedAreaName: subcategory.name,
        selectedAreaType: 'whiteboard',
        step: 'tasks'
      });
      return;
    }
    
    // Store subcategory selection – save parent area before overwriting
    const needsShiftPhase = subcategory.useShifts !== false && state.selectedShift;
    
    updateState({ 
      selectedParentArea: state.selectedArea, // remember parent (e.g. Küche) for back navigation
      selectedArea: subcategory.id, 
      selectedAreaName: subcategory.name,
      selectedAreaUseShifts: subcategory.useShifts !== false,
      selectedAreaType: (subcategory.categoryType as 'shifts' | 'simple' | 'inventory' | 'whiteboard') || (subcategory.useShifts !== false ? "shifts" : "simple"),
      // Go to shift-phase if we have a shift selected and category uses shifts, otherwise straight to tasks
      step: needsShiftPhase ? 'shift-phase' : 'tasks'
    });
  };

  const getIcon = (iconName: string, color?: string) => {
    // Erweiterte Icon-Liste mit 50+ Icons
    const iconMap: Record<string, any> = {
      // Arbeit & Büro
      desktop: Icons.Monitor,
      briefcase: Icons.Briefcase,
      'clipboard-list': Icons.ClipboardList,
      'clipboard-check': Icons.ClipboardCheck,
      'file-text': Icons.FileText,
      folder: Icons.Folder,
      archive: Icons.Archive,
      printer: Icons.Printer,
      phone: Icons.Phone,
      
      // Küche & Essen  
      utensils: Icons.Utensils,
      coffee: Icons.Coffee,
      pizza: Icons.Pizza,
      cake: Icons.Cake,
      soup: Icons.Soup,
      beer: Icons.Beer,
      wine: Icons.Wine,
      milk: Icons.Milk,
      cherry: Icons.Cherry,
      
      // Transport & Fahrzeuge
      car: Icons.Car,
      truck: Icons.Truck,
      bike: Icons.Bike,
      plane: Icons.Plane,
      train: Icons.Train,
      ship: Icons.Ship,
      bus: Icons.Bus,
      
      // Reinigung & Wartung
      broom: Icons.Brush,
      wrench: Icons.Wrench,
      hammer: Icons.Hammer,
      sparkles: Icons.Sparkles,
      trash: Icons.Trash,
      recycle: Icons.Recycle,
      
      // Zeit & Kalender
      calendar: Icons.Calendar,
      'calendar-check': Icons.CalendarCheck,
      'calendar-days': Icons.CalendarDays,
      clock: Icons.Clock,
      timer: Icons.Timer,
      'alarm-clock': Icons.AlarmClock,
      
      // Menschen & Teams
      users: Icons.Users,
      user: Icons.User,
      'user-check': Icons.UserCheck,
      'user-plus': Icons.UserPlus,
      'users-round': Icons.UsersRound,
      
      // Einstellungen & System
      cog: Icons.Settings,
      sliders: Icons.Sliders,
      tool: Icons.Wrench,
      shield: Icons.Shield,
      lock: Icons.Lock,
      key: Icons.Key,
      
      // Lager & Inventar
      package: Icons.Package,
      box: Icons.Box,
      warehouse: Icons.Warehouse,
      'shopping-cart': Icons.ShoppingCart,
      barcode: Icons.Barcode,
      calculator: Icons.Calculator,
      
      // Verschiedenes
      star: Icons.Star,
      heart: Icons.Heart,
      flag: Icons.Flag,
      bell: Icons.Bell,
      bookmark: Icons.Bookmark,
      tag: Icons.Tag,
      home: Icons.Home,
      building: Icons.Building,
    };
    const IconComponent = iconMap[iconName] || Icons.Monitor;
    return <IconComponent style={{ color: color || undefined }} className={!color ? "text-primary" : ""} size={20} />;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center mb-6">
            <div className="step-indicator mr-3">2</div>
            <h2 className="text-xl font-medium">{t.employee.subcategorySelection?.title || 'Kategorie auswählen'}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTranslatedSubcategoryName = (subcategoryName: string) => {
    const translations: Record<string, string> = {
      'Küche Checkliste': t.employee.subcategorySelection?.kitchenChecklist || 'Küchen-Checkliste',
      'MHD-Check': t.employee.subcategorySelection?.mhdCheck || 'MHD-Check',
      'Mengenformular Spätschicht': t.employee.subcategorySelection?.lateShiftForm || 'Mengenformular Spätschicht',
      'Mengenformular Frühschicht': t.employee.subcategorySelection?.lunchShiftForm || 'Mengenformular Frühschicht',
    };
    return translations[subcategoryName] || subcategoryName;
  };

  // Day-restricted checklists: only shown on their designated weekday
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const DAY_RESTRICTED: Record<string, number> = {
    'Montagsliste (Dienstag TS17)': 1, // Monday (JP23/KP5); TS17 handled below (Tuesday)
    'Mittwochsliste':           3, // Wednesday
    'Sonder/Samstagsreinigung': 6, // Saturday
    'MHD-Check':                5, // Friday
  };
  const todayJS = new Date().getDay();
  const selectedStore = state.selectedStore;
  // isEarlyShiftOnly: used for VISIBILITY filtering (hide for Spätschicht)
  const isEarlyShiftOnly = (sub: Category) =>
    sub.earlyShiftOnly === true ||
    Object.prototype.hasOwnProperty.call(DAY_RESTRICTED, sub.name) ||
    sub.name.startsWith('Montagsliste');

  // isSonderliste: used for RED BORDER + "NICHT VERGESSEN" badge styling only
  // Excludes Mengenformular Frühschicht which is earlyShiftOnly but not a Sonderliste
  const SONDERLISTE_NAMES = ['MHD-Check', 'Mittwochsliste', 'Sonder/Samstagsreinigung'];
  const isSonderliste = (sub: Category) =>
    SONDERLISTE_NAMES.includes(sub.name) ||
    Object.prototype.hasOwnProperty.call(DAY_RESTRICTED, sub.name) ||
    sub.name.startsWith('Montagsliste');

  const isLateShiftOnly = (sub: Category) =>
    sub.name === 'Mengenformular Spätschicht';

  const visibleSubcategories = subcategories.filter(sub => {
    // earlyShiftOnly: nur Frühschicht
    if (state.selectedShift === 'spätschicht' && isEarlyShiftOnly(sub)) return false;
    // lateShiftOnly: nur Spätschicht
    if (state.selectedShift === 'frühschicht' && isLateShiftOnly(sub)) return false;
    // Special: TS17 does Montagsliste on Tuesday (closed Monday)
    if (sub.name === 'Montagsliste (Dienstag TS17)') {
      return selectedStore === 'TS17' ? todayJS === 2 : todayJS === 1;
    }
    const restrictedDay = DAY_RESTRICTED[sub.name];
    return restrictedDay === undefined || restrictedDay === todayJS;
  });

  return (
    <>
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">{t.employee.subcategorySelection?.title || 'Kategorie auswählen'}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {visibleSubcategories.map((subcategory) => {
            const sonderliste = isSonderliste(subcategory);
            return (
              <div key={subcategory.id} className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (MENGENFORMULAR_NAMES.includes(subcategory.name)) {
                      setSliderConfirmed(false);
                      setPendingSubcategory(subcategory);
                    } else {
                      selectSubcategory(subcategory);
                    }
                  }}
                  className={`selection-button justify-start ${sonderliste ? 'border-2 border-red-500 text-red-700 hover:border-red-600 hover:text-red-800' : ''}`}
                  data-testid={`button-subcategory-${subcategory.id}`}
                >
                  {getIcon(subcategory.icon, sonderliste ? '#dc2626' : (subcategory.iconColor || undefined))}
                  <span className="font-medium">{getTranslatedSubcategoryName(subcategory.name)}</span>
                  {sonderliste && (
                    <span className="ml-auto text-xs font-bold text-red-600 animate-pulse bg-red-50 border border-red-300 rounded px-2 py-0.5 shrink-0">
                      NICHT VERGESSEN
                    </span>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          variant="ghost"
          onClick={goBack}
          className="mt-4"
          data-testid="button-back-to-areas"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.common.back}
        </Button>
      </CardContent>
    </Card>

    {/* Confirmation dialog for Mengenformular categories */}
    <Dialog open={!!pendingSubcategory} onOpenChange={(open) => { if (!open) setPendingSubcategory(null); }}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Bestätigung erforderlich</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <p className="text-sm text-gray-700 leading-relaxed border-l-4 border-orange-400 pl-3 bg-orange-50 py-3 pr-3 rounded-r-md">
            "Ich bestätige, zuerst die Küchen-Checkliste und anschließend das Mengenformular auszufüllen. Mir ist bewusst, dass bei Nichteinhaltung arbeitsrechtliche Konsequenzen drohen können."
          </p>
          <div className="flex items-center gap-3">
            <Switch
              id="mengenformular-confirm"
              checked={sliderConfirmed}
              onCheckedChange={setSliderConfirmed}
            />
            <Label htmlFor="mengenformular-confirm" className="text-sm cursor-pointer select-none">
              {sliderConfirmed ? 'Bestätigt' : 'Zum Bestätigen aktivieren'}
            </Label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPendingSubcategory(null)}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              disabled={!sliderConfirmed}
              onClick={() => {
                if (pendingSubcategory) {
                  setPendingSubcategory(null);
                  selectSubcategory(pendingSubcategory);
                }
              }}
            >
              Weiter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}