import { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmployeeInfoProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function EmployeeInfo({ state, updateState, goBack }: EmployeeInfoProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(state.employeeName || '');

  const proceedToNext = () => {
    const employeeName = name.trim();
    
    if (!employeeName) {
      return;
    }

    // Update state with employee name - IMMER zu 'area' gehen!
    // Whiteboard kommt NACH Area-Auswahl, nie vorher
    updateState({ 
      employeeName,
      step: 'area'
    });
  };

  const isComplete = name.trim();

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">
            Mitarbeiter-Information
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee-name" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              {t.employee.detailsEntry.employeeName}
            </Label>
            <Input
              id="employee-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.employee.detailsEntry.enterName}
              className="text-lg"
              autoFocus
              data-testid="input-employee-name"
            />
          </div>

          <Button
            onClick={proceedToNext}
            disabled={!isComplete}
            className="w-full h-12 text-base font-medium"
            data-testid="button-proceed-next"
          >
            Weiter
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={goBack}
          className="mt-4 w-full"
          data-testid="button-back"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.common.back}
        </Button>
      </CardContent>
    </Card>
  );
}
