import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, Category, InsertChecklist } from "@shared/schema";
import { STORES } from "@/lib/types";

export default function BetriebsleiterDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [shiftType, setShiftType] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  // Nur Betriebsleiter-Kategorie laden
  const betriebsleiterCategory = categories.find(c => c.name.toLowerCase().includes('betriebsleiter'));

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!betriebsleiterCategory
  });

  // Nur Aufgaben für Betriebsleiter-Kategorie
  const betriebsleiterTasks = tasks.filter(t => t.categoryId === betriebsleiterCategory?.id);

  const submitMutation = useMutation({
    mutationFn: async (checklist: InsertChecklist) => {
      const response = await apiRequest('POST', '/api/checklists', checklist);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich eingereicht",
        description: "Ihre Betriebsleiter-Aufgaben wurden erfolgreich abgeschlossen.",
      });
      // Formular zurücksetzen
      setSelectedStore('');
      setEmployeeName('');
      setShiftType('');
      setCompletedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['/api/checklists'] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Beim Einreichen ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  });

  const handleTaskToggle = (taskId: string) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = () => {
    if (!selectedStore || !employeeName || !shiftType) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    if (!betriebsleiterCategory) {
      toast({
        title: "Fehler",
        description: "Betriebsleiter-Kategorie nicht gefunden.",
        variant: "destructive",
      });
      return;
    }

    const checklist: InsertChecklist = {
      categoryId: betriebsleiterCategory.id,
      store: selectedStore,
      employeeName,
      shiftType,
      completedTasks,
      submittedAt: new Date().toISOString(),
    };

    submitMutation.mutate(checklist);
  };

  if (!betriebsleiterCategory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="mb-6"
          >
            <ArrowLeft size={16} className="mr-2" />
            Zurück zur Startseite
          </Button>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                Betriebsleiter-Kategorie muss erst im Admin-Bereich erstellt werden.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Betriebsleiter Aufgaben</h1>
          <p className="text-gray-600">Ihre täglichen Aufgaben und Kontrollen</p>
        </div>

        <div className="space-y-6">
          {/* Store-Auswahl */}
          <Card>
            <CardHeader>
              <CardTitle>Store auswählen</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Store auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Persönliche Angaben */}
          <Card>
            <CardHeader>
              <CardTitle>Persönliche Angaben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="employeeName">Name</Label>
                <Input
                  id="employeeName"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Ihr Name..."
                />
              </div>
              <div>
                <Label htmlFor="shiftType">Schicht</Label>
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Schicht auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frühschicht">Frühschicht</SelectItem>
                    <SelectItem value="Spätschicht">Spätschicht</SelectItem>
                    <SelectItem value="Nachtschicht">Nachtschicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Aufgaben */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle size={20} />
                Betriebsleiter Aufgaben ({completedTasks.length}/{betriebsleiterTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {betriebsleiterTasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Keine Aufgaben für Betriebsleiter definiert. 
                  Bitte wenden Sie sich an den Administrator.
                </p>
              ) : (
                <div className="space-y-4">
                  {betriebsleiterTasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id={task.id}
                        checked={completedTasks.includes(task.id)}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                      />
                      <div className="flex-1">
                        <label htmlFor={task.id} className="font-medium cursor-pointer">
                          {task.title}
                        </label>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          {betriebsleiterTasks.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <Button 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !selectedStore || !employeeName || !shiftType}
                  className="w-full"
                  size="lg"
                >
                  {submitMutation.isPending ? "Wird eingereicht..." : "Aufgaben einreichen"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}