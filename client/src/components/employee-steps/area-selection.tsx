import { ArrowLeft, MessageSquare } from "lucide-react";
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
}

export default function AreaSelection({ state, updateState }: AreaSelectionProps) {
  const { t } = useLanguage();
  const { data: allCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter out subcategories - only show main categories (those without parentId)
  const categories = allCategories.filter(cat => !cat.parentId);

  const selectArea = (category: Category) => {
    console.log('Selected category:', { 
      id: category.id, 
      name: category.name, 
      useShifts: category.useShifts,
      categoryType: category.categoryType,
      isSubcategoryParent: category.isSubcategoryParent,
      actualType: typeof category.useShifts 
    });
    
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
    
    if (hasSubcategories || category.isSubcategoryParent) {
      // If it has subcategories, go to subcategory selection
      updateState({ 
        selectedArea: category.id, 
        selectedAreaName: category.name,
        selectedAreaHasSubcategories: true,
        step: 'subcategory' 
      });
    } else {
      // Otherwise, proceed to details
      updateState({ 
        selectedArea: category.id, 
        selectedAreaName: category.name,
        selectedAreaUseShifts: category.useShifts !== false,
        selectedAreaType: category.categoryType || (category.useShifts !== false ? "shifts" : "simple"),
        selectedAreaHasSubcategories: false,
        step: 'details' 
      });
    }
  };

  const goBack = () => {
    updateState({ step: 'store' });
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
          <div className="step-indicator mr-3">2</div>
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
          
          {/* Nachricht an Admin senden Button */}
          <Button
            variant="outline"
            onClick={() => updateState({ 
              step: 'sendMessage',
              selectedAreaName: null, 
              employeeName: 'Mitarbeiter'
            })}
            className="selection-button justify-start border-blue-200 hover:bg-blue-50"
            data-testid="button-send-message"
          >
            <MessageSquare className="text-blue-600" size={20} />
            <span className="font-medium text-blue-600">Nachricht an Admin senden</span>
          </Button>
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
