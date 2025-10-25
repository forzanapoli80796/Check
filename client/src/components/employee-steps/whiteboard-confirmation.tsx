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
    <div className="w-full max-w-2xl mx-auto">
      {hasNotes ? (
        <div className="space-y-3 mb-6">
          {notes.map((note) => {
            const bgColorClass = {
              yellow: 'bg-yellow-50 border-yellow-200',
              blue: 'bg-blue-50 border-blue-200',
              green: 'bg-green-50 border-green-200',
              pink: 'bg-pink-50 border-pink-200',
              orange: 'bg-orange-50 border-orange-200',
            }[note.color || 'yellow'] || 'bg-yellow-50 border-yellow-200';

            return (
              <div 
                key={note.id} 
                className={`${bgColorClass} border p-4 rounded`}
                data-testid={`whiteboard-note-${note.id}`}
              >
                {note.imageUrl && (
                  <div className="mb-3">
                    <img 
                      src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`}
                      alt=""
                      className="w-full max-h-80 object-contain rounded"
                    />
                  </div>
                )}
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {note.message}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2 border-t border-gray-300">
                  <span>Von: {note.employeeName}</span>
                  <span>
                    {format(new Date(note.createdAt!), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 mb-6">
          <p className="text-gray-500">Keine aktuellen Mitteilungen</p>
        </div>
      )}

      <Button
        onClick={handleConfirm}
        disabled={isConfirming}
        className="w-full"
        data-testid="button-confirm-whiteboard-read"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Wird gespeichert...
          </>
        ) : (
          'Weiter'
        )}
      </Button>
    </div>
  );
}
