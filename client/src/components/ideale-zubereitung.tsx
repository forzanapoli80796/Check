import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Package, Store } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface IdealeZubereitungProps {
  kugelMenge: number;
  stores: string[];
  showDetails?: boolean;
}

interface MachineLoad {
  size: number;
  count: number;
}

function calculateOptimalLoads(targetAmount: number): { loads: MachineLoad[], total: number, reserve: number } {
  // Verfügbare Rezepte - große Maschinen werden bevorzugt!
  const machineSizes = [120, 110, 60, 55];
  
  let bestCombination: MachineLoad[] = [];
  let bestTotal = targetAmount + 1000;
  let bestReserve = 1000;
  let bestMachineCount = 1000; // Anzahl der Maschinen tracken
  
  // Maximale Anzahl für jede Maschinengröße
  const maxCounts = machineSizes.map(size => Math.ceil(targetAmount / size) + 2);
  
  // Durchlaufe alle Kombinationen, aber priorisiere große Maschinen
  // Beginne mit vielen großen Maschinen und wenigen kleinen
  for (let count120 = Math.min(maxCounts[0], 15); count120 >= 0; count120--) {
    for (let count110 = Math.min(maxCounts[1], 15); count110 >= 0; count110--) {
      // 60er und 55er nur wenn nötig (Notfall)
      for (let count60 = 0; count60 <= Math.min(2, maxCounts[2]); count60++) {
        for (let count55 = 0; count55 <= Math.min(2, maxCounts[3]); count55++) {
          // Überspringe wenn keine Maschinen verwendet werden
          if (count120 === 0 && count110 === 0 && count60 === 0 && count55 === 0) continue;
          
          // Berechne Gesamtproduktion
          const total = count120 * 120 + count110 * 110 + count60 * 60 + count55 * 55;
          
          // Wenn diese Kombination das Ziel erreicht
          if (total >= targetAmount) {
            const reserve = total - targetAmount;
            const machineCount = count120 + count110 + count60 + count55;
            
            // Bewertung: Bevorzuge kleine Reserve, aber auch wenige Maschinen
            // und große Maschinen (120er, 110er) über kleine (60er, 55er)
            const smallMachinePenalty = (count60 + count55) * 5; // Strafe für kleine Maschinen
            
            // Beste Lösung ist: kleinste Reserve + wenigste Maschinen + große Maschinen bevorzugt
            const isNewBest = 
              reserve < bestReserve || 
              (reserve === bestReserve && machineCount < bestMachineCount) ||
              (reserve <= bestReserve + 50 && machineCount < bestMachineCount - 3); // Akzeptiere etwas mehr Reserve für deutlich weniger Maschinen
            
            if (isNewBest) {
              bestCombination = [];
              if (count120 > 0) bestCombination.push({ size: 120, count: count120 });
              if (count110 > 0) bestCombination.push({ size: 110, count: count110 });
              if (count60 > 0) bestCombination.push({ size: 60, count: count60 });
              if (count55 > 0) bestCombination.push({ size: 55, count: count55 });
              bestTotal = total;
              bestReserve = reserve;
              bestMachineCount = machineCount;
            }
          }
        }
      }
    }
  }
  
  // Wenn keine gute Lösung mit großen Maschinen gefunden wurde, erweitere Suche
  if (bestCombination.length === 0 || bestMachineCount > 10) {
    // Erweiterte Suche mit mehr kleinen Maschinen
    for (let count120 = Math.min(maxCounts[0], 10); count120 >= 0; count120--) {
      for (let count110 = Math.min(maxCounts[1], 10); count110 >= 0; count110--) {
        for (let count60 = 0; count60 <= Math.min(5, maxCounts[2]); count60++) {
          for (let count55 = 0; count55 <= Math.min(5, maxCounts[3]); count55++) {
            if (count120 === 0 && count110 === 0 && count60 === 0 && count55 === 0) continue;
            
            const total = count120 * 120 + count110 * 110 + count60 * 60 + count55 * 55;
            
            if (total >= targetAmount) {
              const reserve = total - targetAmount;
              const machineCount = count120 + count110 + count60 + count55;
              
              if (reserve < bestReserve || (reserve === bestReserve && machineCount < bestMachineCount)) {
                bestCombination = [];
                if (count120 > 0) bestCombination.push({ size: 120, count: count120 });
                if (count110 > 0) bestCombination.push({ size: 110, count: count110 });
                if (count60 > 0) bestCombination.push({ size: 60, count: count60 });
                if (count55 > 0) bestCombination.push({ size: 55, count: count55 });
                bestTotal = total;
                bestReserve = reserve;
                bestMachineCount = machineCount;
              }
            }
          }
        }
      }
    }
  }
  
  // Fallback falls keine Lösung gefunden wurde (sollte nicht passieren)
  if (bestCombination.length === 0) {
    const loads: MachineLoad[] = [];
    let remaining = targetAmount;
    
    // Greedy Ansatz als Fallback
    for (const size of machineSizes) {
      if (remaining >= size) {
        const count = Math.floor(remaining / size);
        if (count > 0) {
          loads.push({ size, count });
          remaining -= count * size;
        }
      }
    }
    
    // Füge eine Maschine hinzu für den Rest
    if (remaining > 0) {
      for (const size of machineSizes) {
        if (size >= remaining) {
          const existingLoad = loads.find(l => l.size === size);
          if (existingLoad) {
            existingLoad.count++;
          } else {
            loads.push({ size, count: 1 });
          }
          break;
        }
      }
      
      // Notfall: verwende kleinste Maschine
      if (remaining > 0) {
        const existingLoad = loads.find(l => l.size === 55);
        if (existingLoad) {
          existingLoad.count++;
        } else {
          loads.push({ size: 55, count: 1 });
        }
      }
    }
    
    const total = loads.reduce((sum, load) => sum + (load.size * load.count), 0);
    return { loads, total, reserve: total - targetAmount };
  }
  
  return { loads: bestCombination, total: bestTotal, reserve: bestReserve };
}

