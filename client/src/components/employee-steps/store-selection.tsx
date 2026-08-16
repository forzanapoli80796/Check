import { useState } from "react";
import { Store, RotateCcw, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STORES, EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface StoreSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function StoreSelection({ state, updateState, goBack }: StoreSelectionProps) {
  const { t } = useLanguage();
  const [pendingStore, setPendingStore] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const selectStore = (store: string) => {
    // Sicherheitsabfrage: Store muss nochmals bestätigt werden
    setMismatch(false);
    setPendingStore(store);
  };

  const confirmStore = (store: string) => {
    if (!pendingStore) return;
    if (store === pendingStore) {
      setPendingStore(null);
      // Normal employees: go to employee-info to enter name/shift
      // This will check whiteboard enforcement before showing categories
      updateState({ selectedStore: store, step: 'employee-info' });
    } else {
      // Falsche Bestätigung → zurück zur Auswahl mit Hinweis
      setPendingStore(null);
      setMismatch(true);
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
        {mismatch && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Die Bestätigung stimmte nicht mit deiner Auswahl überein. Bitte wähle deinen Store erneut aus.
            </p>
          </div>
        )}
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

        {/* Sicherheitsabfrage: Store nochmals bestätigen */}
        <Dialog open={!!pendingStore} onOpenChange={(open) => !open && setPendingStore(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Store bestätigen
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-700">
              Bitte bestätige nochmals, dass du aktuell am Store{" "}
              <span className="font-bold">{pendingStore}</span> arbeitest:
            </p>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {STORES.map((store) => (
                <Button
                  key={store}
                  variant="outline"
                  className="w-full justify-center text-base py-5 font-semibold"
                  onClick={() => confirmStore(store)}
                >
                  {store}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-1 text-gray-500"
              onClick={() => setPendingStore(null)}
            >
              Abbrechen
            </Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
