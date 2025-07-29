import { ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AREAS, AREA_LABELS, AREA_ICONS, EmployeeWorkflowState } from "@/lib/types";

interface AreaSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function AreaSelection({ state, updateState }: AreaSelectionProps) {
  const selectArea = (area: string) => {
    updateState({ selectedArea: area, step: 'details' });
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
    };
    const IconComponent = iconMap[iconName] || Icons.Monitor;
    return <IconComponent className="text-primary" size={20} />;
  };

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">Arbeitsbereich auswählen</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {AREAS.map((area) => (
            <Button
              key={area}
              variant="outline"
              onClick={() => selectArea(area)}
              className="selection-button justify-start"
            >
              {getIcon(AREA_ICONS[area])}
              <span className="font-medium">{AREA_LABELS[area]}</span>
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
