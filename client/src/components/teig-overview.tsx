import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { TeigProduction } from "@shared/schema";

interface TeigOverviewProps {
  selectedStore?: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric'
  });
}

export default function TeigOverview({ selectedStore }: TeigOverviewProps) {
  const today = new Date();
  const todayStr = formatDate(today);

  const { data: todayProductions = [], isLoading } = useQuery({
    queryKey: ['/api/teig-production', todayStr],
    queryFn: async () => {
      const response = await fetch(`/api/teig-production?date=${todayStr}`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Lade Teig-Daten...</div>
        </CardContent>
      </Card>
    );
  }

  // Filter by selected store if provided
  const relevantProductions = Array.isArray(todayProductions) ? (selectedStore 
    ? todayProductions.filter((p: TeigProduction) => p.store === selectedStore)
    : todayProductions) : [];

  const totalKugeln = relevantProductions.reduce((sum: number, production: TeigProduction) => 
    sum + production.kugelMenge, 0
  );

  const productionsByStore = relevantProductions.reduce((acc: Record<string, number>, production: TeigProduction) => {
    acc[production.store] = (acc[production.store] || 0) + production.kugelMenge;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cookie className="mr-2" size={20} />
          Teig-Produktion heute
        </CardTitle>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="mr-1" size={16} />
          {formatDisplayDate(today)}
        </div>
      </CardHeader>
      <CardContent>
        {relevantProductions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Cookie size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Keine Teig-Produktion für heute geplant</p>
            {selectedStore && (
              <p className="text-sm mt-2">Store: {selectedStore}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gesamtübersicht */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900">Gesamt Kugelmenge heute</h3>
                  <p className="text-sm text-orange-700">
                    {selectedStore ? `Store ${selectedStore}` : 'Alle Stores'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-900">
                    {totalKugeln}
                  </div>
                  <div className="text-sm text-orange-700">Kugeln</div>
                </div>
              </div>
            </div>

            {/* Aufschlüsselung nach Store (nur wenn nicht bereits gefiltert) */}
            {!selectedStore && Object.keys(productionsByStore).length > 1 && (
              <div>
                <h4 className="font-medium mb-3">Aufschlüsselung nach Store:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(productionsByStore).map(([store, amount]) => (
                    <div key={store} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <MapPin size={16} className="mr-2 text-gray-600" />
                        <span className="font-medium">{store}</span>
                      </div>
                      <Badge variant="secondary">
                        {amount} Kugeln
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detaillierte Liste */}
            <div>
              <h4 className="font-medium mb-3">Details:</h4>
              <div className="space-y-2">
                {relevantProductions.map((production: TeigProduction) => (
                  <div key={production.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-600" />
                      <span className="font-medium">{production.store}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{production.kugelMenge} Kugeln</div>
                      <div className="text-xs text-gray-500">geplant</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}