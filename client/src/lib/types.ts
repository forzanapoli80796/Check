export interface UserSession {
  role: 'mitarbeiter' | 'admin' | null;
}

export interface EmployeeWorkflowState {
  step: 'store' | 'employee-info' | 'area' | 'shift' | 'subcategory' | 'whiteboard-confirmation' | 'shift-phase' | 'tasks' | 'success' | 'sendMessage' | 'whiteboard';
  selectedStore: string | null;
  selectedArea: string | null;
  selectedAreaName?: string | null;
  selectedAreaUseShifts?: boolean; // Whether the selected category uses shifts
  selectedAreaType?: 'shifts' | 'simple' | 'inventory' | 'whiteboard'; // The category type (Option 1: shifts, Option 2: simple, Option 3: inventory, Option 4: whiteboard)
  selectedAreaHasSubcategories?: boolean; // Whether the selected area has subcategories
  employeeName: string;
  selectedShift: 'frühschicht' | 'spätschicht' | null;
  selectedShiftPhase: 'schichtanfang' | 'schichtende' | null;
  completedTasks: string[];
  totalTasks: number;

  navigationHistory?: EmployeeWorkflowState['step'][]; // History of steps for consistent back navigation
}

export interface AdminTabState {
  activeTab: 'submitted' | 'categories' | 'teig' | 'employeeNotes' | 'devTools' | 'settings';
}

export const STORES = ['JP23', 'KP5', 'TS17'] as const;
export const AREAS = ['terminal', 'kueche', 'fahrer', 'inventur', 'sonderreinigung'] as const;
export const SHIFTS = ['schichtanfang', 'schichtende'] as const;

export const AREA_LABELS = {
  terminal: 'Terminal',
  kueche: 'Küche',
  fahrer: 'Fahrer',
  inventur: 'Inventur',
  sonderreinigung: 'Sonderreinigung',
} as const;

export const AREA_ICONS = {
  terminal: 'desktop',
  kueche: 'utensils',
  fahrer: 'car',
  inventur: 'clipboard-list',
  sonderreinigung: 'broom',
} as const;
