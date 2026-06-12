import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AppLogo from "@/components/app-logo";
import { EmployeeWorkflowState } from "@/lib/types";
import StoreSelection from "@/components/employee-steps/store-selection";
import EmployeeInfo from "@/components/employee-steps/employee-info";
import AreaSelection from "@/components/employee-steps/area-selection";
import ShiftSelection from "@/components/employee-steps/shift-selection";
import SubcategorySelection from "@/components/employee-steps/subcategory-selection";
import ShiftPhaseSelection from "@/components/employee-steps/shift-phase-selection";
import TaskChecklist from "@/components/employee-steps/task-checklist";
import InventoryChecklist from "@/components/employee-steps/inventory-checklist";
import SuccessScreen from "@/components/employee-steps/success-screen";
import WhiteboardStep from "@/components/employee-steps/whiteboard-step";
import WhiteboardConfirmation from "@/components/employee-steps/whiteboard-confirmation";


export default function EmployeeWorkflow() {
  const [, navigate] = useLocation();
  
  const [state, setState] = useState<EmployeeWorkflowState>(() => {
    // Load saved employee name from localStorage (but NOT store - always ask fresh)
    const savedName = localStorage.getItem('employeeName');
    
    // Determine initial step: always start at store selection to ensure whiteboard has correct context
    let initialStep: EmployeeWorkflowState['step'] = 'store';
    
    return {
      step: initialStep,
      selectedStore: null, // Always null - user must select store fresh
      selectedArea: null,
      selectedAreaName: null,
      employeeName: savedName || '', // Keep saved name for convenience
      selectedShift: null, // Don't restore shift, always ask fresh
      selectedShiftPhase: null,
      completedTasks: [],
      totalTasks: 0,
      navigationHistory: ['store'], // Initialize with the starting step
    };
  });
  

  const updateState = (updates: Partial<EmployeeWorkflowState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // When step changes, update navigation history
      if (updates.step && updates.step !== prev.step) {
        const currentHistory = prev.navigationHistory || [];
        newState.navigationHistory = [...currentHistory, updates.step];
      }
      
      return newState;
    });
    
    // Save only employee name to localStorage for convenience
    // DON'T save store - must be selected fresh each time for whiteboard context
    if (updates.employeeName !== undefined) {
      localStorage.setItem('employeeName', updates.employeeName || '');
    }
  };

  const goBack = () => {
    const history = state.navigationHistory || [];
    
    if (history.length <= 1) {
      // No history to go back to, return to home
      navigate('/');
      return;
    }
    
    // Remove current step and go to previous step
    const newHistory = history.slice(0, -1);
    const previousStep = newHistory[newHistory.length - 1];
    
    setState(prev => ({
      ...prev,
      step: previousStep,
      navigationHistory: newHistory,
    }));
  };

  const renderStep = () => {
    switch (state.step) {
      case 'store':
        return <StoreSelection state={state} updateState={updateState} goBack={goBack} />;
      case 'employee-info':
        return <EmployeeInfo state={state} updateState={updateState} goBack={goBack} />;
      case 'area':
        return <AreaSelection state={state} updateState={updateState} goBack={goBack} />;
      case 'shift':
        return <ShiftSelection state={state} updateState={updateState} goBack={goBack} />;
      case 'subcategory':
        return <SubcategorySelection state={state} updateState={updateState} goBack={goBack} />;
      case 'whiteboard-confirmation':
        return (
          <WhiteboardConfirmation 
            state={state} 
            updateState={updateState}
            goBack={goBack}
            onConfirmed={() => {
              // Shift is already selected (before area in new workflow)
              const hasSubcats = state.selectedAreaHasSubcategories;
              const needsPhase = state.selectedShift && state.selectedAreaUseShifts !== false;
              updateState({ step: hasSubcats ? 'subcategory' : needsPhase ? 'shift-phase' : 'tasks' });
            }}
          />
        );
      case 'shift-phase':
        return <ShiftPhaseSelection state={state} updateState={updateState} goBack={goBack} />;
      case 'whiteboard':
        return <WhiteboardConfirmation 
          state={state} 
          updateState={updateState}
          goBack={goBack}
          onConfirmed={() => {
            updateState({ step: 'tasks' });
          }}
        />;
      case 'tasks':
        // Check category type to determine which view to show
        if (state.selectedAreaType === 'whiteboard') {
          return <WhiteboardStep state={state} updateState={updateState} goBack={goBack} />;
        }
        if (state.selectedAreaType === 'inventory') {
          return <InventoryChecklist state={state} updateState={updateState} goBack={goBack} />;
        }
        return <TaskChecklist state={state} updateState={updateState} goBack={() => {
          // Always go back to subcategory selection (step 2) if area has subcategories,
          // otherwise fall back to area selection
          if (state.selectedAreaHasSubcategories) {
            setState(prev => ({ ...prev, step: 'subcategory', navigationHistory: [...(prev.navigationHistory || []).filter(s => s !== 'tasks' && s !== 'shift-phase'), 'subcategory'] }));
          } else {
            setState(prev => ({ ...prev, step: 'area', navigationHistory: [...(prev.navigationHistory || []).filter(s => s !== 'tasks' && s !== 'shift-phase'), 'area'] }));
          }
        }} />;
      case 'success':
        return <SuccessScreen state={state} updateState={updateState} goBack={goBack} />;
      default:
        return <StoreSelection state={state} updateState={updateState} goBack={goBack} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-8">
        <Link href="/" data-testid="link-home-logo">
          <AppLogo imgClassName="h-48 object-contain" />
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full mx-auto">
          {renderStep()}
        </div>
      </div>
      
    </div>
  );
}
