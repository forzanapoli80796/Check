import { useState } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";

interface ShiftPhaseSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function ShiftPhaseSelection({ state, updateState }: ShiftPhaseSelectionProps) {
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
    updateState({ step: 'details' });
  };

  const shiftLabel = state.selectedShift === 'frühschicht' ? 'Frühschicht' : 'Spätschicht';

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">4</div>
          <h2 className="text-xl font-medium">Schichtphase auswählen</h2>
        </div>
        
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              Sie haben <span className="font-semibold">{shiftLabel}</span> ausgewählt.
            </p>
            <p className="text-gray-600 mt-1">
              Sind Sie am <span className="font-semibold">Start</span> oder am <span className="font-semibold">Ende</span> der Schicht?
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
                <span className="font-medium">Start</span>
                <span className="text-xs text-gray-500 mt-1">der {shiftLabel}</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => selectPhase('schichtende')}
              className={`p-4 h-auto ${selectedPhase === 'schichtende' ? 'selection-button selected' : 'selection-button'}`}
            >
              <div className="flex flex-col items-center">
                <Square className="text-purple-600 mb-2" size={24} />
                <span className="font-medium">Ende</span>
                <span className="text-xs text-gray-500 mt-1">der {shiftLabel}</span>
              </div>
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mt-4">
            <p className="text-sm text-blue-800">
              Je nach Schichtphase erhalten Sie unterschiedliche Aufgaben zur Bearbeitung.
            </p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={proceedToTasks} 
            className="flex-1" 
            disabled={!selectedPhase}
          >
            Weiter zu den Aufgaben
          </Button>
          <Button variant="outline" onClick={goBack}>
            Zurück
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}