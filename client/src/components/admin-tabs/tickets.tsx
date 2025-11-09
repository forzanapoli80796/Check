import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, MessageSquare, Calendar, Store, User, AlertCircle, Clock, CheckCircle, Image as ImageIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { Ticket } from "@shared/schema";

const STORES = ["JP23", "KP5", "TS17"];
const BEREICHE = ["Hausmeister", "Betriebsleiter", "Küche", "Terminal", "Fahrer"];

export function TicketsManagement() {
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Formular-State für Bearbeitung
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "offen" as "offen" | "in_bearbeitung" | "erledigt",
    priority: "mittel" as "niedrig" | "mittel" | "hoch",
    assignedTo: "",
    dueDate: "",
  });

  // Formular-State für Erstellung
  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    status: "offen" as "offen" | "in_bearbeitung" | "erledigt",
    priority: "mittel" as "niedrig" | "mittel" | "hoch",
    store: "JP23",
    assignedTo: "",
    dueDate: "",
  });

  // Tickets abrufen
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  // Gefilterte Tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStore = selectedStore === "all" || ticket.store === selectedStore;
    const matchesStatus = statusFilter === "alle" || ticket.status === statusFilter;
    return matchesStore && matchesStatus;
  });

  // Ticket erstellen
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolgreich erstellt",
        description: "Das Ticket wurde erfolgreich erstellt.",
      });
      setShowCreateDialog(false);
      setCreateFormData({
        title: "",
        description: "",
        status: "offen",
        priority: "mittel",
        store: "JP23",
        assignedTo: "",
        dueDate: "",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  // Ticket aktualisieren
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updateData: Partial<Ticket> }) => {
      return await apiRequest("PUT", `/api/tickets/${data.id}`, data.updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolgreich aktualisiert",
        description: "Das Ticket wurde erfolgreich bearbeitet.",
      });
      setShowEditDialog(false);
      setEditingTicket(null);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Ticket löschen
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolgreich gelöscht",
        description: "Das Ticket wurde gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  // Kommentar hinzufügen
  const addCommentMutation = useMutation({
    mutationFn: async (data: { ticketId: string; user: string; comment: string }) => {
      return await apiRequest("POST", `/api/tickets/${data.ticketId}/comments`, {
        user: data.user,
        comment: data.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Kommentar hinzugefügt",
        description: "Der Kommentar wurde erfolgreich hinzugefügt.",
      });
      setNewComment("");
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!createFormData.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate({
      ...createFormData,
      dueDate: createFormData.dueDate ? new Date(createFormData.dueDate) : null,
    });
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo || "",
      dueDate: ticket.dueDate ? format(new Date(ticket.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
    });
    setShowEditDialog(true);
  };

  const handleSaveTicket = () => {
    if (!editingTicket) return;
    
    updateMutation.mutate({
      id: editingTicket.id,
      updateData: {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      },
    });
  };

  const handleDeleteTicket = (id: string) => {
    if (confirm("Möchten Sie dieses Ticket wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddComment = (ticketId: string) => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      ticketId,
      user: "Admin",
      comment: newComment,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hoch": return "bg-red-500";
      case "mittel": return "bg-yellow-500";
      case "niedrig": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "offen": return <AlertCircle className="w-4 h-4" />;
      case "in_bearbeitung": return <Clock className="w-4 h-4" />;
      case "erledigt": return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offen": return "bg-red-100 text-red-800";
      case "in_bearbeitung": return "bg-yellow-100 text-yellow-800";
      case "erledigt": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Tickets werden geladen...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tickets verwalten</h3>
        
        <div className="flex gap-4 items-center">
          {/* Neues Ticket Button */}
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            data-testid="button-create-ticket"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neues Ticket
          </Button>
          
          {/* Filter */}
          <div className="flex gap-4">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Alle Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Stores</SelectItem>
                {STORES.map(store => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Status</SelectItem>
                <SelectItem value="offen">Offen</SelectItem>
                <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                <SelectItem value="erledigt">Erledigt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tickets Liste */}
      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              Keine Tickets vorhanden
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map(ticket => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{ticket.title}</h4>
                      <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace("_", " ")}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{ticket.description}</p>
                    
                    {/* Bild Vorschau */}
                    {ticket.image && (
                      <div className="mb-3">
                        <img 
                          src={ticket.image} 
                          alt="Ticket Bild" 
                          className="rounded-lg max-w-xs max-h-48 object-cover cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors"
                          onClick={() => setImagePreview(ticket.image)}
                          data-testid={`img-ticket-${ticket.id}`}
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Store className="w-4 h-4" />
                        {ticket.store}
                      </div>
                      {ticket.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {ticket.assignedTo}
                        </div>
                      )}
                      {ticket.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(ticket.dueDate), "dd.MM.yyyy HH:mm", { locale: de })}
                        </div>
                      )}
                    </div>
                    
                    {/* Kommentare */}
                    {ticket.comments && (ticket.comments as any[]).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <div className="text-sm font-medium mb-2 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          Kommentare ({(ticket.comments as any[]).length})
                        </div>
                        <div className="space-y-2">
                          {(ticket.comments as any[]).map((comment, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{comment.user}:</span> {comment.comment}
                              <span className="text-gray-400 ml-2">
                                ({format(new Date(comment.timestamp), "dd.MM. HH:mm")})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditTicket(ticket)}
                      data-testid={`button-edit-ticket-${ticket.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="hover:bg-red-50"
                      data-testid={`button-delete-ticket-${ticket.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket bearbeiten</DialogTitle>
          </DialogHeader>
          
          {editingTicket && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              {/* Bild Anzeige */}
              {editingTicket.image && (
                <div>
                  <Label>Angehängtes Bild</Label>
                  <div className="mt-2">
                    <img 
                      src={editingTicket.image} 
                      alt="Ticket Bild" 
                      className="rounded-lg max-w-md max-h-64 object-cover cursor-pointer border border-gray-200 hover:border-blue-400 transition-colors"
                      onClick={() => setImagePreview(editingTicket.image)}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="erledigt">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priorität</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="hoch">Hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="assignedTo">Bereich zuweisen</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Bereich auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BEREICHE.map(bereich => (
                      <SelectItem key={bereich} value={bereich}>{bereich}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              {/* Neuer Kommentar */}
              <div>
                <Label htmlFor="comment">Kommentar hinzufügen</Label>
                <div className="flex gap-2 mt-1">
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar eingeben..."
                    className="min-h-[60px]"
                  />
                  <Button
                    onClick={() => handleAddComment(editingTicket.id)}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                  >
                    Senden
                  </Button>
                </div>
              </div>
              
              {/* Bestehende Kommentare */}
              {editingTicket.comments && (editingTicket.comments as any[]).length > 0 && (
                <div>
                  <Label>Kommentare</Label>
                  <ScrollArea className="h-[200px] border rounded p-3 mt-1">
                    <div className="space-y-2">
                      {(editingTicket.comments as any[]).map((comment, idx) => (
                        <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium">{comment.user}</div>
                          <div>{comment.comment}</div>
                          <div className="text-gray-400 text-xs mt-1">
                            {format(new Date(comment.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSaveTicket} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Ticket erstellen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title">Titel *</Label>
              <Input
                id="create-title"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                placeholder="Ticket Titel eingeben..."
                className="mt-1"
                data-testid="input-create-title"
              />
            </div>
            
            <div>
              <Label htmlFor="create-description">Beschreibung</Label>
              <Textarea
                id="create-description"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Beschreibung eingeben..."
                className="mt-1 min-h-[100px]"
                data-testid="input-create-description"
              />
            </div>
            
            <div>
              <Label htmlFor="create-store">Store *</Label>
              <Select value={createFormData.store} onValueChange={(value) => setCreateFormData({ ...createFormData, store: value })}>
                <SelectTrigger className="mt-1" data-testid="select-create-store">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map(store => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-status">Status</Label>
                <Select value={createFormData.status} onValueChange={(value: any) => setCreateFormData({ ...createFormData, status: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                    <SelectItem value="erledigt">Erledigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="create-priority">Priorität</Label>
                <Select value={createFormData.priority} onValueChange={(value: any) => setCreateFormData({ ...createFormData, priority: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="niedrig">Niedrig</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="create-assignedTo">Bereich zuweisen</Label>
              <Select value={createFormData.assignedTo} onValueChange={(value) => setCreateFormData({ ...createFormData, assignedTo: value })}>
                <SelectTrigger className="mt-1" data-testid="select-create-assignedTo">
                  <SelectValue placeholder="Bereich auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {BEREICHE.map(bereich => (
                    <SelectItem key={bereich} value={bereich}>{bereich}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="create-dueDate">Fälligkeitsdatum</Label>
              <Input
                id="create-dueDate"
                type="datetime-local"
                value={createFormData.dueDate}
                onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                className="mt-1"
                data-testid="input-create-dueDate"
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">
                Abbrechen
              </Button>
              <Button onClick={handleCreateTicket} disabled={createMutation.isPending} data-testid="button-submit-create">
                {createMutation.isPending ? "Erstellen..." : "Ticket erstellen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bild Vorschau Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bild Vorschau</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img 
              src={imagePreview || ""} 
              alt="Ticket Bild Vorschau" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}