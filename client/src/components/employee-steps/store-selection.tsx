import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STORES, EmployeeWorkflowState } from "@/lib/types";

interface StoreSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function StoreSelection({ updateState }: StoreSelectionProps) {
  const selectStore = (store: string) => {
    updateState({ selectedStore: store, step: 'area' });
  };

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">1</div>
          <h2 className="text-xl font-medium">Filiale auswählen</h2>
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
