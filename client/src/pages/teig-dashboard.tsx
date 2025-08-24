import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import TeigOverview from "@/components/teig-overview";
import IdealeZubereitung from "@/components/ideale-zubereitung";
import { STORES } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { TeigProduction } from "@shared/schema";

function getWeekday(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export default function TeigDashboard() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [selectedStore, setSelectedStore] = useState<string>('');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowWeekday = getWeekday(tomorrow);
  
  // Fetch teig production data
  const { data: allProductions = [] } = useQuery<TeigProduction[]>({
    queryKey: ['/api/teig-production'],
  });
  
  // Calculate tomorrow's total for Ideale Zubereitung
  const tomorrowProductions = allProductions.filter(p => p.weekday === tomorrowWeekday);
  const tomorrowRelevantProductions = selectedStore 
    ? tomorrowProductions.filter((p: TeigProduction) => p.store === selectedStore)
    : tomorrowProductions;
  
  const tomorrowTotalKugeln = tomorrowRelevantProductions.reduce((sum: number, production: TeigProduction) => 
    sum + production.kugelMenge, 0
  );
  
  const relevantStores = selectedStore ? [selectedStore] : [...STORES];

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
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Store-Auswahl */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="font-medium">{t.employee.storeSelection.selectStore}:</span>
              {STORES.map((store) => (
                <Button
                  key={store}
                  variant={selectedStore === store ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStore(store)}
                >
                  {store}
                </Button>
              ))}
              <Button
                variant={selectedStore === '' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStore('')}
              >
                {t.teig.allStores}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Ideale Zubereitung für morgen */}
            <IdealeZubereitung 
              kugelMenge={tomorrowTotalKugeln}
              stores={relevantStores}
              showDetails={true}
            />
            
            {/* Teig-Übersicht */}
            <TeigOverview selectedStore={selectedStore || undefined} />
          </div>
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
          {t.common.backToStart}
        </Button>
      </div>
    </div>
  );
}