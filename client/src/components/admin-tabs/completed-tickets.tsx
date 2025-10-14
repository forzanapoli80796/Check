import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, CheckCircle2, User, Store, MessageSquare, Eye, Image as ImageIcon } from "lucide-react";
import type { Ticket } from "@shared/schema";

export function CompletedTickets() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Fetch all completed tickets
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets/completed"],
    queryFn: async () => {
      const response = await fetch("/api/tickets");
      const data = await response.json();
      // Filter only completed tickets and sort by completion date (newest first)
      return data
        .filter((ticket: Ticket) => ticket.status === "erledigt")
        .sort((a: Ticket, b: Ticket) => {
          if (!a.completedAt || !b.completedAt) return 0;
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        });
    },
  });

  const getStatusColor = (priority: string) => {
    switch (priority) {
      case "hoch": return "destructive";
      case "mittel": return "default";
      case "niedrig": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Erledigte Tickets
          </CardTitle>
          <CardDescription>
            Übersicht aller abgeschlossenen Tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Gesamt erledigt</p>
              <p className="text-2xl font-bold text-green-600">{tickets.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">JP23</p>
              <p className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.store === "JP23").length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">KP5</p>
              <p className="text-2xl font-bold text-purple-600">
                {tickets.filter(t => t.store === "KP5").length}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">TS17</p>
              <p className="text-2xl font-bold text-orange-600">
                {tickets.filter(t => t.store === "TS17").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Erledigte Tickets ({tickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine erledigten Tickets gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Erledigt am</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Erledigt von</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {ticket.completedAt
                          ? format(new Date(ticket.completedAt), "dd.MM.yyyy HH:mm", { locale: de })
                          : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {ticket.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Store className="w-3 h-3 mr-1" />
                        {ticket.store}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {ticket.assignedTo || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ticket-Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Titel</Label>
                  <p className="font-medium">{selectedTicket.title}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Store</Label>
                  <Badge variant="outline">
                    <Store className="w-3 h-3 mr-1" />
                    {selectedTicket.store}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Priorität</Label>
                  <Badge variant={getStatusColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Erledigt
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm text-gray-500">Beschreibung</Label>
                <p className="mt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Image */}
              {selectedTicket.image && (
                <div>
                  <Label className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    Bild
                  </Label>
                  <img
                    src={selectedTicket.image}
                    alt="Ticket Bild"
                    className="max-w-full rounded-lg border"
                  />
                </div>
              )}

              {/* Timeline */}
              <div>
                <Label className="text-sm text-gray-500">Zeitverlauf</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Erstellt:</span>
                    {selectedTicket.createdAt && 
                      format(new Date(selectedTicket.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-gray-500">Erledigt:</span>
                    {selectedTicket.completedAt && 
                      format(new Date(selectedTicket.completedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Erledigt von:</span>
                    {selectedTicket.assignedTo || "Unbekannt"}
                  </div>
                </div>
              </div>

              {/* Comments */}
              {selectedTicket.comments && Array.isArray(selectedTicket.comments) && selectedTicket.comments.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Kommentare ({selectedTicket.comments.length})
                  </Label>
                  <ScrollArea className="h-48 border rounded-lg p-3">
                    <div className="space-y-3">
                      {selectedTicket.comments.map((comment: any, index: number) => (
                        <div key={index} className="border-b pb-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{comment.user}</span>
                            <span className="text-gray-500">
                              {format(new Date(comment.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}