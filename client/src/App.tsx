import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import AppPassword from "@/pages/app-password";
import RoleSelection from "@/pages/role-selection";
import AdminLogin from "@/pages/admin-login";
import EmployeeWorkflow from "@/pages/employee-workflow";
import EmployeePassword from "@/pages/employee-password";
import AdminDashboard from "@/pages/admin-dashboard";
import BetriebsleiterDashboard from "@/pages/betriebsleiter-dashboard";
import TeigDashboard from "@/pages/teig-dashboard";
import CategoryTasks from "@/pages/category-tasks";
import LocationSelection from "@/pages/location-selection";
import AdminCategoryTasks from "@/pages/admin-category-tasks";
import AuthWrapper from "@/components/auth-wrapper";


function Router() {
  return (
    <Switch>
      <Route path="/" component={AppPassword} />
      <Route path="/role-selection">
        <AuthWrapper>
          <RoleSelection />
        </AuthWrapper>
      </Route>
      <Route path="/admin-login">
        <AuthWrapper>
          <AdminLogin />
        </AuthWrapper>
      </Route>
      <Route path="/employee-password">
        <AuthWrapper>
          <EmployeePassword />
        </AuthWrapper>
      </Route>
      <Route path="/employee">
        <AuthWrapper>
          <EmployeeWorkflow />
        </AuthWrapper>
      </Route>
      <Route path="/admin">
        <AuthWrapper>
          <AdminDashboard />
        </AuthWrapper>
      </Route>
      <Route path="/betriebsleiter">
        <AuthWrapper>
          <BetriebsleiterDashboard />
        </AuthWrapper>
      </Route>
      <Route path="/teig">
        <AuthWrapper>
          <TeigDashboard />
        </AuthWrapper>
      </Route>
      <Route path="/location-selection">
        <AuthWrapper>
          <LocationSelection />
        </AuthWrapper>
      </Route>
      <Route path="/category-tasks">
        <AuthWrapper>
          <CategoryTasks />
        </AuthWrapper>
      </Route>
      <Route path="/admin-category-tasks/:categoryId/:store">
        <AuthWrapper>
          <AdminCategoryTasks />
        </AuthWrapper>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Cleanup old design settings if they exist
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('designSettings');
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
