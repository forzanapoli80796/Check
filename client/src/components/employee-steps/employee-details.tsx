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

  // For inventory, skip shift selection
  const isInventory = state.selectedArea === 'inventur';
  const isComplete = name.trim() && (isInventory || selectedShift);

  const selectShift = (shift: 'schichtanfang' | 'schichtende') => {
    setSelectedShift(shift);
  };

  const proceedToTasks = () => {
    updateState({ 
      employeeName: name.trim(), 
      selectedShift: isInventory ? 'schichtanfang' : selectedShift, // Default for inventory
      step: 'tasks' 
    });
  };

  const goBack = () => {
    updateState({ step: 'area' });
  };

  useEffect(() => {
    updateState({ employeeName: name, selectedShift });
  }, [name, selectedShift]);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">3</div>
          <h2 className="text-xl font-medium">Mitarbeiterdaten</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee-name">Vorname</Label>
            <Input
              id="employee-name"
              placeholder="Vorname eingeben"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
          </div>
          {/* Only show shift selection if not inventory */}
          {!isInventory && (
            <div>
              <Label className="block mb-3">Schicht</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => selectShift('schichtanfang')}
                  className={`p-3 ${selectedShift === 'schichtanfang' ? 'selection-button selected' : 'selection-button'}`}
                >
                  <Play className="text-secondary mr-2" size={16} />
                  Schichtanfang
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectShift('schichtende')}
                  className={`p-3 ${selectedShift === 'schichtende' ? 'selection-button selected' : 'selection-button'}`}
                >
                  <Square className="text-red-500 mr-2" size={16} />
                  Schichtende
                </Button>
              </div>
            </div>
          )}

          {/* Info message for inventory */}
          {isInventory && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Bei der Inventur ist keine Schichtauswahl erforderlich.
              </p>
            </div>
          )}
        </div>
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={proceedToTasks} 
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
