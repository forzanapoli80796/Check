export interface UserSession {
  role: 'mitarbeiter' | 'betriebsleiter' | 'admin' | null;
}

export interface EmployeeWorkflowState {
  step: 'store' | 'area' | 'details' | 'shift-phase' | 'tasks' | 'success';
  selectedStore: string | null;
  selectedArea: string | null;
  selectedAreaName?: string | null;
  selectedAreaUseShifts?: boolean; // Whether the selected category uses shifts
  employeeName: string;
  selectedShift: 'frühschicht' | 'spätschicht' | null;
  selectedShiftPhase: 'schichtanfang' | 'schichtende' | null;
  completedTasks: string[];
  totalTasks: number;
}

export interface AdminTabState {
  activeTab: 'submitted' | 'categories' | 'teig';
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
