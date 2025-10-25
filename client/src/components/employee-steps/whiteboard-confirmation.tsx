import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { StoreWhiteboard } from "@shared/schema";
import type { EmployeeWorkflowState } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

interface WhiteboardConfirmationProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  onConfirmed: () => void;
}

export default function WhiteboardConfirmation({ state, onConfirmed }: WhiteboardConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch whiteboard notes for the selected store
  const { data: notes, isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ["/api/whiteboard", state.selectedStore],
    enabled: !!state.selectedStore,
  });

  // Save read confirmation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      await apiRequest("POST", "/api/whiteboard-reads", {
        employeeName: state.employeeName,
        store: state.selectedStore,
        shift: state.selectedShift,
        date: today,
      });
    },
    onSuccess: () => {
      onConfirmed();
    },
    onError: (error) => {
      console.error('Error confirming whiteboard read:', error);
      // Still proceed even if confirmation fails
      onConfirmed();
    },
  });

  const handleConfirm = async () => {
    setIsConfirming(true);
    await confirmMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  const hasNotes = notes && notes.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <MessageSquare className="w-8 h-8" />
          Wichtige Mitteilungen
        </CardTitle>
        <p className="text-blue-100 mt-2">
          {hasNotes 
            ? `${notes.length} Mitteilung${notes.length === 1 ? '' : 'en'} für ${state.selectedStore}`
            : 'Keine aktuellen Mitteilungen'
          }
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {hasNotes ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {notes.map((note) => {
                const bgColorClass = {
                  yellow: 'bg-yellow-50 border-yellow-200',
                  blue: 'bg-blue-50 border-blue-200',
                  green: 'bg-green-50 border-green-200',
                  pink: 'bg-pink-50 border-pink-200',
                  orange: 'bg-orange-50 border-orange-200',
                }[note.color || 'yellow'] || 'bg-yellow-50 border-yellow-200';

                return (
                  <Card 
                    key={note.id} 
                    className={`${bgColorClass} border-2`}
                    data-testid={`whiteboard-note-${note.id}`}
                  >
                    <CardContent className="p-4">
                      {note.imageUrl && (
                        <div className="mb-3">
                          <img 
                            src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`}
                            alt="Whiteboard Bild"
                            className="w-full h-48 object-cover rounded-md"
                          />
                        </div>
                      )}
                      <p className="text-gray-800 text-lg whitespace-pre-wrap leading-relaxed">
                        {note.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                        <span className="font-medium">Von: {note.employeeName}</span>
                        <span>
                          {format(new Date(note.createdAt!), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              Keine neuen Mitteilungen
            </p>
            <p className="text-gray-500 mt-2">
              Alle Informationen sind aktuell
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            data-testid="button-confirm-whiteboard-read"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Bestätigung wird gespeichert...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                {hasNotes ? 'Gelesen und verstanden - Weiter' : 'Weiter zu Aufgaben'}
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Durch Klicken bestätigen Sie, dass Sie die Mitteilungen gelesen haben
        </div>
      </CardContent>
    </Card>
  );
}
