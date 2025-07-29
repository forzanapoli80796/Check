import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EmployeeWorkflowState } from "@/lib/types";
import StoreSelection from "@/components/employee-steps/store-selection";
import AreaSelection from "@/components/employee-steps/area-selection";
import EmployeeDetails from "@/components/employee-steps/employee-details";
import TaskChecklist from "@/components/employee-steps/task-checklist";
import SuccessScreen from "@/components/employee-steps/success-screen";


export default function EmployeeWorkflow() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<EmployeeWorkflowState>({
    step: 'store',
    selectedStore: null,
    selectedArea: null,
    employeeName: '',
    selectedShift: null,
    completedTasks: [],
    totalTasks: 0,
  });

  const updateState = (updates: Partial<EmployeeWorkflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (state.step) {
      case 'store':
        return <StoreSelection state={state} updateState={updateState} />;
      case 'area':
        return <AreaSelection state={state} updateState={updateState} />;
      case 'details':
        return <EmployeeDetails state={state} updateState={updateState} />;
      case 'tasks':
        return <TaskChecklist state={state} updateState={updateState} />;
      case 'success':
        return <SuccessScreen state={state} updateState={updateState} />;
      default:
        return <StoreSelection state={state} updateState={updateState} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Zurück Button */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>
      </div>
      <div className="flex items-center justify-center px-4 pt-8">
        <div className="max-w-md w-full mx-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
