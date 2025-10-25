import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import { EmployeeWorkflowState } from "@/lib/types";
import StoreSelection from "@/components/employee-steps/store-selection";
import AreaSelection from "@/components/employee-steps/area-selection";
import SubcategorySelection from "@/components/employee-steps/subcategory-selection";
import EmployeeDetails from "@/components/employee-steps/employee-details";
import ShiftPhaseSelection from "@/components/employee-steps/shift-phase-selection";
import TaskChecklist from "@/components/employee-steps/task-checklist";
import InventoryChecklist from "@/components/employee-steps/inventory-checklist";
import SuccessScreen from "@/components/employee-steps/success-screen";
import { TicketsView } from "@/components/employee-steps/tickets-view";
import SendMessage from "@/components/employee-steps/send-message";
import WhiteboardStep from "@/components/employee-steps/whiteboard-step";
import WhiteboardConfirmation from "@/components/employee-steps/whiteboard-confirmation";
import type { Category } from "@shared/schema";


export default function EmployeeWorkflow() {
  const [, navigate] = useLocation();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  
  // Load categories to find Betriebsleiter category and Kugelfahrer-Hausmeister
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });
  
  const [state, setState] = useState<EmployeeWorkflowState>({
    step: 'store',
    selectedStore: null,
    selectedArea: null,
    selectedAreaName: null,
    employeeName: '',
    selectedShift: null,
    selectedShiftPhase: null,
    completedTasks: [],
    totalTasks: 0,
  });
  
  // Automatically set area for Betriebsleiter
  useEffect(() => {
    if (roleParam === 'betriebsleiter' && categories.length > 0) {
      const betriebsleiterCategory = categories.find(c => 
        c.name.toLowerCase().includes('betriebsleiter')
      );
      
      if (betriebsleiterCategory) {
        // Store the category ID for the area selection
        setState(prev => ({
          ...prev,
          isBetriebsleiter: true,
          betriebsleiterCategoryId: betriebsleiterCategory.id
        }));
      }
    }
  }, [roleParam, categories]);

  const updateState = (updates: Partial<EmployeeWorkflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (state.step) {
      case 'store':
        return <StoreSelection state={state} updateState={updateState} />;
      case 'area':
        return <AreaSelection state={state} updateState={updateState} />;
      case 'subcategory':
        return <SubcategorySelection state={state} updateState={updateState} />;
      case 'whiteboard-confirmation':
        return (
          <WhiteboardConfirmation 
            state={state} 
            updateState={updateState}
            onConfirmed={() => {
              // After confirmation, proceed to next step
              const useShifts = state.selectedAreaUseShifts !== false;
              updateState({ 
                step: useShifts ? 'shift-phase' : 'tasks'
              });
            }}
          />
        );
      case 'details':
        return <EmployeeDetails state={state} updateState={updateState} />;
      case 'shift-phase':
        return <ShiftPhaseSelection state={state} updateState={updateState} />;
      case 'whiteboard':
        return <WhiteboardConfirmation 
          state={state} 
          updateState={updateState}
          onConfirmed={() => {
            updateState({ step: 'tasks' });
          }}
        />;
      case 'tasks':
        // Check category type to determine which view to show
        if (state.selectedAreaType === 'whiteboard') {
          return <WhiteboardStep state={state} updateState={updateState} />;
        }
        if (state.selectedAreaType === 'inventory') {
          return <InventoryChecklist state={state} updateState={updateState} />;
        }
        if (state.selectedAreaType === 'tickets') {
          return <TicketsView state={state} updateState={updateState} />;
        }
        return <TaskChecklist state={state} updateState={updateState} />;
      case 'success':
        return <SuccessScreen state={state} updateState={updateState} />;
      case 'sendMessage':
        return <SendMessage state={state} updateState={updateState} />;
      default:
        return <StoreSelection state={state} updateState={updateState} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-8">
        <Link href="/" data-testid="link-home-logo">
          <img 
            src={forzaCheckLogo} 
            alt="ForzaCheck Logo" 
            className="h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
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
