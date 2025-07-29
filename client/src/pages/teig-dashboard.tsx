import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TeigOverview from "@/components/teig-overview";
import { STORES } from "@/lib/types";

export default function TeigDashboard() {
  const [, navigate] = useLocation();
  const [selectedStore, setSelectedStore] = useState<string>('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Zurück Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>

        {/* Store-Auswahl */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Store auswählen:</span>
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
              Alle Stores
            </Button>
          </div>
        </div>

        {/* Teig-Übersicht */}
        <TeigOverview selectedStore={selectedStore || undefined} />
      </div>
    </div>
  );
}