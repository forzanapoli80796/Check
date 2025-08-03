import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import RoleSelection from "@/pages/role-selection";
import AdminLogin from "@/pages/admin-login";
import EmployeeWorkflow from "@/pages/employee-workflow";
import AdminDashboard from "@/pages/admin-dashboard";
import BetriebsleiterDashboard from "@/pages/betriebsleiter-dashboard";
import TeigDashboard from "@/pages/teig-dashboard";
import CategoryTasks from "@/pages/category-tasks";


function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelection} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/employee" component={EmployeeWorkflow} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/betriebsleiter" component={BetriebsleiterDashboard} />
      <Route path="/teig" component={TeigDashboard} />
      <Route path="/category-tasks" component={CategoryTasks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
