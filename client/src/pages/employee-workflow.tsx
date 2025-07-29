import { useState } from "react";
import { EmployeeWorkflowState } from "@/lib/types";
import StoreSelection from "@/components/employee-steps/store-selection";
import AreaSelection from "@/components/employee-steps/area-selection";
import EmployeeDetails from "@/components/employee-steps/employee-details";
import TaskChecklist from "@/components/employee-steps/task-checklist";
import SuccessScreen from "@/components/employee-steps/success-screen";

export default function EmployeeWorkflow() {
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

  return <div className="max-w-2xl mx-auto">{renderStep()}</div>;
}
