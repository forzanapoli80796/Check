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

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      desktop: Icons.Monitor,
      utensils: Icons.Utensils,
      car: Icons.Car,
      'clipboard-list': Icons.ClipboardList,
      broom: Icons.Brush,
      briefcase: Icons.Briefcase,
      cog: Icons.Settings,
      users: Icons.Users,
    };
    const IconComponent = iconMap[iconName] || Icons.Monitor;
    return <IconComponent className="text-primary" size={20} />;
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
              {getIcon(category.icon)}
              <span className="font-medium">{getTranslatedCategoryName(category.name)}</span>
              {category.useShifts === false && (
                <span className="ml-auto text-xs text-gray-500">{t.admin.areas.simpleChecklist}</span>
              )}
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
