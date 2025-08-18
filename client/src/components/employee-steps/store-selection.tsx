import { Store } from "lucide-react";
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
      updateState({ selectedStore: store, step: 'area' });
    }
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
      </CardContent>
    </Card>
  );
}
