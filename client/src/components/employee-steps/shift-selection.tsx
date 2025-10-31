import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sun, Moon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

interface ShiftSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function ShiftSelection({ state, updateState }: ShiftSelectionProps) {
  const { t } = useLanguage();
  const [selectedShift, setSelectedShift] = useState<'frühschicht' | 'spätschicht' | null>(
    state.selectedShift
  );

  // Load subcategories to check if any have enforceReading
  const { data: subcategories = [] } = useQuery<Category[]>({
    queryKey: [`/api/categories/${state.selectedArea}/subcategories`],
    enabled: !!state.selectedArea && state.selectedAreaHasSubcategories,
  });

  const selectShift = (shift: 'frühschicht' | 'spätschicht') => {
    setSelectedShift(shift);
    
    // Check if any subcategory has enforceReading enabled
    const hasEnforcedWhiteboard = subcategories.some(sub => sub.enforceReading);
    
    // Determine next step
    let nextStep: EmployeeWorkflowState['step'];
    if (hasEnforcedWhiteboard) {
      // Must read whiteboard first
      nextStep = 'whiteboard-confirmation';
    } else if (state.selectedAreaHasSubcategories) {
      // Go to subcategory selection
      nextStep = 'subcategory';
    } else {
      // Go to shift phase
      nextStep = 'shift-phase';
    }
    
    // Update state and proceed to next step
    updateState({ 
      selectedShift: shift,
      step: nextStep
    });
  };

  const goBack = () => {
    updateState({ step: 'area' });
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