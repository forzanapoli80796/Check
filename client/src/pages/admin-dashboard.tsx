import { useState } from "react";

import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Cookie } from "lucide-react";
import SubmittedLists from "@/components/admin-tabs/submitted-lists";
import CategoriesManagement from "@/components/admin-tabs/categories-management";
import TasksManagement from "@/components/admin-tabs/tasks-management";
import TeigManagement from "@/components/teig-management";
import { AdminTabState } from "@/lib/types";


export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTabState['activeTab']>('submitted');



  const renderTabContent = () => {
    switch (activeTab) {
      case 'submitted':
        return <SubmittedLists />;
      case 'categories':
        return <CategoriesManagement />;
      case 'tasks':
        return <TasksManagement />;
      case 'teig':
        return <TeigManagement />;
      default:
        return <SubmittedLists />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Zurück Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>


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
              Kategorien verwalten
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
  );
}
