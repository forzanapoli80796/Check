import { useState } from "react";

import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Cookie } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import SubmittedLists from "@/components/admin-tabs/submitted-lists";
import CategoriesManagement from "@/components/admin-tabs/categories-management";
import TasksManagementSimple from "@/components/admin-tabs/tasks-management-simple";
import ErrorBoundary from "@/components/error-boundary";
import TeigManagement from "@/components/teig-management";
import { AdminTabState } from "@/lib/types";


export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTabState['activeTab']>('submitted');



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
      case 'tasks':
        return (
          <ErrorBoundary>
            <TasksManagementSimple />
          </ErrorBoundary>
        );
      case 'teig':
        return (
          <ErrorBoundary>
            <TeigManagement />
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
      <div className="flex justify-center py-6">
        <img 
          src={forzaCheckLogo} 
          alt="ForzaCheck Logo" 
          className="h-16 object-contain"
        />
      </div>
      
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">


      {/* Navigation Tabs */}
      <Card className="shadow-sm border border-gray-200 mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('submitted')}
              className={`admin-tab ${activeTab === 'submitted' ? 'active' : ''}`}
            >
              Eingereichte Listen
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
            >
              Arbeitsbereiche verwalten
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`admin-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            >
              Aufgaben verwalten
            </button>
            <button
              onClick={() => setActiveTab('teig')}
              className={`admin-tab ${activeTab === 'teig' ? 'active' : ''}`}
            >
              Teig-Planung
            </button>
          </nav>
        </div>

        <CardContent className="p-6">
          {renderTabContent()}
        </CardContent>
      </Card>
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
