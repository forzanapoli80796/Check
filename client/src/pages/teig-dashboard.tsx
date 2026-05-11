import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AppLogo from "@/components/app-logo";
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
  
  const today = new Date();
  const todayWeekday = getWeekday(today);
  
  // Fetch teig production data
  const { data: allProductions = [] } = useQuery<TeigProduction[]>({
    queryKey: ['/api/teig-production'],
  });
  
  // Calculate today's total for Ideale Zubereitung - always for all stores
  const todayProductions = allProductions.filter(p => p.weekday === todayWeekday);
  
  const todayTotalKugeln = todayProductions.reduce((sum: number, production: TeigProduction) => 
    sum + production.kugelMenge, 0
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header */}
      <div className="flex justify-center py-6">
        <AppLogo asLink imgClassName="h-16 object-contain" />
      </div>
      
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">

          <div className="space-y-6">
            {/* Ideale Zubereitung für heute */}
            <IdealeZubereitung 
              kugelMenge={todayTotalKugeln}
              stores={[...STORES]}
              showDetails={true}
            />
            
            {/* Teig-Übersicht */}
            <TeigOverview selectedStore={undefined} />
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