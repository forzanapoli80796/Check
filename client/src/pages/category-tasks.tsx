import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

import type { Task } from "@shared/schema";

export default function CategoryTasks() {
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedShift, setSelectedShift] = useState<'früh' | 'spät'>('früh');
  const [selectedPhase, setSelectedPhase] = useState<'start' | 'ende'>('start');
  
  // Extract category and location info from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');
  const categoryName = urlParams.get('categoryName') || 'Kategorie';
  const locationId = urlParams.get('locationId');
  const locationName = urlParams.get('locationName') || 'Standort';
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    estimatedMinutes: "5",
    icon: "clipboard-list",
    categoryId: categoryId || "",
  });
  
  const { toast } = useToast();
  const qClient = useQueryClient();

  // Fetch tasks for this category
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Filter tasks for this category
  const tasks = allTasks.filter(task => task.categoryId === categoryId);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      estimatedMinutes: "5",
      icon: "clipboard-list",
      categoryId: categoryId || "",
    });
    setSelectedShift("früh");
    setSelectedPhase("start");
    setEditingTask(null);
  };

  const createMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskData,
          categoryId,
        }),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Aufgabe erstellt", description: "Die Aufgabe wurde erfolgreich erstellt." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({ 
        title: "Fehler", 
        description: "Die Aufgabe konnte nicht erstellt werden.",
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: any) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Aufgabe aktualisiert", description: "Die Aufgabe wurde erfolgreich aktualisiert." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ 
        title: "Fehler", 
        description: "Die Aufgabe konnte nicht aktualisiert werden.",
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Aufgabe gelöscht", description: "Die Aufgabe wurde erfolgreich gelöscht." });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({ 
        title: "Fehler", 
        description: "Die Aufgabe konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      ...formData,
      shift: selectedShift,
      phase: selectedPhase,
    };
    
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes || "5",
      icon: task.icon,
      categoryId: task.categoryId,
    });
    setSelectedShift((task.shift as 'früh' | 'spät') || "früh");
    setSelectedPhase((task.phase as 'start' | 'ende') || "start");
    setIsDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?")) {
      deleteMutation.mutate(taskId);
    }
  };

  const openAddDialog = (shift: 'früh' | 'spät', phase: 'start' | 'ende') => {
    resetForm();
    setSelectedShift(shift);
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };

  const getTasksForColumn = (shift: 'früh' | 'spät', phase: 'start' | 'ende') => {
    return tasks.filter(task => task.shift === shift && task.phase === phase);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TaskColumn = ({ shift, phase, title, color }: { 
    shift: 'früh' | 'spät', 
    phase: 'start' | 'ende', 
    title: string,
    color: string 
  }) => {
    const columnTasks = getTasksForColumn(shift, phase);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`font-medium ${color} border-b pb-2 flex-1`}>
            {title}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openAddDialog(shift, phase)}
            className="ml-2"
          >
            <Plus size={14} />
          </Button>
        </div>
        
        <div className="space-y-3">
          {columnTasks.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
              Keine Aufgaben
            </div>
          ) : (
            columnTasks.map(task => (
              <Card key={task.id} className="bg-white border shadow-sm">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(task)}>
                        <Edit size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(task.id)}>
                        <Trash2 size={12} className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                    <span className="text-xs text-gray-500">{task.estimatedMinutes || "5"} min</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

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
      
      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Aufgaben für {categoryName} - {locationName}
            </h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie die Aufgaben nach Schichten und Phasen für Standort {locationName}
            </p>
          </div>

          {/* Book-style Layout: Left Page (Frühschicht) | Right Page (Spätschicht) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Page: Frühschicht */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg font-semibold text-blue-800 text-center">
                  🌅 Frühschicht
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <TaskColumn 
                    shift="früh" 
                    phase="start" 
                    title="Start" 
                    color="text-blue-700"
                  />
                  <TaskColumn 
                    shift="früh" 
                    phase="ende" 
                    title="Ende" 
                    color="text-blue-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right Page: Spätschicht */}
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="bg-orange-50 border-b">
                <CardTitle className="text-lg font-semibold text-orange-800 text-center">
                  🌇 Spätschicht
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <TaskColumn 
                    shift="spät" 
                    phase="start" 
                    title="Start" 
                    color="text-orange-700"
                  />
                  <TaskColumn 
                    shift="spät" 
                    phase="ende" 
                    title="Ende" 
                    color="text-orange-700"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Schicht und Phase werden automatisch aus der gewählten Spalte gesetzt */}
            <div className="bg-blue-50 p-3 rounded text-sm">
              <strong>Wird erstellt in:</strong> {selectedShift === 'früh' ? '🌅 Frühschicht' : '🌇 Spätschicht'} - {selectedPhase === 'start' ? 'Start' : 'Ende'}
            </div>
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priorität</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedMinutes">Minuten</Label>
                <Input
                  id="estimatedMinutes"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: e.target.value }))}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTask ? "Aktualisieren" : "Erstellen"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Footer mit Zurück Button */}
      <div className="py-6 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/admin")}
          className="px-8"
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Admin-Übersicht
        </Button>
      </div>
    </div>
  );
}