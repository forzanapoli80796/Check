import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

interface CategoryTasksProps {
  categoryId?: string;
  categoryName?: string;
}

export default function CategoryTasks() {
  const [, navigate] = useLocation();
  
  // Extract category info from URL params or state
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');
  const categoryName = urlParams.get('categoryName') || 'Kategorie';

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
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Aufgaben für {categoryName}
            </h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie die Aufgaben für diese Kategorie nach Schichten
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Frühschicht Column */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg font-semibold text-blue-800">
                  Frühschicht
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Left Sub-Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700 border-b pb-2">
                      Spalte A
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Aufgaben für Spalte A
                      </p>
                      {/* Placeholder for tasks */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                        Keine Aufgaben
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Sub-Column */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700 border-b pb-2">
                      Spalte B
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Aufgaben für Spalte B
                      </p>
                      {/* Placeholder for tasks */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                        Keine Aufgaben
                      </div>
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>

            {/* Spätschicht Column */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="bg-orange-50 border-b">
                <CardTitle className="text-lg font-semibold text-orange-800">
                  Spätschicht
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Left Sub-Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700 border-b pb-2">
                      Spalte A
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Aufgaben für Spalte A
                      </p>
                      {/* Placeholder for tasks */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                        Keine Aufgaben
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Sub-Column */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700 border-b pb-2">
                      Spalte B
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Aufgaben für Spalte B
                      </p>
                      {/* Placeholder for tasks */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                        Keine Aufgaben
                      </div>
                    </div>
                  </div>
                </div>
                
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      
      {/* Footer mit Zurück Button */}
      <div className="py-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin")}
          className="px-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Admin-Übersicht
        </Button>
      </div>
    </div>
  );
}