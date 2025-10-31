import { useState, useRef } from "react";
import { ArrowLeft, Send, Image, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EmployeeWorkflowState } from "@/lib/types";

interface SendMessageProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
}

export default function SendMessage({ state, updateState, goBack }: SendMessageProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMessageMutation = useMutation({
    mutationFn: async ({ message, imageUrl }: { message: string; imageUrl?: string }) => {
      const response = await apiRequest("POST", "/api/employee-messages", {
        message,
        employeeName: employeeName || 'Mitarbeiter',
        storeName: state.selectedStore,
        categoryName: state.selectedAreaName || undefined,
        imageUrl,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setEmployeeName("");
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Nachricht gesendet",
        description: "Ihre Nachricht wurde erfolgreich an den Admin gesendet.",
      });
      // Nach erfolgreichem Senden zurück zur Bereichsauswahl
      updateState({ step: 'area' });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fehler",
          description: "Das Bild darf maximal 5MB groß sein.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (imageData: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const response = await apiRequest("POST", "/api/upload/employee-note-image", {
        image: imageData,
      });
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!employeeName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Ihren Namen ein.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim() && !selectedImage) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Nachricht ein.",
        variant: "destructive",
      });
      return;
    }

    let imageUrl: string | undefined;
    if (selectedImage) {
      const uploadedUrl = await uploadImage(selectedImage);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        toast({
          title: "Fehler",
          description: "Bild konnte nicht hochgeladen werden.",
          variant: "destructive",
        });
        return;
      }
    }

    addMessageMutation.mutate({ message: message.trim(), imageUrl });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Nachricht an Admin
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Store
            </label>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">
                {state.selectedStore || 'Nicht ausgewählt'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ihr Name *
            </label>
            <Input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Geben Sie Ihren Namen ein"
              data-testid="input-employee-name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ihre Nachricht
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Schreiben Sie hier Ihre Nachricht an den Admin..."
              rows={5}
              className="resize-none"
              data-testid="textarea-message"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bild anhängen (optional)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              className="cursor-pointer"
              data-testid="input-image"
            />
            {selectedImage && (
              <div className="mt-2">
                <img
                  src={selectedImage}
                  alt="Vorschau"
                  className="max-w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSendMessage}
              disabled={!employeeName.trim() || (!message.trim() && !selectedImage) || addMessageMutation.isPending || uploadingImage}
              className="flex-1"
              data-testid="button-send"
            >
              {addMessageMutation.isPending || uploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Nachricht senden
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}