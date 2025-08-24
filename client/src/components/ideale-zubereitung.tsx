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
  // Verfügbare Rezepte (nur diese dürfen verwendet werden!)
  const machineSizes = [120, 110, 60, 55];
  
  let bestCombination: MachineLoad[] = [];
  let bestTotal = Infinity;
  let bestReserve = Infinity;
  
  // Rekursive Funktion um die beste Kombination zu finden
  function findBestCombination(remaining: number, currentLoads: MachineLoad[], startIndex: number = 0): void {
    // Wenn wir genug Kugeln haben
    if (remaining <= 0) {
      const total = currentLoads.reduce((sum, load) => sum + (load.size * load.count), 0);
      const reserve = total - targetAmount;
      
      // Nur akzeptieren wenn Reserve >= 0 und kleiner als bisherige beste
      if (reserve >= 0 && reserve < bestReserve) {
        bestCombination = currentLoads.map(load => ({...load}));
        bestTotal = total;
        bestReserve = reserve;
      }
      return;
    }
    
    // Versuche jede Maschinengröße ab startIndex
    for (let i = startIndex; i < machineSizes.length; i++) {
      const size = machineSizes[i];
      
      // Berechne wie viele Ladungen dieser Größe wir maximal brauchen könnten
      const maxCount = Math.ceil(remaining / size);
      
      // Versuche verschiedene Anzahlen (1 bis maxCount, aber limitiert auf 10)
      for (let count = 1; count <= Math.min(maxCount, 10); count++) {
        const newLoads = [...currentLoads];
        const existingLoad = newLoads.find(l => l.size === size);
        
        if (existingLoad) {
          existingLoad.count += count;
        } else {
          newLoads.push({ size, count });
        }
        
        findBestCombination(remaining - (size * count), newLoads, i);
      }
    }
  }
  
  // Starte die Suche
  findBestCombination(targetAmount, []);
  
  // Fallback: Wenn keine optimale Lösung gefunden wurde, verwende einen einfachen Greedy-Ansatz
  if (bestCombination.length === 0 || bestReserve > targetAmount * 0.5) {
    const loads: MachineLoad[] = [];
    let remaining = targetAmount;
    
    // Verwende größte Maschinen zuerst
    for (const size of machineSizes) {
      if (remaining >= size) {
        const count = Math.floor(remaining / size);
        if (count > 0) {
          loads.push({ size, count });
          remaining -= count * size;
        }
      }
    }
    
    // Füge eine weitere Ladung hinzu um den Rest abzudecken
    if (remaining > 0) {
      // Finde die kleinste Maschine die den Rest abdeckt
      for (const size of machineSizes) {
        if (size >= remaining) {
          const existingLoad = loads.find(l => l.size === size);
          if (existingLoad) {
            existingLoad.count++;
          } else {
            loads.push({ size, count: 1 });
          }
          remaining = 0;
          break;
        }
      }
      
      // Wenn immer noch Rest, verwende die kleinste Maschine
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
    bestCombination = loads;
    bestTotal = total;
    bestReserve = total - targetAmount;
  }
  
  // Sortiere nach Größe (absteigend)
  bestCombination.sort((a, b) => b.size - a.size);
  
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
        {showDetails && stores.length > 0 && reserve > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Store className="mr-1" size={16} />
              {language === 'de' ? 'Reserveverteilung' : 'Reserve distribution'}:
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
              ? 'Die Reserve wird automatisch gleichmäßig auf alle Stores verteilt und ist so klein wie möglich gehalten.'
              : 'The reserve is automatically distributed evenly across all stores and kept as small as possible.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}