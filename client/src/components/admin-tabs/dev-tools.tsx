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
