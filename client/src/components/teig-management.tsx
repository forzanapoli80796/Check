import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Save, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeigProduction, InsertTeigProduction } from "@shared/schema";

// Helper function to get week dates
function getWeekDates(weekOffset: number = 0) {
  const today = new Date();
  const currentWeek = new Date(today);
  currentWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Start from Monday
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeek);
    date.setDate(currentWeek.getDate() + i);
    weekDates.push(date);
  }
  return weekDates;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  });
}

export default function TeigManagement() {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.
  const { toast } = useToast();
  
  const weekDates = getWeekDates(selectedWeek);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const { data: productions = [], isLoading } = useQuery({
    queryKey: ['/api/teig-production', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/teig-production?startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTeigProduction) => {
      const response = await fetch('/api/teig-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teig-production'] });
      toast({ title: "Kugelmenge gespeichert" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<InsertTeigProduction> }) => {
      const response = await fetch(`/api/teig-production/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teig-production'] });
      toast({ title: "Kugelmenge aktualisiert" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teig-production/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teig-production'] });
      toast({ title: "Eintrag gelöscht" });
    },
  });

  const stores = ['JP23', 'KP5', 'TS17'];

  const getProductionForDate = (date: string, store: string): TeigProduction | undefined => {
    return Array.isArray(productions) ? productions.find((p: TeigProduction) => p.date === date && p.store === store) : undefined;
  };

  const handleSaveProduction = (date: string, store: string, kugelMenge: number) => {
    const existingProduction = getProductionForDate(date, store);
    
    if (existingProduction) {
      updateMutation.mutate({
        id: existingProduction.id,
        data: { kugelMenge }
      });
    } else {
      createMutation.mutate({
        date,
        store,
        kugelMenge
      });
    }
  };

  const handleDeleteProduction = (date: string, store: string) => {
    const existingProduction = getProductionForDate(date, store);
    if (existingProduction) {
      deleteMutation.mutate(existingProduction.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Lade Teig-Daten...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" size={20} />
            Teig-Kugelmenge Planung
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedWeek(selectedWeek - 1)}
            >
              ← Vorherige Woche
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedWeek(0)}
              disabled={selectedWeek === 0}
            >
              Aktuelle Woche
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedWeek(selectedWeek + 1)}
            >
              Nächste Woche →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-left">Store</th>
                {weekDates.map((date, index) => (
                  <th key={index} className="border p-2 bg-gray-50 text-center min-w-32">
                    {formatDisplayDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store}>
                  <td className="border p-2 font-medium bg-gray-50">{store}</td>
                  {weekDates.map((date, dateIndex) => {
                    const dateStr = formatDate(date);
                    const production = getProductionForDate(dateStr, store);
                    const [inputValue, setInputValue] = useState(production?.kugelMenge?.toString() || '');
                    
                    return (
                      <td key={dateIndex} className="border p-2">
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={production?.kugelMenge?.toString() || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value > 0) {
                                handleSaveProduction(dateStr, store, value);
                              }
                            }}
                            className="w-20 text-center"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const value = parseInt(inputValue) || 0;
                              if (value > 0) {
                                handleSaveProduction(dateStr, store, value);
                              }
                            }}
                            disabled={!inputValue || parseInt(inputValue) <= 0}
                          >
                            <Save size={14} />
                          </Button>
                          {production && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleDeleteProduction(dateStr, store);
                                setInputValue('');
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Geben Sie die zu produzierende Kugelmenge pro Tag und Store ein. Klicken Sie auf das Speichern-Symbol, um Ihre Eingaben zu bestätigen.</p>
        </div>
      </CardContent>
    </Card>
  );
}