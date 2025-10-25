import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DevTools() {
  const { toast } = useToast();
  
  const resetWhiteboardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/whiteboard-reads/reset");
    },
    onSuccess: () => {
      toast({
        title: "Erfolgreich zurückgesetzt",
        description: "Alle Whiteboard-Bestätigungen wurden gelöscht. Mitarbeiter müssen das Whiteboard heute erneut lesen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Whiteboard-Bestätigungen konnten nicht zurückgesetzt werden.",
        variant: "destructive",
      });
      console.error("Error resetting whiteboard reads:", error);
    },
  });

  const handleResetWhiteboard = () => {
    if (confirm("Möchten Sie wirklich alle Whiteboard-Bestätigungen zurücksetzen? Alle Mitarbeiter müssen das Whiteboard heute erneut lesen.")) {
      resetWhiteboardMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-semibold">
              ⚠️ Bitte nicht anfassen!
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Hier sind Werkzeuge für die Entwicklung der App. Diese Funktionen sollten nur von Entwicklern verwendet werden, da sie das System beeinflussen können.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Whiteboard Erzwingung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Setzt alle Whiteboard-Bestätigungen zurück. Nach dem Zurücksetzen müssen alle Mitarbeiter das Whiteboard heute erneut lesen.
          </p>
          <Button
            onClick={handleResetWhiteboard}
            disabled={resetWhiteboardMutation.isPending}
            variant="destructive"
            data-testid="button-reset-whiteboard"
          >
            {resetWhiteboardMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird zurückgesetzt...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Whiteboard-Erzwingung zurücksetzen
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
