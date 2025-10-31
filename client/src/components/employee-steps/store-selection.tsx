import { Store, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STORES, EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface StoreSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function StoreSelection({ state, updateState }: StoreSelectionProps) {
  const { t } = useLanguage();
  
  const selectStore = (store: string) => {
    // If this is a Betriebsleiter, skip area selection and go directly to details
    if (state.isBetriebsleiter && state.betriebsleiterCategoryId) {
      updateState({ 
        selectedStore: store, 
        selectedArea: state.betriebsleiterCategoryId,
        selectedAreaName: 'Betriebsleiter',
        selectedAreaUseShifts: false,
        step: 'details' 
      });
    } else {
      // Normal employees: go to employee-info to enter name/shift
      // This will check whiteboard enforcement before showing categories
      updateState({ selectedStore: store, step: 'employee-info' });
    }
  };

  const resetSavedPreferences = () => {
    localStorage.removeItem('employeeStore');
    localStorage.removeItem('employeeShift');
    localStorage.removeItem('employeeName');
    updateState({
      selectedStore: null,
      selectedShift: null,
      employeeName: '',
    });
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">1</div>
          <h2 className="text-xl font-medium">{t.employee.storeSelection.title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {STORES.map((store) => (
            <Button
              key={store}
              variant="outline"
              onClick={() => selectStore(store)}
              className="selection-button justify-start"
            >
              <Store className="text-primary" size={20} />
              <span className="font-medium">{store}</span>
            </Button>
          ))}
        </div>
        
        {(state.selectedStore || state.selectedShift || state.employeeName) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSavedPreferences}
              className="w-full text-gray-500 hover:text-gray-700"
              data-testid="button-reset-preferences"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Gespeicherte Einstellungen zurücksetzen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
