import { useState, useEffect } from "react";
import { ArrowLeft, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";

interface EmployeeDetailsProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function EmployeeDetails({ state, updateState }: EmployeeDetailsProps) {
  const [name, setName] = useState(state.employeeName);
  const [selectedShift, setSelectedShift] = useState(state.selectedShift);

  // Skip shift selection for categories without shifts
  const useShifts = state.selectedAreaUseShifts !== false;
  const isComplete = name.trim() && (!useShifts || selectedShift);

  const selectShift = (shift: 'frühschicht' | 'spätschicht') => {
    setSelectedShift(shift);
  };

  const proceedToShiftPhase = () => {
    updateState({ 
      employeeName: name.trim(), 
      selectedShift: !useShifts ? null : selectedShift,
      selectedShiftPhase: !useShifts ? null : null, // Will be selected in next step if using shifts
      step: !useShifts ? 'tasks' : 'shift-phase' // Skip phase selection for categories without shifts
    });
  };

  const goBack = () => {
    // If Betriebsleiter, go back to store selection (they skip area selection)
    if (state.isBetriebsleiter) {
      updateState({ step: 'store' });
    } else {
      updateState({ step: 'area' });
    }
  };

  useEffect(() => {
    updateState({ employeeName: name, selectedShift });
  }, [name, selectedShift]);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">3</div>
          <h2 className="text-xl font-medium">
            {state.isBetriebsleiter ? 'Betriebsleiter-Daten' : 'Mitarbeiterdaten'}
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee-name">
              {state.isBetriebsleiter ? 'Name' : 'Vorname'}
            </Label>
            <Input
              id="employee-name"
              placeholder={state.isBetriebsleiter ? 'Name eingeben' : 'Vorname eingeben'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
          </div>
          {/* Only show shift selection if category uses shifts */}
          {useShifts && (
            <div>
              <Label className="block mb-3">Schicht auswählen</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => selectShift('frühschicht')}
                  className={`p-3 ${selectedShift === 'frühschicht' ? 'selection-button selected' : 'selection-button'}`}
                >
                  <span className="text-green-600 mr-2">☀️</span>
                  Frühschicht
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectShift('spätschicht')}
                  className={`p-3 ${selectedShift === 'spätschicht' ? 'selection-button selected' : 'selection-button'}`}
                >
                  <span className="text-orange-600 mr-2">🌙</span>
                  Spätschicht
                </Button>
              </div>
            </div>
          )}

          {/* Info message for categories without shifts */}
          {!useShifts && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Dieser Bereich hat keine Schichteinteilung - direkt zu den Aufgaben.
              </p>
            </div>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={proceedToShiftPhase} 
            className="flex-1" 
            disabled={!isComplete}
          >
            Weiter
          </Button>
          <Button variant="outline" onClick={goBack}>
            Zurück
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
