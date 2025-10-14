import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { 
  Plus, 
  Filter, 
  Calendar, 
  Store, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Image,
  MessageSquare,
  Send,
  Edit,
  Trash2
} from "lucide-react";
import type { Ticket, Category } from "@shared/schema";

const STORES = ["JP23", "KP5", "TS17"];

const createTicketSchema = z.object({
  description: z.string().min(1, "Aufgabe ist erforderlich"),
  store: z.string().min(1, "Store ist erforderlich"),
  priority: z.enum(["niedrig", "mittel", "hoch"]).default("mittel"),
  dueDate: z.string().optional(), // ISO date string
  image: z.string().optional(),
});

const commentSchema = z.object({
  comment: z.string().min(1, "Kommentar ist erforderlich"),
});

// Komponente für die Bildkomprimierung
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img") as HTMLImageElement;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export function TicketsManagement() {
  const [storeFilter, setStoreFilter] = useState<string>("alle");
  const [dateFilter, setDateFilter] = useState<string>("heute");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      description: "",
      store: "JP23",
      priority: "mittel",
      dueDate: "",
      image: "",
    },
  });

  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: "",
    },
  });

  // Fetch categories to find Kugelfahrer-Hausmeister
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch tickets with filters
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", storeFilter, dateFilter],
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTicketSchema>) => {
      // Find the Kugelfahrer-Hausmeister category ID
      const kugelfahrerCategory = categories?.find(
        (cat: Category) => cat.name === 'Kugelfahrer-Hausmeister'
      );
      
      const ticketData = {
        ...data,
        title: data.description.substring(0, 50), // Use first 50 chars of description as title
        status: "offen", // Default status
        categoryId: kugelfahrerCategory?.id || '89f804c0-5b68-4fd8-9720-6519ebbaec2b', // Use found ID or default
        createdBy: "Admin",
      };
      
      console.log('Sending ticket data:', ticketData);
      
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolg",
        description: "Ticket wurde erfolgreich erstellt",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ticket> }) => {
      return await apiRequest(`/api/tickets/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolg",
        description: "Ticket wurde aktualisiert",
      });
      setEditingTicket(null);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/tickets/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Erfolg",
        description: "Ticket wurde gelöscht",
      });
      setShowDetailsDialog(false);
      setSelectedTicket(null);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, comment }: { ticketId: string; comment: string }) => {
      const response = await apiRequest(`/api/tickets/${ticketId}/comments`, "POST", {
        user: "Admin",
        comment,
      });
      return response.json();
    },
    onSuccess: (updatedTicket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setSelectedTicket(updatedTicket);
      commentForm.reset();
      toast({
        title: "Erfolg",
        description: "Kommentar wurde hinzugefügt",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressedImage = await compressImage(file);
      if (editingTicket) {
        updateTicketMutation.mutate({
          id: editingTicket.id,
          data: { image: compressedImage },
        });
      } else {
        form.setValue("image", compressedImage);
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bild konnte nicht hochgeladen werden",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header mit Filtern */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-store-filter">
              <Store className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Store wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Stores</SelectItem>
              {STORES.map(store => (
                <SelectItem key={store} value={store}>{store}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-filter">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heute">Heute</SelectItem>
              <SelectItem value="gestern">Gestern</SelectItem>
              <SelectItem value="woche">Letzte 7 Tage</SelectItem>
              <SelectItem value="monat">Letzte 30 Tage</SelectItem>
              <SelectItem value="alle">Alle Tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-ticket">
          <Plus className="w-4 h-4 mr-2" />
          Neues Ticket
        </Button>
      </div>

      {/* Tickets Liste */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Lade Tickets...
          </CardContent>
        </Card>
      ) : tickets && tickets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedTicket(ticket);
                setShowDetailsDialog(true);
              }}
              data-testid={`card-ticket-${ticket.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <Badge className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{ticket.store}</Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {ticket.description}
                </p>
                {ticket.image && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      <Image className="w-3 h-3 mr-1" />
                      Bild vorhanden
                    </Badge>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  Erstellt: {format(new Date(ticket.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}
                </div>
                {ticket.assignedTo && (
                  <div className="text-xs text-gray-500">
                    Zugewiesen an: {ticket.assignedTo}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Keine Tickets gefunden
          </CardContent>
        </Card>
      )}

      {/* Dialog für neues Ticket */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Ticket erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Ticket für den Kugelfahrer-Hausmeister
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createTicketMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aufgabe</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Was muss gemacht werden?" 
                        {...field} 
                        rows={4}
                        data-testid="textarea-ticket-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ticket-store">
                          <SelectValue placeholder="Store wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORES.map(store => (
                          <SelectItem key={store} value={store}>{store}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorität</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-ticket-priority">
                          <SelectValue placeholder="Priorität wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="niedrig">Niedrig</SelectItem>
                        <SelectItem value="mittel">Mittel</SelectItem>
                        <SelectItem value="hoch">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fälligkeitsdatum (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-ticket-due-date"
                          >
                            {field.value ? (
                              format(new Date(field.value), "dd.MM.yyyy", { locale: de })
                            ) : (
                              <span>Datum wählen</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? date.toISOString().split('T')[0] : "");
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bild hinzufügen (optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          data-testid="input-ticket-image"
                        />
                        {field.value && (
                          <img src={field.value} alt="Vorschau" className="w-full h-32 object-cover rounded" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createTicketMutation.isPending} data-testid="button-submit-ticket">
                  {createTicketMutation.isPending ? "Erstelle..." : "Ticket erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog für Ticket-Details */}
      {selectedTicket && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedTicket.title}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getStatusColor(selectedTicket.status)}>
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1">{selectedTicket.status.replace("_", " ")}</span>
                </Badge>
                <Badge variant="outline">{selectedTicket.store}</Badge>
                <Badge className={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority}
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
                
                <div className="text-sm text-gray-500">
                  <div>Erstellt von: {selectedTicket.createdBy}</div>
                  <div>Erstellt am: {format(new Date(selectedTicket.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                  {selectedTicket.dueDate && (
                    <div className="font-semibold text-orange-600">
                      Fällig bis: {format(new Date(selectedTicket.dueDate), "dd.MM.yyyy", { locale: de })}
                    </div>
                  )}
                  {selectedTicket.assignedTo && <div>Zugewiesen an: {selectedTicket.assignedTo}</div>}
                  {selectedTicket.updatedAt && (
                    <div>Aktualisiert: {format(new Date(selectedTicket.updatedAt), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                  )}
                  {selectedTicket.completedAt && (
                    <div>Erledigt: {format(new Date(selectedTicket.completedAt), "dd.MM.yyyy HH:mm", { locale: de })}</div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Status ändern</h3>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({
                        id: selectedTicket.id,
                        data: { status: value as "offen" | "in_bearbeitung" | "erledigt" },
                      });
                    }}
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
                
                <div>
                  <h3 className="font-semibold mb-2">Kommentare</h3>
                  {(selectedTicket.comments as any[])?.length > 0 ? (
                    <div className="space-y-2">
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
                    <p className="text-gray-500">Noch keine Kommentare</p>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <Textarea
                      placeholder="Kommentar hinzufügen..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      data-testid="textarea-ticket-comment"
                    />
                    <Button
                      onClick={() => {
                        if (newComment.trim()) {
                          addCommentMutation.mutate({
                            ticketId: selectedTicket.id,
                            comment: newComment,
                          });
                          setNewComment("");
                        }
                      }}
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
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Möchten Sie dieses Ticket wirklich löschen?")) {
                    deleteTicketMutation.mutate(selectedTicket.id);
                  }
                }}
                data-testid="button-delete-ticket"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
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