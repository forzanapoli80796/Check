import { useState } from "react";

import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ArrowLeft, Cookie, Menu } from "lucide-react";
import AppLogo from "@/components/app-logo";
import SubmittedLists from "@/components/admin-tabs/submitted-lists";
import CategoriesManagement from "@/components/admin-tabs/categories-management";
import { SettingsManagement } from "@/components/admin-tabs/settings-management";
import ErrorBoundary from "@/components/error-boundary";
import TeigManagement from "@/components/teig-management";
import MissingChecklists from "@/components/admin-tabs/missing-checklists";
import WhiteboardManagement from "@/components/admin-tabs/whiteboard-management";
import Pruefplan from "@/components/admin-tabs/pruefplan";
import EmailNotifications from "@/components/admin-tabs/email-notifications";
import QuizManagement from "@/components/admin-tabs/quiz-management";
import { AdminTabState } from "@/lib/types";


export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTabState['activeTab']>('submitted');

  const tabs = [
    { value: 'submitted', label: 'Eingereichte Listen' },
    { value: 'categories', label: 'Arbeitsbereiche' },
    { value: 'teig', label: 'Teig-Planung' },
    { value: 'whiteboard', label: 'Digitales Whiteboard' },
    { value: 'quiz', label: 'Terminal Quiz' },
    { value: 'pruefplan', label: 'Prüfplan Sonderlisten' },
    { value: 'email-notifications', label: 'E-Mail-Benachrichtigungen' },
    { value: 'settings', label: 'Einstellungen' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'submitted':
        return (
          <ErrorBoundary>
            <SubmittedLists />
          </ErrorBoundary>
        );
      case 'categories':
        return (
          <ErrorBoundary>
            <CategoriesManagement />
          </ErrorBoundary>
        );
      case 'teig':
        return (
          <ErrorBoundary>
            <TeigManagement />
          </ErrorBoundary>
        );
      case 'whiteboard':
        return (
          <ErrorBoundary>
            <WhiteboardManagement />
          </ErrorBoundary>
        );
      case 'pruefplan':
        return (
          <ErrorBoundary>
            <Pruefplan />
          </ErrorBoundary>
        );
      case 'email-notifications':
        return (
          <ErrorBoundary>
            <EmailNotifications />
          </ErrorBoundary>
        );
      case 'quiz':
        return (
          <ErrorBoundary>
            <QuizManagement />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <SettingsManagement />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <SubmittedLists />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-4 sm:py-6 px-4">
        <AppLogo asLink imgClassName="h-12 sm:h-16 object-contain" />
      </div>
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
          {/* Missing Checklists Overview - always visible at top */}
          <ErrorBoundary>
            <MissingChecklists />
          </ErrorBoundary>

          {/* Mobile Navigation Dropdown */}
          <div className="block sm:hidden mb-4">
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTabState['activeTab'])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Bereich wählen" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Navigation Tabs */}
          <Card className="shadow-sm border border-gray-200">
            <div className="border-b hidden sm:block">
              <nav className="flex flex-wrap gap-1 px-2 sm:px-4 py-2 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value as AdminTabState['activeTab'])}
                    className={`admin-tab text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap ${
                      activeTab === tab.value ? 'active' : ''
                    }`}

                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <CardContent className="p-3 sm:p-6">
              {renderTabContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
