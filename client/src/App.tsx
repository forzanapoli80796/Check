import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import RoleSelection from "@/pages/role-selection";
import AdminLogin from "@/pages/admin-login";
import EmployeeWorkflow from "@/pages/employee-workflow";
import AdminDashboard from "@/pages/admin-dashboard";
import BetriebsleiterDashboard from "@/pages/betriebsleiter-dashboard";
import TeigDashboard from "@/pages/teig-dashboard";
import CategoryTasks from "@/pages/category-tasks";
import LocationSelection from "@/pages/location-selection";
import AdminCategoryTasks from "@/pages/admin-category-tasks";


function Router() {
  return (
    <Switch>
      <Route path="/" component={RoleSelection} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/employee" component={EmployeeWorkflow} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/betriebsleiter" component={BetriebsleiterDashboard} />
      <Route path="/teig" component={TeigDashboard} />
      <Route path="/location-selection" component={LocationSelection} />
      <Route path="/category-tasks" component={CategoryTasks} />
      <Route path="/admin-category-tasks/:categoryId/:store" component={AdminCategoryTasks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Napoli Theme automatisch laden
    const initNapoliTheme = () => {
      const saved = localStorage.getItem('designSettings');
      if (!saved) {
        // Napoli Theme Settings setzen
        const napoliSettings = {
          theme: 'napoli',
          colors: {
            primary: '#00c4e6',
            secondary: '#0095b6',
            accent: '#ff0000',
            background: '#ffffff',
            foreground: '#1a1a1a',
            card: '#ffffff',
            cardForeground: '#1a1a1a',
            muted: '#f0f9ff',
            mutedForeground: '#0095b6',
            destructive: '#dc2626',
            border: '#00c4e6',
            gradientStart: '#00c4e6',
            gradientEnd: '#0095b6',
          },
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            headingFont: 'Inter',
            lineHeight: 1.5,
            letterSpacing: 0,
          },
          effects: {
            animations: true,
            animationSpeed: 1,
            shadows: true,
            shadowIntensity: 1,
            blur: false,
            blurAmount: 10,
            gradients: true,
            borderRadius: 8,
            glassmorphism: false,
            neonGlow: false,
          },
          layout: {
            spacing: 1,
            compactMode: false,
            maxWidth: '1280px',
            sidebar: false,
          },
          customCSS: '',
        };

        // Farben anwenden
        const root = document.documentElement;
        Object.entries(napoliSettings.colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });

        // Napoli Theme Klasse hinzufügen
        document.body.classList.add('napoli-theme');
        document.body.classList.add('animations-enabled');
        document.body.classList.add('shadows-enabled');
        document.body.classList.add('gradients-enabled');

        // Speichern für nächsten Besuch
        localStorage.setItem('designSettings', JSON.stringify(napoliSettings));
      } else {
        // Gespeicherte Settings laden
        const settings = JSON.parse(saved);
        if (settings.theme === 'napoli' || settings.colors?.primary === '#00c4e6') {
          document.body.classList.add('napoli-theme');
        }
      }
    };

    initNapoliTheme();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <div className="min-h-screen napoli-pattern">
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