export default function IdealeZubereitung({ kugelMenge, stores, showDetails = true }: IdealeZubereitungProps) {
  const { language } = useLanguage();
  
  if (kugelMenge === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            {language === 'de' 
              ? 'Keine Teigproduktion geplant' 
              : 'No dough production planned'}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { loads, total, reserve } = calculateOptimalLoads(kugelMenge);
  const reservePerStore = stores.length > 0 ? Math.floor(reserve / stores.length) : 0;
  const remainingReserve = stores.length > 0 ? reserve % stores.length : reserve;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2" size={20} />
          {language === 'de' ? 'Ideale Zubereitung' : 'Ideal Preparation'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Amount */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {language === 'de' ? 'Benötigte Kugelmenge' : 'Required ball quantity'}:
          </span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {kugelMenge}
          </Badge>
        </div>
        
        {/* Machine Loads */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Package className="mr-1" size={16} />
            {language === 'de' ? 'Maschinenladungen' : 'Machine loads'}:
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {loads.map((load) => (
              <div 
                key={load.size}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="font-semibold text-gray-900">
                  {load.size}er Teig
                </span>
                <Badge variant="outline" className="ml-2">
                  {load.count}x
                </Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Total and Reserve */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {language === 'de' ? 'Gesamt produziert' : 'Total produced'}:
            </span>
            <span className="font-semibold">{total}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {language === 'de' ? 'Reserve' : 'Reserve'}:
            </span>
            <Badge variant="secondary" className="text-sm">
              +{reserve}
            </Badge>
          </div>
        </div>
        
        {/* Reserve Distribution */}
        {showDetails && stores.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Store className="mr-1" size={16} />
              {language === 'de' ? 'Reserveverteilung pro Store' : 'Reserve distribution per store'}:
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              {stores.map((store, index) => (
                <div 
                  key={store}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium">{store}:</span>
                  <span className="text-gray-600">
                    +{reservePerStore + (index < remainingReserve ? 1 : 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Explanation */}
        {showDetails && (
          <div className="text-xs text-gray-500 italic pt-2 border-t">
            {language === 'de' 
              ? 'Die Berechnung erfolgt für die gesamte Teigproduktion aller Stores. Die Reserve wird gleichmäßig auf alle Stores verteilt.'
              : 'The calculation is done for the total dough production of all stores. The reserve is distributed evenly across all stores.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}