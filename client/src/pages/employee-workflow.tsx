import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import { EmployeeWorkflowState } from "@/lib/types";
import StoreSelection from "@/components/employee-steps/store-selection";
import AreaSelection from "@/components/employee-steps/area-selection";
import EmployeeDetails from "@/components/employee-steps/employee-details";
import TaskChecklist from "@/components/employee-steps/task-checklist";
import InventoryChecklist from "@/components/employee-steps/inventory-checklist";
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
        // Check if this is inventory area
        if (state.selectedArea === 'inventur') {
          return <InventoryChecklist state={state} updateState={updateState} />;
        }
        return <TaskChecklist state={state} updateState={updateState} />;
      case 'success':
        return <SuccessScreen state={state} updateState={updateState} />;
      default:
        return <StoreSelection state={state} updateState={updateState} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-6">
        <img 
          src={forzaCheckLogo} 
          alt="ForzaCheck Logo" 
          className="h-16 object-contain"
        />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full mx-auto">
          {renderStep()}
        </div>
      </div>
      
      {/* Footer mit Zurück Button */}
      <div className="py-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
          className="px-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>
      </div>
    </div>
  );
}
