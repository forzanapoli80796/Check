import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, CheckCircle, Clock, Image } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { StoreWhiteboard } from "@shared/schema";

interface WhiteboardViewProps {
  state: {
    selectedStore: string | null;
    selectedArea: string | null;
  };
  updateState: (updates: any) => void;
}

export function WhiteboardView({ state, updateState }: WhiteboardViewProps) {
  const [confirmed, setConfirmed] = useState(false);

  // Fetch whiteboard entries for this store
  const { data: entries, isLoading} = useQuery<StoreWhiteboard[]>({
    queryKey: ["/api/whiteboard", state.selectedStore],
    queryFn: async () => {
      const response = await fetch(`/api/whiteboard/${state.selectedStore}`);
      return response.json();
    },
    enabled: !!state.selectedStore,
  });

  const getColorClass = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-100 border-yellow-300";
      case "blue":
        return "bg-blue-100 border-blue-300";
      case "green":
        return "bg-green-100 border-green-300";
      case "pink":
        return "bg-pink-100 border-pink-300";
      case "orange":
        return "bg-orange-100 border-orange-300";
      default:
        return "bg-yellow-100 border-yellow-300";
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    // Nach kurzer Verzögerung zur nächsten Seite weiterleiten
    setTimeout(() => {
      updateState({ step: 'success', completedTasks: [] });
    }, 800);
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center text-gray-500">
          Lade Whiteboard...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-3 sm:px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Digitales Whiteboard - {state.selectedStore}
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => updateState({ step: 'area' })}
              data-testid="button-back-to-area"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-gray-600">
              Bitte lesen Sie alle wichtigen Nachrichten und Ankündigungen für Ihren Store.
            </p>
          </div>

          {entries && entries.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-4 md:grid-cols-2">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`border-2 shadow-md hover:shadow-lg transition-all ${getColorClass(entry.color || "yellow")}`}
                    data-testid={`whiteboard-entry-${entry.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-gray-600">
                            {entry.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(entry.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}
                          </p>
                        </div>

                        <div className="bg-white/50 rounded p-3">
                          <p className="whitespace-pre-wrap text-gray-800">
                            {entry.message}
                          </p>
                        </div>

                        {entry.imageUrl && (
                          <div className="border rounded overflow-hidden bg-white">
                            <img
                              src={`/api/whiteboard-image?path=${encodeURIComponent(entry.imageUrl)}`}
                              alt="Whiteboard Bild"
                              className="w-full h-auto max-h-[200px] object-contain"
                            />
                            <Badge variant="secondary" className="m-2">
                              <Image className="w-3 h-3 mr-1" />
                              Bild
                            </Badge>
                          </div>
                        )}

                        {entry.expiresAt && (
                          <div className="text-xs text-gray-500">
                            Gültig bis: {format(new Date(entry.expiresAt), "dd.MM.yyyy", { locale: de })}
                          </div>
                        )}

                        {entry.lastEditedAt && (
                          <div className="text-xs text-gray-400">
                            Zuletzt bearbeitet: {format(new Date(entry.lastEditedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Nachrichten auf dem Whiteboard</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleConfirm}
              disabled={confirmed}
              className={`w-full ${confirmed ? 'bg-green-600 hover:bg-green-600' : ''}`}
              data-testid="button-confirm-whiteboard"
            >
              {confirmed ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Whiteboard gelesen ✓
                </>
              ) : (
                'Ich habe das Whiteboard gelesen'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
