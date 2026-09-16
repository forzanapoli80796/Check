import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";

interface SuccessScreenProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function SuccessScreen({ state, updateState, goBack }: SuccessScreenProps) {
  const startNewChecklist = () => {
    // Load saved preferences from localStorage
    const savedStore = localStorage.getItem('employeeStore');
    const savedShift = localStorage.getItem('employeeShift');
    const savedName = localStorage.getItem('employeeName');
    
    updateState({
      step: 'employee-info',
      selectedStore: savedStore || null,
      selectedArea: null,
      employeeName: savedName || '',
      selectedShift: (savedShift as 'frühschicht' | 'spätschicht' | null) || null,
      completedTasks: [],
      totalTasks: 0,
      mhdEmailStatus: undefined,
    });
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-medium mb-2">Checkliste erfolgreich übermittelt!</h2>
        <p className="text-gray-600 mb-6">
          Deine Aufgaben wurden erfolgreich dokumentiert und gespeichert.
        </p>
        {state.mhdEmailStatus === 'failed' && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-left text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm">
                Die Checkliste wurde gespeichert, aber die MHD-E-Mail konnte nicht
                gesendet werden. Bitte nicht erneut absenden – die gespeicherte
                Checkliste bleibt im Admin-Bereich erhalten.
              </p>
            </div>
          </div>
        )}
        <Button onClick={startNewChecklist} className="bg-primary hover:bg-blue-700">
          Neue Checkliste starten
        </Button>
      </CardContent>
    </Card>
  );
}
