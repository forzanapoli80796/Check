import { useEffect } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Category } from "@shared/schema";

interface ShiftPhaseSelectionProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function ShiftPhaseSelection({ state, updateState, goBack }: ShiftPhaseSelectionProps) {
  const { t } = useLanguage();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const currentCategory = categories?.find(c => c.id === state.selectedArea);
  const excluded = currentCategory?.excludedShiftCombos ?? [];

  const shift = state.selectedShift;
  const anfangCombo = `${shift}_schichtanfang`;
  const endeCombo = `${shift}_schichtende`;

  const showAnfang = !excluded.includes(anfangCombo);
  const showEnde = !excluded.includes(endeCombo);

  // If only one phase is valid, auto-select and proceed
  useEffect(() => {
    if (!categories) return;
    if (showAnfang && !showEnde) {
      updateState({ selectedShiftPhase: 'schichtanfang', step: 'tasks' });
    } else if (!showAnfang && showEnde) {
      updateState({ selectedShiftPhase: 'schichtende', step: 'tasks' });
    }
  }, [categories, showAnfang, showEnde]);

  const selectPhase = (phase: 'schichtanfang' | 'schichtende') => {
    updateState({ selectedShiftPhase: phase, step: 'tasks' });
  };

  const shiftLabel = shift === 'frühschicht' ? t.employee.detailsEntry.earlyShift : t.employee.detailsEntry.lateShift;

  // If auto-selecting, show nothing while redirecting
  if (categories && (!showAnfang || !showEnde) && !(showAnfang && showEnde)) {
    return null;
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">4</div>
          <h2 className="text-xl font-medium">{t.employee.shiftPhase.title}</h2>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-600">
              {t.employee.shiftPhase.youSelected} <span className="font-semibold">{shiftLabel}</span>.
            </p>
            <p className="text-gray-600 mt-1">
              {t.employee.shiftPhase.areYouAt} <span className="font-semibold">{t.employee.shiftPhase.start}</span> {t.employee.shiftPhase.or} <span className="font-semibold">{t.employee.shiftPhase.end}</span> {t.employee.shiftPhase.ofShift}?
            </p>
          </div>

          <div className={`grid gap-3 ${showAnfang && showEnde ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showAnfang && (
              <Button
                variant="outline"
                onClick={() => selectPhase('schichtanfang')}
                className="p-4 h-auto selection-button"
              >
                <div className="flex flex-col items-center">
                  <Play className="text-blue-600 mb-2" size={24} />
                  <span className="font-medium">{t.employee.shiftPhase.start}</span>
                  <span className="text-xs text-gray-500 mt-1">{t.employee.shiftPhase.ofThe} {shiftLabel}</span>
                </div>
              </Button>
            )}
            {showEnde && (
              <Button
                variant="outline"
                onClick={() => selectPhase('schichtende')}
                className="p-4 h-auto selection-button"
              >
                <div className="flex flex-col items-center">
                  <Square className="text-purple-600 mb-2" size={24} />
                  <span className="font-medium">{t.employee.shiftPhase.end}</span>
                  <span className="text-xs text-gray-500 mt-1">{t.employee.shiftPhase.ofThe} {shiftLabel}</span>
                </div>
              </Button>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg mt-4">
            <p className="text-sm text-blue-800">
              {t.employee.shiftPhase.differentTasks}
            </p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button variant="outline" onClick={goBack} className="w-full">
            {t.common.back}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
