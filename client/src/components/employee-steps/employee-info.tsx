import { useState } from "react";
import { ArrowLeft, Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeWorkflowState } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

interface EmployeeInfoProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
}

export default function EmployeeInfo({ state, updateState }: EmployeeInfoProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(state.employeeName || '');
  const [selectedShift, setSelectedShift] = useState<'frühschicht' | 'spätschicht' | null>(state.selectedShift);
  const [isChecking, setIsChecking] = useState(false);

  // Fetch categories to check if whiteboard enforcement is enabled
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const whiteboardCategory = categories.find(cat => cat.categoryType === 'whiteboard' && cat.enforceReading);

  const selectShift = (shift: 'frühschicht' | 'spätschicht') => {
    setSelectedShift(shift);
  };

  const proceedToNext = async () => {
    const employeeName = name.trim();
    const shift = selectedShift;
    
    if (!employeeName || !shift) {
      return;
    }

    // Update state with employee details
    updateState({ 
      employeeName,
      selectedShift: shift,
    });

    // Check if whiteboard enforcement is enabled
    if (whiteboardCategory && employeeName && shift) {
      setIsChecking(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `/api/whiteboard-reads/check?` + 
          `employeeName=${encodeURIComponent(employeeName)}` +
          `&store=${encodeURIComponent(state.selectedStore || '')}` +
          `&shift=${encodeURIComponent(shift)}` +
          `&date=${today}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to check whiteboard read status');
        }
        
        const data = await response.json();
        
        if (!data.hasRead) {
          // Employee hasn't read whiteboard today for this shift - ENFORCE IT
          setIsChecking(false);
          updateState({ step: 'whiteboard' });
          return;
        }
      } catch (error) {
        console.error('Error checking whiteboard read:', error);
        setIsChecking(false);
        alert('Fehler beim Prüfen der Whiteboard-Pflicht. Bitte versuchen Sie es erneut.');
        return;
      }
      setIsChecking(false);
    }

    // No enforcement needed or already read - proceed to category selection
    updateState({ step: 'area' });
  };

  const goBack = () => {
    updateState({ step: 'store' });
  };

  const isComplete = name.trim() && selectedShift;

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">2</div>
          <h2 className="text-xl font-medium">
            {t.employee.detailsEntry.title}
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee-name">
              {t.employee.detailsEntry.employeeName}
            </Label>
            <Input
              id="employee-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.employee.detailsEntry.enterName}
              className="mt-1"
              data-testid="input-employee-name"
            />
          </div>

          <div>
            <Label className="mb-2 block">{t.employee.detailsEntry.selectShift}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedShift === 'frühschicht' ? 'default' : 'outline'}
                onClick={() => selectShift('frühschicht')}
                className="h-24 flex flex-col items-center justify-center"
                data-testid="button-shift-early"
              >
                <Play className="mb-2" size={24} />
                <span className="text-base font-medium">{t.employee.detailsEntry.earlyShift}</span>
                <span className="text-xs opacity-70 mt-1">06:00 - 14:00</span>
              </Button>
              <Button
                variant={selectedShift === 'spätschicht' ? 'default' : 'outline'}
                onClick={() => selectShift('spätschicht')}
                className="h-24 flex flex-col items-center justify-center"
                data-testid="button-shift-late"
              >
                <Square className="mb-2" size={24} />
                <span className="text-base font-medium">{t.employee.detailsEntry.lateShift}</span>
                <span className="text-xs opacity-70 mt-1">14:00 - 22:00</span>
              </Button>
            </div>
          </div>

          <Button
            onClick={proceedToNext}
            disabled={!isComplete || isChecking}
            className="w-full h-12 text-base font-medium"
            data-testid="button-proceed-next"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.employee.detailsEntry.checking}
              </>
            ) : (
              t.employee.detailsEntry.continue
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={goBack}
          className="mt-4"
          data-testid="button-back"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.common.back}
        </Button>
      </CardContent>
    </Card>
  );
}
