import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Moon } from "lucide-react";

interface ShiftSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function ShiftSelection({ state, updateState, goBack }: ShiftSelectionProps) {
  const { t } = useLanguage();
  const [selectedShift, setSelectedShift] = useState<'frühschicht' | 'spätschicht' | null>(
    state.selectedShift
  );

  const selectShift = (shift: 'frühschicht' | 'spätschicht') => {
    setSelectedShift(shift);
    
    // Nach Shift-Auswahl geht's weiter zu Subcategory (falls vorhanden) oder Shift-Phase
    const nextStep = state.selectedAreaHasSubcategories ? 'subcategory' : 'shift-phase';
    
    // Update state and proceed to next step
    updateState({ 
      selectedShift: shift,
      step: nextStep
    });
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">4</div>
          <h2 className="text-xl font-medium">
            Schicht wählen
          </h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Der Arbeitsbereich "{state.selectedAreaName}" arbeitet in Schichten.
          Bitte wählen Sie Ihre aktuelle Schicht:
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={selectedShift === 'frühschicht' ? 'default' : 'outline'}
            onClick={() => selectShift('frühschicht')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            data-testid="button-shift-early"
          >
            <Sun className="w-8 h-8" />
            <span className="text-base font-medium">{t.employee.detailsEntry.earlyShift}</span>
          </Button>
          
          <Button
            variant={selectedShift === 'spätschicht' ? 'default' : 'outline'}
            onClick={() => selectShift('spätschicht')}
            className="h-24 flex flex-col items-center justify-center gap-2"
            data-testid="button-shift-late"
          >
            <Moon className="w-8 h-8" />
            <span className="text-base font-medium">{t.employee.detailsEntry.lateShift}</span>
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={goBack}
          className="mt-6 w-full"
          data-testid="button-back"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.common.back}
        </Button>
      </CardContent>
    </Card>
  );
}