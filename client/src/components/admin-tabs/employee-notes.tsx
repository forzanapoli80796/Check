import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MessageSquare, Calendar, Store, User, Trash2, Eye } from "lucide-react";
import type { EmployeeNote } from "@shared/schema";

export function EmployeeNotes() {
  const [selectedNote, setSelectedNote] = useState<EmployeeNote | null>(null);
  const { toast } = useToast();

  // Fetch employee notes
  const { data: notes, isLoading } = useQuery<EmployeeNote[]>({
    queryKey: ["/api/employee-notes"],
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/employee-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-notes"] });
      toast({
        title: "Erfolg",
        description: "Nachricht wurde gelöscht",
      });
      setSelectedNote(null);
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Mitarbeiter-Nachrichten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>Nachrichten von Mitarbeitern aus dem Kugelfahrer-Hausmeister Bereich</p>
            <p className="font-semibold mt-2">
              Gesamtnachrichten: {notes?.length || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Lade Nachrichten...
            </div>
          ) : notes && notes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum/Uhrzeit</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Nachricht</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(note.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {note.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Store className="w-3 h-3 mr-1" />
                        {note.store}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{note.message}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedNote(note)}
                          data-testid={`button-view-note-${note.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Möchten Sie diese Nachricht wirklich löschen?")) {
                              deleteNoteMutation.mutate(note.id);
                            }
                          }}
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Keine Nachrichten vorhanden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note Details Dialog */}
      {selectedNote && (
        <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nachricht Details</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedNote.createdAt!), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Mitarbeiter</p>
                <p>{selectedNote.employeeName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Store</p>
                <Badge variant="outline">
                  <Store className="w-3 h-3 mr-1" />
                  {selectedNote.store}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Nachricht</p>
                <ScrollArea className="h-[200px] rounded border p-3">
                  <p className="whitespace-pre-wrap">{selectedNote.message}</p>
                </ScrollArea>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Möchten Sie diese Nachricht wirklich löschen?")) {
                      deleteNoteMutation.mutate(selectedNote.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
                <Button variant="outline" onClick={() => setSelectedNote(null)}>
                  Schließen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}