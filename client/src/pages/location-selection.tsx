import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import AppLogo from "@/components/app-logo";

const locations = [
  { id: "kp5", name: "KP5", description: "Standort KP5" },
  { id: "ts17", name: "TS17", description: "Standort TS17" },
  { id: "jp23", name: "JP23", description: "Standort JP23" },
];

export default function LocationSelection() {
  const [, navigate] = useLocation();
  
  // Extract category info from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');
  const categoryName = urlParams.get('categoryName') || 'Arbeitsbereich';

  const handleLocationSelect = (locationId: string, locationName: string) => {
    // Check if admin is accessing this page
    const isAdmin = window.location.search.includes('admin=true');
    
    if (isAdmin && categoryId) {
      // Admin gets redirected to task management page
      navigate(`/admin-category-tasks/${categoryId}/${locationId}`);
    } else if (!isAdmin && categoryId) {
      // Normal employee flow
      const params = new URLSearchParams({
        categoryId: categoryId || '',
        categoryName,
        locationId,
        locationName,
      });
      navigate(`/category-tasks?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-6">
        <AppLogo asLink imgClassName="h-16 object-contain" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Standort auswählen
            </h1>
            <p className="text-gray-600">
              Wähle einen Standort für den Arbeitsbereich "{categoryName}"
            </p>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {locations.map((location) => (
              <Card 
                key={location.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                onClick={() => handleLocationSelect(location.id, location.name)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin size={32} className="text-blue-600" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {location.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">
                    {location.description}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocationSelect(location.id, location.name);
                    }}
                  >
                    Auswählen
                  </Button>
                </CardContent>
              </Card>
            ))}
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