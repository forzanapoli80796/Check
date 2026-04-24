import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Save, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeigProduction } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import IdealeZubereitung from "@/components/ideale-zubereitung";
import LightspeedUpload from "@/components/lightspeed-upload";

const STORES = ['JP23', 'KP5', 'TS17'] as const;
const WEEKDAYS = [
  { id: 1, name: 'Montag', nameEn: 'Monday' },
  { id: 2, name: 'Dienstag', nameEn: 'Tuesday' },
  { id: 3, name: 'Mittwoch', nameEn: 'Wednesday' },
  { id: 4, name: 'Donnerstag', nameEn: 'Thursday' },
  { id: 5, name: 'Freitag', nameEn: 'Friday' },
  { id: 6, name: 'Samstag', nameEn: 'Saturday' },
  { id: 7, name: 'Sonntag', nameEn: 'Sunday' },
];

type SubTab = 'planung' | 'lightspeed';

export default function TeigManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [values, setValues] = useState<Record<string, number>>({});
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('planung');

  const { data: productions, isLoading } = useQuery<TeigProduction[]>({
    queryKey: ["/api/teig-production"],
  });

  useEffect(() => {
    if (productions) {
      const newValues: Record<string, number> = {};
      productions.forEach(production => {
        newValues[`${production.weekday}-${production.store}`] = production.kugelMenge;
      });
      setValues(newValues);
    }
  }, [productions]);

  const saveMutation = useMutation({
    mutationFn: async ({ weekday, store, kugelMenge }: { weekday: number; store: string; kugelMenge: number }) => {
      const response = await apiRequest("PUT", "/api/teig-production", { weekday, store, kugelMenge });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teig-production"] });
      toast({
        title: language === 'de' ? "Gespeichert" : "Saved",
        description: language === 'de' ? "Die Kugelmenge wurde erfolgreich gespeichert." : "The quantity has been successfully saved.",
      });
    },
    onError: () => {
      toast({
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Speichern fehlgeschlagen." : "Failed to save.",
        variant: "destructive",
      });
    },
  });

  const handleValueChange = (weekday: number, store: string, value: string) => {
    const key = `${weekday}-${store}`;
    const numValue = parseInt(value) || 0;
    setValues(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = (weekday: number, store: string) => {
    const key = `${weekday}-${store}`;
    const value = values[key] || 0;
    saveMutation.mutate({ weekday, store, kugelMenge: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">
          {language === 'de' ? 'Lade Daten...' : 'Loading data...'}
        </div>
      </div>
    );
  }

  const weekdayProductions = productions?.filter(p => p.weekday === selectedWeekday) || [];
  const weekdayTotal = weekdayProductions.reduce((sum, prod) => sum + prod.kugelMenge, 0);

  const subTabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'planung', label: 'Planung', icon: <Calendar size={14} /> },
    { id: 'lightspeed', label: 'Lightspeed', icon: <Upload size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b pb-0">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-black text-black bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lightspeed tab */}
      {activeSubTab === 'lightspeed' && <LightspeedUpload />}

      {/* Planung tab */}
      {activeSubTab === 'planung' && (
        <div className="space-y-6">
          {/* Ideale Zubereitung Preview */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'de' ? 'Ideale Zubereitung - Vorschau' : 'Ideal Preparation - Preview'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {language === 'de'
                  ? 'Wählen Sie einen Wochentag aus, um die optimale Maschinenbeladung zu sehen.'
                  : 'Select a weekday to see the optimal machine loading.'}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedWeekday.toString()} onValueChange={(v) => setSelectedWeekday(parseInt(v))}>
                <TabsList className="grid w-full grid-cols-7">
                  {WEEKDAYS.map(day => (
                    <TabsTrigger key={day.id} value={day.id.toString()}>
                      {language === 'de' ? day.name.slice(0, 2) : day.nameEn.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {WEEKDAYS.map(day => (
                  <TabsContent key={day.id} value={day.id.toString()}>
                    <IdealeZubereitung
                      kugelMenge={day.id === selectedWeekday ? weekdayTotal : 0}
                      stores={STORES as unknown as string[]}
                      showDetails={true}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" size={20} />
                {language === 'de' ? 'Teig-Produktionsplanung' : 'Dough Production Planning'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                {language === 'de'
                  ? 'Kugelmengen für jeden Wochentag und jede Filiale. Die Werte bleiben dauerhaft gespeichert.'
                  : 'Dough ball quantities for each weekday and store. Values are permanently saved.'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50 text-left">
                        {language === 'de' ? 'Wochentag' : 'Weekday'}
                      </th>
                      {STORES.map(store => (
                        <th key={store} className="border p-2 bg-gray-50 text-center">
                          {store}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKDAYS.map(weekday => (
                      <tr key={weekday.id}>
                        <td className="border p-2 font-medium">
                          {language === 'de' ? weekday.name : weekday.nameEn}
                        </td>
                        {STORES.map(store => {
                          const key = `${weekday.id}-${store}`;
                          const value = values[key] || 0;
                          return (
                            <td key={store} className="border p-2">
                              <div className="flex items-center space-x-1">
                                <Input
                                  type="number"
                                  min="0"
                                  value={value}
                                  onChange={(e) => handleValueChange(weekday.id, store, e.target.value)}
                                  className="w-20 text-center"
                                  data-testid={`input-teig-${weekday.id}-${store}`}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSave(weekday.id, store)}
                                  disabled={saveMutation.isPending}
                                  data-testid={`button-save-${weekday.id}-${store}`}
                                >
                                  <Save size={14} />
                                </Button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'de' ? 'Hinweise' : 'Notes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {language === 'de'
                  ? 'Die Kugelmengen werden dauerhaft gespeichert und bleiben erhalten.'
                  : 'The quantities are permanently saved and will be retained.'}</li>
                <li>• {language === 'de'
                  ? 'Es gibt keine automatische Zurücksetzung oder Vorlagen.'
                  : 'There is no automatic reset or templates.'}</li>
                <li>• {language === 'de'
                  ? 'Ändern Sie die Werte nur wenn nötig und speichern Sie jede Änderung einzeln.'
                  : 'Only change values when necessary and save each change individually.'}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
