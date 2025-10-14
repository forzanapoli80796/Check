import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Send,
  Image,
  ArrowLeft
} from "lucide-react";
import type { Ticket } from "@shared/schema";

interface TicketsViewProps {
  state: {
    selectedStore: string | null;
    selectedArea: string | null;
    employeeName: string;
  };
  updateState: (updates: any) => void;
}

export function TicketsView({ state, updateState }: TicketsViewProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  // Fetch tickets for this store and category
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/employee", state.selectedStore, state.selectedArea],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (state.selectedStore) params.append("store", state.selectedStore);
      if (state.selectedArea) params.append("categoryId", state.selectedArea);
      
      const response = await apiRequest(`/api/tickets?${params.toString()}`, "GET");
      return response.json();
    },
    enabled: !!state.selectedStore && !!state.selectedArea,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/tickets/${id}`, "PUT", { 
        status,
        assignedTo: status === "in_bearbeitung" ? state.employeeName : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/employee"] });
      toast({
        title: "Status aktualisiert",
        description: "Der Ticket-Status wurde erfolgreich geändert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, comment }: { ticketId: string; comment: string }) => {
      const response = await apiRequest(`/api/tickets/${ticketId}/comments`, "POST", {
        user: state.employeeName,
        comment,
      });
      return response.json();
    },
    onSuccess: (updatedTicket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/employee"] });
      setSelectedTicket(updatedTicket);
      setNewComment("");
      toast({
        title: "Kommentar hinzugefügt",
        description: "Ihr Kommentar wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "offen":
        return <AlertCircle className="w-4 h-4" />;
      case "in_bearbeitung":
        return <Clock className="w-4 h-4" />;
      case "erledigt":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "offen":
        return "bg-red-100 text-red-800";
      case "in_bearbeitung":
        return "bg-yellow-100 text-yellow-800";
      case "erledigt":
        return "bg-green-100 text-green-800";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "hoch":
        return "bg-red-100 text-red-800";
      case "mittel":
        return "bg-yellow-100 text-yellow-800";
      case "niedrig":
        return "bg-blue-100 text-blue-800";
      default:
        return "";
    }
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: ticketId, status: newStatus });
  };

  const handleAddComment = () => {
    if (selectedTicket && newComment.trim()) {
      addCommentMutation.mutate({
        ticketId: selectedTicket.id,
        comment: newComment,
      });
    }
  };

  const handleCompleteAll = () => {
    updateState({ step: 'success', completedTasks: [] });
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center text-gray-500">
          Lade Tickets...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Offene Tickets</CardTitle>
            <Button
              variant="outline"
              onClick={() => updateState({ step: 'area' })}
              data-testid="button-back-to-area"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Bereichsauswahl
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets
                .filter(ticket => ticket.status !== "erledigt")
                .map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowDetailsDialog(true);
                  }}
                  data-testid={`card-ticket-${ticket.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{ticket.title}</h3>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{ticket.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {ticket.assignedTo && (
                          <div>Zugewiesen an: {ticket.assignedTo}</div>
                        )}
                        <div>Erstellt: {format(new Date(ticket.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                      </div>
                      {ticket.image && (
                        <Badge variant="secondary">
                          <Image className="w-3 h-3 mr-1" />
                          Bild
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-center mt-6">
                <Button
                  size="lg"
                  onClick={handleCompleteAll}
                  className="w-full max-w-md"
                  data-testid="button-complete-tickets"
                >
                  Tickets-Übersicht abschließen
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Keine offenen Tickets vorhanden</p>
              <Button
                size="lg"
                onClick={handleCompleteAll}
                data-testid="button-no-tickets-complete"
              >
                Weiter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedTicket.title}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1">{selectedTicket.status.replace("_", " ")}</span>
                </Badge>
              </div>
            </DialogHeader>
            
            <ScrollArea className="h-[50vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className="text-gray-600">{selectedTicket.description}</p>
                </div>
                
                {selectedTicket.image && (
                  <div>
                    <h3 className="font-semibold mb-2">Bild</h3>
                    <img src={selectedTicket.image} alt="Ticket Bild" className="w-full rounded" />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold mb-2">Status ändern</h3>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-[200px]" data-testid="select-ticket-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="erledigt">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-500">
                  <div>Erstellt von: {selectedTicket.createdBy}</div>
                  <div>Erstellt am: {format(new Date(selectedTicket.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                  {selectedTicket.assignedTo && <div>Zugewiesen an: {selectedTicket.assignedTo}</div>}
                  {selectedTicket.updatedAt && (
                    <div>Aktualisiert: {format(new Date(selectedTicket.updatedAt), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Kommentare</h3>
                  {(selectedTicket.comments as any[])?.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {(selectedTicket.comments as any[]).map((comment, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{comment.user}</span>
                            <span className="text-gray-500">
                              {format(new Date(comment.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                            </span>
                          </div>
                          <p className="mt-1">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-3">Noch keine Kommentare</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Kommentar hinzufügen..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid="textarea-comment"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      data-testid="button-add-comment"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}