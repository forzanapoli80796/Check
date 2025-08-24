import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Save, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeigProductionTemplate } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

const STORES = ['JP23', 'KP5', 'TS17'] as const;
const WEEKDAYS = [
  { id: 1, name: 'Montag', nameEn: 'Monday' },
  { id: 2, name: 'Dienstag', nameEn: 'Tuesday' },
  { id: 3, name: 'Mittwoch', nameEn: 'Wednesday' },
  { id: 4, name: 'Donnerstag', nameEn: 'Thursday' },
  { id: 5, name: 'Freitag', nameEn: 'Friday' },
  { id: 6, name: 'Samstag', nameEn: 'Saturday' },
  { id: 0, name: 'Sonntag', nameEn: 'Sunday' },
];

export default function TeigManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [templateValues, setTemplateValues] = useState<Record<string, number>>({});

  // Fetch templates
  const { data: templates, isLoading } = useQuery<TeigProductionTemplate[]>({
    queryKey: ["/api/teig-production-templates"],
  });

  // Initialize template values when data is loaded
  useEffect(() => {
    if (templates) {
      const values: Record<string, number> = {};
      templates.forEach(template => {
        values[`${template.weekday}-${template.store}`] = template.kugelMenge;
      });
      setTemplateValues(values);
    }
  }, [templates]);

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ weekday, store, kugelMenge }: { weekday: number; store: string; kugelMenge: number }) => {
      const response = await apiRequest("PUT", "/api/teig-production-templates", {
        weekday,
        store,
        kugelMenge
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teig-production-templates"] });
      toast({
        title: language === 'de' ? "Template gespeichert" : "Template saved",
        description: language === 'de' ? "Die Vorlage wurde erfolgreich aktualisiert." : "The template has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Template konnte nicht gespeichert werden." : "Failed to save template.",
        variant: "destructive",
      });
    },
  });

  // Apply templates mutation
  const applyTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/teig-production-templates/apply", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'de' ? "Templates angewendet" : "Templates applied",
        description: language === 'de' ? "Die Vorlagen wurden für die aktuelle Woche angewendet." : "Templates have been applied for the current week.",
      });
    },
    onError: () => {
      toast({
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Templates konnten nicht angewendet werden." : "Failed to apply templates.",
        variant: "destructive",
      });
    },
  });

  const handleValueChange = (weekday: number, store: string, value: string) => {
    const key = `${weekday}-${store}`;
    const numValue = parseInt(value) || 0;
    setTemplateValues(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = (weekday: number, store: string) => {
    const key = `${weekday}-${store}`;
    const value = templateValues[key] || 0;
    updateTemplateMutation.mutate({ weekday, store, kugelMenge: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">
          {language === 'de' ? 'Lade Templates...' : 'Loading templates...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              {language === 'de' ? 'Teig-Produktions-Vorlagen' : 'Dough Production Templates'}
            </CardTitle>
            <Button 
              onClick={() => applyTemplatesMutation.mutate()}
              disabled={applyTemplatesMutation.isPending}
              className="flex items-center"
            >
              <RefreshCw className="mr-2" size={16} />
              {language === 'de' ? 'Templates für Woche anwenden' : 'Apply Templates for Week'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'de' 
              ? 'Definieren Sie die Standard-Kugelmengen für jeden Wochentag. Diese Vorlagen werden automatisch jede Woche angewendet.'
              : 'Define the standard dough ball quantities for each weekday. These templates will be automatically applied each week.'}
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
                      const value = templateValues[key] || 0;
                      return (
                        <td key={store} className="border p-2">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              min="0"
                              value={value}
                              onChange={(e) => handleValueChange(weekday.id, store, e.target.value)}
                              className="w-20 text-center"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSave(weekday.id, store)}
                              disabled={updateTemplateMutation.isPending}
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
            {language === 'de' ? 'Hinweise zur Teigplanung' : 'Notes on Dough Planning'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {language === 'de' 
              ? 'Die Teigplanung löscht sich jede Woche automatisch und wird durch die Vorlagen ersetzt.' 
              : 'The dough planning resets automatically each week and is replaced by the templates.'}</li>
            <li>• {language === 'de' 
              ? 'Das System verwendet ein festes, wiederkehrendes Gerüst für Montag bis Sonntag.' 
              : 'The system uses a fixed, recurring structure for Monday to Sunday.'}</li>
            <li>• {language === 'de' 
              ? 'Vorlagen gelten verbindlich für die gesamte Woche.' 
              : 'Templates are binding for the entire week.'}</li>
            <li>• {language === 'de' 
              ? 'Einträge sollten regelmäßig überprüft und bei Bedarf angepasst werden.' 
              : 'Entries should be regularly reviewed and adjusted as needed.'}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}