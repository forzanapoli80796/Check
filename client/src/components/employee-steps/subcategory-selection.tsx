import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
}

export default function SubcategorySelection({ state, updateState }: SubcategorySelectionProps) {
  const { t } = useLanguage();
  
  const { data: subcategories = [], isLoading } = useQuery<Category[]>({
    queryKey: [`/api/categories/${state.selectedArea}/subcategories`],
    enabled: !!state.selectedArea,
  });

  const selectSubcategory = (subcategory: Category) => {
    console.log('Selected subcategory:', { 
      id: subcategory.id, 
      name: subcategory.name, 
      useShifts: subcategory.useShifts,
      categoryType: subcategory.categoryType,
    });
    updateState({ 
      selectedArea: subcategory.id, 
      selectedAreaName: subcategory.name,
      selectedAreaUseShifts: subcategory.useShifts !== false,
      selectedAreaType: subcategory.categoryType || (subcategory.useShifts !== false ? "shifts" : "simple"),
      step: 'details' 
    });
  };

  const goBack = () => {
    updateState({ 
      selectedArea: null,
      selectedAreaName: null,
      step: 'area' 
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
      'Mengenformular Mittagsschicht': t.employee.subcategorySelection?.lunchShiftForm || 'Mengenformular Mittagsschicht',
    };
    return translations[subcategoryName] || subcategoryName;
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">{t.employee.subcategorySelection?.title || 'Kategorie auswählen'}</h2>
        </div>
        <p className="text-gray-600 mb-6">
          {t.employee.subcategorySelection?.subtitle || 'Wählen Sie eine Kategorie für den Küchenbereich'}
        </p>
        <div className="grid grid-cols-1 gap-3">
          {subcategories.map((subcategory) => (
            <Button
              key={subcategory.id}
              variant="outline"
              onClick={() => selectSubcategory(subcategory)}
              className="selection-button justify-start"
              data-testid={`button-subcategory-${subcategory.id}`}
            >
              {getIcon(subcategory.icon, subcategory.iconColor || undefined)}
              <span className="font-medium">{getTranslatedSubcategoryName(subcategory.name)}</span>
            </Button>
          ))}
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
  );
}