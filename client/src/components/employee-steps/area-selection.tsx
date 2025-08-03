import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { EmployeeWorkflowState } from "@/lib/types";
import type { Category } from "@shared/schema";

interface AreaSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function AreaSelection({ state, updateState }: AreaSelectionProps) {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectArea = (categoryId: string, categoryName: string) => {
    updateState({ selectedArea: categoryId, selectedAreaName: categoryName, step: 'details' });
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
            <h2 className="text-xl font-medium">Arbeitsbereich auswählen</h2>
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

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">Arbeitsbereich auswählen</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => selectArea(category.id, category.name)}
              className="selection-button justify-start"
            >
              {getIcon(category.icon)}
              <span className="font-medium">{category.name}</span>
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={goBack}
          className="mt-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück
        </Button>
      </CardContent>
    </Card>
  );
}
