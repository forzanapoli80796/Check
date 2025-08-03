import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, Upload, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import forzaCheckLogo from "@assets/FORZACHECK1_black_1753816621910.png";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: string;
  shift: 'früh' | 'spät';
  phase: 'start' | 'ende';
  attachments?: string[];
}

export default function CategoryTasks() {
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedShift, setSelectedShift] = useState<'früh' | 'spät'>('früh');
  const [selectedPhase, setSelectedPhase] = useState<'start' | 'ende'>('start');
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    estimatedMinutes: "5",
  });
  const [taskAttachments, setTaskAttachments] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract category info from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('categoryId');
  const categoryName = urlParams.get('categoryName') || 'Kategorie';

  // Mock data - replace with real API calls later
  const [tasks, setTasks] = useState<Task[]>([]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      estimatedMinutes: "5",
    });
    setTaskAttachments([]);
    setEditingTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Date.now().toString(),
      ...formData,
      shift: selectedShift,
      phase: selectedPhase,
      attachments: taskAttachments,
    };
    
    if (editingTask) {
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { ...newTask, id: editingTask.id } : task
      ));
      toast({ title: "Aufgabe aktualisiert", description: "Die Aufgabe wurde erfolgreich aktualisiert." });
    } else {
      setTasks(prev => [...prev, newTask]);
      toast({ title: "Aufgabe erstellt", description: "Die Aufgabe wurde erfolgreich erstellt." });
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes,
    });
    setTaskAttachments(task.attachments || []);
    setSelectedShift(task.shift);
    setSelectedPhase(task.phase);
    setIsDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?")) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast({ title: "Aufgabe gelöscht", description: "Die Aufgabe wurde erfolgreich gelöscht." });
    }
  };

  const openAddDialog = (shift: 'früh' | 'spät', phase: 'start' | 'ende') => {
    resetForm();
    setSelectedShift(shift);
    setSelectedPhase(phase);
    setIsDialogOpen(true);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/objects/upload", {
        method: "POST",
      });
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const response = await apiRequest("/api/attachments", {
          method: "PUT",
          body: { fileURL: uploadedFile.uploadURL },
        });
        
        setTaskAttachments(prev => [...prev, response.objectPath]);
        toast({ 
          title: "Datei hochgeladen", 
          description: "Die Datei wurde erfolgreich hinzugefügt." 
        });
      }
    } catch (error) {
      console.error("Error processing upload:", error);
      toast({ 
        title: "Upload-Fehler", 
        description: "Die Datei konnte nicht verarbeitet werden.",
        variant: "destructive"
      });
    }
  };

  const removeAttachment = (index: number) => {
    setTaskAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getTasksForColumn = (shift: 'früh' | 'spät', phase: 'start' | 'ende') => {
    return tasks.filter(task => task.shift === shift && task.phase === phase);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
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
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">{task.estimatedMinutes} min</span>
                  </div>
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="mt-2 flex items-center text-xs text-blue-600">
                      <File size={12} className="mr-1" />
                      {task.attachments.length} Anhänge
                    </div>
                  )}
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
              Aufgaben für {categoryName}
            </h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie die Aufgaben nach Schichten und Phasen
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
                  🌆 Spätschicht
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Aufgabe bearbeiten" : "Neue Aufgabe"} - {selectedShift}schicht ({selectedPhase})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            {/* File Upload Section */}
            <div>
              <Label>Anhänge</Label>
              <div className="mt-2 space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Datei hinzufügen
                  </div>
                </ObjectUploader>
                
                {taskAttachments.length > 0 && (
                  <div className="space-y-1">
                    {taskAttachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <File size={14} />
                          <span className="truncate">Anhang {index + 1}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit">
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