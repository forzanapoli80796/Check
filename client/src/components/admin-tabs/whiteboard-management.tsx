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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Clock,
  Image,
  Edit,
  Trash2,
  StickyNote
} from "lucide-react";
import type { StoreWhiteboard } from "@shared/schema";

const STORES = ["JP23", "KP5", "TS17"];
const COLORS = [
  { value: "yellow", label: "Gelb", class: "bg-yellow-100 border-yellow-300" },
  { value: "blue", label: "Blau", class: "bg-blue-100 border-blue-300" },
  { value: "green", label: "Grün", class: "bg-green-100 border-green-300" },
  { value: "pink", label: "Pink", class: "bg-pink-100 border-pink-300" },
  { value: "orange", label: "Orange", class: "bg-orange-100 border-orange-300" },
];

const createNoteSchema = z.object({
  message: z.string().min(1, "Nachricht ist erforderlich"),
  storeName: z.string().min(1, "Store ist erforderlich"),
  employeeName: z.string().min(1, "Name ist erforderlich"),
  color: z.enum(["yellow", "blue", "green", "pink", "orange"]).default("yellow"),
  expiresAt: z.date().optional(),
  imageUrl: z.string().optional(),
});

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

export function WhiteboardManagement() {
  const [storeFilter, setStoreFilter] = useState<string>("alle");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<StoreWhiteboard | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<StoreWhiteboard | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      message: "",
      storeName: "JP23",
      employeeName: "Admin",
      color: "yellow" as "yellow" | "blue" | "green" | "pink" | "orange",
      expiresAt: undefined,
      imageUrl: "",
    },
  });

  const { data: allNotes, isLoading } = useQuery<StoreWhiteboard[]>({
    queryKey: ["/api/whiteboard/all"],
    queryFn: async () => {
      const stores = ["JP23", "KP5", "TS17"];
      const allResults = await Promise.all(
        stores.map(async (store) => {
          const response = await fetch(`/api/whiteboard/${store}`);
          return response.json();
        })
      );
      return allResults.flat();
    },
  });

  const filteredNotes = allNotes?.filter(note => 
    storeFilter === "alle" || note.storeName === storeFilter
  ) || [];

  const createNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createNoteSchema>) => {
      return apiRequest("POST", "/api/whiteboard", {
        ...data,
        expiresAt: data.expiresAt?.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiteboard/all"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Notiz erstellt",
        description: "Die Whiteboard-Notiz wurde erfolgreich erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, message, editorName }: { id: string; message: string; editorName: string }) => {
      return apiRequest("PATCH", `/api/whiteboard/${id}`, { message, editorName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiteboard/all"] });
      setEditingNote(null);
      toast({
        title: "Notiz aktualisiert",
        description: "Die Whiteboard-Notiz wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/whiteboard/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whiteboard/all"] });
      setNoteToDelete(null);
      toast({
        title: "Notiz gelöscht",
        description: "Die Whiteboard-Notiz wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Notiz konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ungültige Datei",
        description: "Bitte wählen Sie eine Bilddatei aus.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const compressedImage = await compressImage(file);
      const response = await apiRequest("POST", "/api/upload/whiteboard-image", { image: compressedImage });
      const data = await response.json();
      form.setValue("imageUrl", data.imageUrl);
      toast({
        title: "Bild hochgeladen",
        description: "Das Bild wurde erfolgreich hochgeladen.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Das Bild konnte nicht hochgeladen werden.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (data: z.infer<typeof createNoteSchema>) => {
    createNoteMutation.mutate(data);
  };

  const handleEdit = (note: StoreWhiteboard) => {
    setEditingNote(note);
  };

  const handleUpdate = () => {
    if (!editingNote) return;
    updateNoteMutation.mutate({
      id: editingNote.id,
      message: editingNote.message,
      editorName: "Admin",
    });
  };

  const getColorClass = (color: string) => {
    return COLORS.find(c => c.value === color)?.class || COLORS[0].class;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-blue-600" />
              Whiteboard-Verwaltung
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-store-filter">
                  <Store className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Stores</SelectItem>
                  {STORES.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-note"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neue Notiz
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
              <p>Lade Whiteboard-Notizen...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Notizen gefunden</p>
              <p className="text-sm mt-2">Erstellen Sie eine neue Notiz mit dem Button oben.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`border-2 ${getColorClass(note.color || "yellow")}`}
                    data-testid={`whiteboard-note-${note.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {note.storeName}
                            </Badge>
                            <p className="text-sm font-semibold text-gray-600">
                              {note.employeeName}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(note.createdAt!), "dd.MM.yyyy HH:mm", { locale: de })}
                          </p>
                        </div>

                        <div className="bg-white/50 rounded p-3 min-h-[100px]">
                          <p className="whitespace-pre-wrap text-gray-800">
                            {note.message}
                          </p>
                        </div>

                        {note.imageUrl && (
                          <div className="border rounded overflow-hidden bg-white">
                            <img
                              src={`/api/whiteboard-image?path=${encodeURIComponent(note.imageUrl)}`}
                              alt="Whiteboard Bild"
                              className="w-full h-auto max-h-[200px] object-contain"
                            />
                            <Badge variant="secondary" className="m-2">
                              <Image className="w-3 h-3 mr-1" />
                              Bild
                            </Badge>
                          </div>
                        )}

                        {note.expiresAt && (
                          <div className="text-xs text-gray-500">
                            Gültig bis: {format(new Date(note.expiresAt), "dd.MM.yyyy", { locale: de })}
                          </div>
                        )}

                        {note.lastEditedAt && (
                          <div className="text-xs text-gray-400">
                            Zuletzt bearbeitet: {format(new Date(note.lastEditedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(note)}
                            data-testid={`button-edit-note-${note.id}`}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setNoteToDelete(note)}
                            data-testid={`button-delete-note-${note.id}`}
                            className="flex-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Löschen
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Whiteboard-Notiz erstellen</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-note-store">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORES.map((store) => (
                          <SelectItem key={store} value={store}>
                            {store}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Erstellt von</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-employee-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachricht</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder="Wichtige Nachricht für das Team..."
                        data-testid="textarea-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farbe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-note-color">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gültig bis (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-select-expiry"
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy", { locale: de })
                            ) : (
                              <span>Kein Ablaufdatum</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Bild (optional)</FormLabel>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    data-testid="input-image-upload"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-500 mt-1">Bild wird hochgeladen...</p>
                  )}
                  {form.watch("imageUrl") && (
                    <div className="mt-2">
                      <Badge variant="secondary">
                        <Image className="w-3 h-3 mr-1" />
                        Bild hochgeladen
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createNoteMutation.isPending}
                  data-testid="button-submit-note"
                >
                  {createNoteMutation.isPending ? "Erstelle..." : "Notiz erstellen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notiz bearbeiten</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nachricht</label>
                <Textarea
                  value={editingNote.message}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, message: e.target.value })
                  }
                  rows={6}
                  className="mt-2"
                  data-testid="textarea-edit-message"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={updateNoteMutation.isPending}
                  data-testid="button-update-note"
                >
                  {updateNoteMutation.isPending ? "Aktualisiere..." : "Speichern"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingNote(null)}
                  data-testid="button-cancel-edit"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Whiteboard-Notiz löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToDelete && deleteNoteMutation.mutate(noteToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
