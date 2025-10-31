import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShiftPhaseSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function ShiftPhaseSelection({ state, updateState }: ShiftPhaseSelectionProps) {
  const { t } = useLanguage();
  const [selectedPhase, setSelectedPhase] = useState(state.selectedShiftPhase);

  const selectPhase = (phase: 'schichtanfang' | 'schichtende') => {
    setSelectedPhase(phase);
  };

  const proceedToTasks = () => {
    updateState({ 
      selectedShiftPhase: selectedPhase,
      step: 'tasks' 
    });
  };

  const goBack = () => {
    // If we have subcategories, go back to subcategory selection
    // Otherwise go back to shift or area selection based on whether shift was selected
    if (state.selectedAreaHasSubcategories) {
      updateState({ step: 'subcategory' });
    } else if (state.selectedShift && state.selectedAreaUseShifts) {
      updateState({ step: 'shift' });
    } else {
      updateState({ step: 'area' });
    }
  };

  const shiftLabel = state.selectedShift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift;

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">4</div>
          <h2 className="text-xl font-medium">{t.employee.shiftPhase.title}</h2>
        </div>
        
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              {t.employee.shiftPhase.youSelected} <span className="font-semibold">{shiftLabel}</span>.
            </p>
            <p className="text-gray-600 mt-1">
              {t.employee.shiftPhase.areYouAt} <span className="font-semibold">{t.employee.shiftPhase.start}</span> {t.employee.shiftPhase.or} <span className="font-semibold">{t.employee.shiftPhase.end}</span> {t.employee.shiftPhase.ofShift}?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => selectPhase('schichtanfang')}
              className={`p-4 h-auto ${selectedPhase === 'schichtanfang' ? 'selection-button selected' : 'selection-button'}`}
            >
              <div className="flex flex-col items-center">
                <Play className="text-blue-600 mb-2" size={24} />
                <span className="font-medium">{t.employee.shiftPhase.start}</span>
                <span className="text-xs text-gray-500 mt-1">{t.employee.shiftPhase.ofThe} {shiftLabel}</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => selectPhase('schichtende')}
              className={`p-4 h-auto ${selectedPhase === 'schichtende' ? 'selection-button selected' : 'selection-button'}`}
            >
              <div className="flex flex-col items-center">
                <Square className="text-purple-600 mb-2" size={24} />
                <span className="font-medium">{t.employee.shiftPhase.end}</span>
                <span className="text-xs text-gray-500 mt-1">{t.employee.shiftPhase.ofThe} {shiftLabel}</span>
              </div>
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mt-4">
            <p className="text-sm text-blue-800">
              {t.employee.shiftPhase.differentTasks}
            </p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={proceedToTasks} 
            className="flex-1" 
            disabled={!selectedPhase}
          >
            {t.employee.shiftPhase.continueToTasks}
          </Button>
          <Button variant="outline" onClick={goBack}>
            {t.common.back}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}