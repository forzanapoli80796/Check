import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Calendar, ListTodo, Users, ArrowLeft } from "lucide-react";
import SubmittedLists from "@/components/admin-tabs/submitted-lists";
import CategoriesManagement from "@/components/admin-tabs/categories-management";
import TasksManagement from "@/components/admin-tabs/tasks-management";
import { AdminTabState } from "@/lib/types";


export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTabState['activeTab']>('submitted');

  const { data: stats, isLoading: statsLoading } = useQuery<{
    todayCompleted: number;
    weekCompleted: number; 
    activeTasks: number;
    activeCategories: number;
    completionRate: number;
    pendingTasks: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'submitted':
        return <SubmittedLists />;
      case 'categories':
        return <CategoriesManagement />;
      case 'tasks':
        return <TasksManagement />;
      default:
        return <SubmittedLists />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo zentriert oben */}
      <div className="text-center py-6">
        <img 
          src="/attached_assets/FORZACHECK1_black_1753816621910.png" 
          alt="ForzaCheck Logo" 
          className="max-h-40 max-w-full mx-auto object-contain"
        />
      </div>
      
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Heute abgeschlossen</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-primary">{stats?.todayCompleted || 0}</p>
              )}
            </div>
            <ClipboardCheck className="text-primary" size={24} />
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Diese Woche</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-secondary">{stats?.weekCompleted || 0}</p>
              )}
            </div>
            <Calendar className="text-secondary" size={24} />
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktive Aufgaben</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-accent">{stats?.activeTasks || 0}</p>
              )}
            </div>
            <ListTodo className="text-accent" size={24} />
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kategorien</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-gray-700">{stats?.activeCategories || 0}</p>
              )}
            </div>
            <Users className="text-gray-500" size={24} />
          </div>
        </Card>
      </div>

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
