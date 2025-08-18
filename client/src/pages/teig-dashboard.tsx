import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";
import TeigOverview from "@/components/teig-overview";
import { STORES } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TeigDashboard() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [selectedStore, setSelectedStore] = useState<string>('');

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

          {/* Teig-Übersicht */}
          <TeigOverview selectedStore={selectedStore || undefined} />
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