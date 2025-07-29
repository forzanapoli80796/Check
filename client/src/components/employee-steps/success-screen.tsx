import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";

interface SuccessScreenProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function SuccessScreen({ updateState }: SuccessScreenProps) {
  const startNewChecklist = () => {
    updateState({
      step: 'store',
      selectedStore: null,
      selectedArea: null,
      employeeName: '',
      selectedShift: null,
      completedTasks: [],
      totalTasks: 0,
    });
  };

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6 text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-medium mb-2">Checkliste erfolgreich übermittelt!</h2>
        <p className="text-gray-600 mb-6">
          Ihre Aufgaben wurden erfolgreich dokumentiert und gespeichert.
        </p>
        <Button onClick={startNewChecklist} className="bg-primary hover:bg-blue-700">
          Neue Checkliste starten
        </Button>
      </CardContent>
    </Card>
  );
}
