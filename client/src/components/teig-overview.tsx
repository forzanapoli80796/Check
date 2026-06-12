import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, MapPin, Calendar } from "lucide-react";
import { TeigProduction } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface TeigOverviewProps {
  selectedStore?: string;
}

function getWeekday(date: Date): number {
  // Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday)
  // to our system (1=Monday, 2=Tuesday, ..., 7=Sunday)
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function formatDisplayDate(date: Date, language: string): string {
  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric'
  });
}

export default function TeigOverview({ selectedStore }: TeigOverviewProps) {
  const { t, language } = useLanguage();
  const today = new Date();
  const todayWeekday = getWeekday(today);

  // Fetch all teig production data
  const { data: allProductions = [], isLoading } = useQuery<TeigProduction[]>({
    queryKey: ['/api/teig-production'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">{t.common.loading}</div>
        </CardContent>
      </Card>
    );
  }

  // Filter productions for today
  const todayProductions = allProductions.filter(p => p.weekday === todayWeekday);
  const todayRelevantProductions = selectedStore 
    ? todayProductions.filter((p: TeigProduction) => p.store === selectedStore)
    : todayProductions;

  const todayTotalKugeln = todayRelevantProductions.reduce((sum: number, production: TeigProduction) => 
    sum + production.kugelMenge, 0
  );

  const todayProductionsByStore = todayRelevantProductions.reduce((acc: Record<string, number>, production: TeigProduction) => {
    acc[production.store] = (acc[production.store] || 0) + production.kugelMenge;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Heute */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cookie className="mr-2" size={20} />
            {t.teig.title} {t.teig.today}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-1" size={16} />
            {formatDisplayDate(today, language)}
          </div>
        </CardHeader>
        <CardContent>
          {todayRelevantProductions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cookie size={48} className="mx-auto mb-4 text-gray-300" />
              <p>{t.teig.noProduction}</p>
              {selectedStore && (
                <p className="text-sm mt-2">{t.teig.store}: {selectedStore}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Gesamtübersicht */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-orange-900">{t.teig.totalToday}</h3>
                    <p className="text-sm text-orange-700">
                      {selectedStore ? `${t.teig.store} ${selectedStore}` : t.teig.allStores}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-900">
                      {todayTotalKugeln}
                    </div>
                    <div className="text-sm text-orange-700">{t.teig.balls}</div>
                  </div>
                </div>
              </div>

              {/* Aufschlüsselung nach Store (nur wenn nicht bereits gefiltert) */}
              {!selectedStore && Object.keys(todayProductionsByStore).length > 1 && (
                <div>
                  <h4 className="font-medium mb-3">{t.teig.breakdown}:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(todayProductionsByStore).map(([store, amount]) => (
                      <div key={store} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-2 text-gray-600" />
                          <span className="font-medium">{store}</span>
                        </div>
                        <Badge variant="secondary">
                          {amount} {t.teig.balls}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}