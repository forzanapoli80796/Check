import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EmployeeWorkflowState } from "@/lib/types";
import type { Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface AreaSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function AreaSelection({ state, updateState, goBack }: AreaSelectionProps) {
  const { t } = useLanguage();
  const { data: allCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter: no subcategories + hide earlyShiftOnly categories for Spätschicht
  const categories = allCategories.filter(cat => {
    if (cat.parentId) return false;
    if (cat.earlyShiftOnly && state.selectedShift === 'spätschicht') return false;
    return true;
  });

  const selectArea = async (category: Category) => {
    // Check if this is a whiteboard category - go directly to whiteboard view
    if (category.categoryType === 'whiteboard') {
      updateState({ 
        selectedArea: category.id, 
        selectedAreaName: category.name,
        selectedAreaType: 'whiteboard',
        step: 'tasks'
      });
      return;
    }
    
    // Check if this category actually has subcategories (not just the flag)
    const hasSubcategories = allCategories.some(cat => cat.parentId === category.id);
    
    // Check if any subcategory has enforceReading enabled (whiteboard enforcement)
    const subcategories = allCategories.filter(cat => cat.parentId === category.id);
    const hasEnforcedWhiteboard = subcategories.some(sub => sub.enforceReading);
    
    // Store the area selection
    const areaUpdate = {
      selectedArea: category.id, 
      selectedAreaName: category.name,
      selectedAreaHasSubcategories: hasSubcategories || category.isSubcategoryParent,
      selectedAreaUseShifts: category.useShifts !== false,
      selectedAreaType: (category.categoryType as 'shifts' | 'simple' | 'inventory' | 'whiteboard') || (category.useShifts !== false ? "shifts" : "simple")
    };
    
    // Determine the next step - WICHTIG: Whiteboard kommt NACH Area-Auswahl, VOR Shift!
    // Reihenfolge: Area → Whiteboard (wenn enforceReading) → Shift → Subcategory → Tasks
    
    if (hasEnforcedWhiteboard) {
      // Quiz kommt zuerst, dann Whiteboard
      updateState({ 
        ...areaUpdate,
        step: 'quiz'
      });
    } else {
      // Kein Whiteboard - normale Reihenfolge
      if (hasSubcategories || category.isSubcategoryParent) {
        // Go to subcategory selection
        updateState({ 
          ...areaUpdate,
          step: 'subcategory' 
        });
      } else {
        // No subcategories
        // If area needs shift phase (has shift selected, uses shifts, and phase not already set)
        // For TS17, selectedShiftPhase is already set in the shift-selection step → skip shift-phase
        const needsShiftPhase = state.selectedShift && category.useShifts !== false && !state.selectedShiftPhase;
        
        updateState({ 
          ...areaUpdate,
          selectedAreaHasSubcategories: false,
          step: needsShiftPhase ? 'shift-phase' : 'tasks'
        });
      }
    }
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
            <h2 className="text-xl font-medium">{t.employee.areaSelection.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to translate category names
  const getTranslatedCategoryName = (categoryName: string) => {
    const areas = t.employee.areaSelection.areas as Record<string, string>;
    return areas[categoryName] || categoryName;
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">4</div>
          <h2 className="text-xl font-medium">{t.employee.areaSelection.title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => selectArea(category)}
              className="selection-button justify-start"
            >
              {getIcon(category.icon, category.iconColor || undefined)}
              <span className="font-medium">{getTranslatedCategoryName(category.name)}</span>
            </Button>
          ))}
          
        </div>
        <Button
          variant="outline"
          onClick={goBack}
          className="mt-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.common.back}
        </Button>
      </CardContent>
    </Card>
  );
}
