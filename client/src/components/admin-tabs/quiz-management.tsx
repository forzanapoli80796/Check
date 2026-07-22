import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit2, Trash2, HelpCircle, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  correctAnswer: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  question: "",
  answer1: "",
  answer2: "",
  answer3: "",
  correctAnswer: 1,
  isActive: true,
};

export default function QuizManagement() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: questions = [], isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/terminal-quiz"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await apiRequest("POST", "/api/terminal-quiz", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminal-quiz"] });
      toast({ title: "Frage hinzugefügt", description: "Die Quiz-Frage wurde erfolgreich erstellt." });
      closeDialog();
    },
    onError: () => toast({ title: "Fehler", description: "Frage konnte nicht erstellt werden.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof emptyForm> }) => {
      const res = await apiRequest("PUT", `/api/terminal-quiz/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminal-quiz"] });
      toast({ title: "Frage aktualisiert", description: "Die Quiz-Frage wurde erfolgreich gespeichert." });
      closeDialog();
    },
    onError: () => toast({ title: "Fehler", description: "Frage konnte nicht aktualisiert werden.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/terminal-quiz/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminal-quiz"] });
      toast({ title: "Frage gelöscht", description: "Die Quiz-Frage wurde entfernt." });
    },
    onError: () => toast({ title: "Fehler", description: "Frage konnte nicht gelöscht werden.", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/terminal-quiz/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terminal-quiz"] });
    },
  });

  const openAdd = () => {
    setEditingQuestion(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setForm({
      question: q.question,
      answer1: q.answer1,
      answer2: q.answer2,
      answer3: q.answer3,
      correctAnswer: q.correctAnswer,
      isActive: q.isActive,
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingQuestion(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.question.trim() || !form.answer1.trim() || !form.answer2.trim() || !form.answer3.trim()) {
      toast({ title: "Fehlende Angaben", description: "Bitte fülle alle Felder aus.", variant: "destructive" });
      return;
    }
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const answerLabels = ["Antwort 1", "Antwort 2", "Antwort 3"];
  const answerFields = ["answer1", "answer2", "answer3"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Terminal Quiz
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Fragen werden zufällig ausgewählt. Terminal-Mitarbeiter müssen vor dem Whiteboard eine korrekt beantworten.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Frage
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Keine Quiz-Fragen vorhanden</p>
            <p className="text-sm mt-1">Erstelle die erste Frage, um das Quiz zu aktivieren.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <Card key={q.id} className={`border ${q.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 leading-snug">{q.question}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant={q.isActive ? "default" : "secondary"} className="text-xs">
                          {q.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1">
                      {([1, 2, 3] as const).map((num) => {
                        const text = q[`answer${num}` as 'answer1' | 'answer2' | 'answer3'];
                        const isCorrect = q.correctAnswer === num;
                        return (
                          <div
                            key={num}
                            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded ${
                              isCorrect ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600'
                            }`}
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                              {num}
                            </span>
                            <span>{text}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ id: q.id, isActive: !q.isActive })}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {q.isActive ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                    {q.isActive ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(q)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Frage löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(q.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Frage bearbeiten" : "Neue Quiz-Frage"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quiz-question">Frage</Label>
              <Input
                id="quiz-question"
                value={form.question}
                onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="Welche Temperatur hat der Ofen?"
              />
            </div>

            <div className="space-y-3">
              <Label>Antworten — markiere die richtige Antwort</Label>
              {answerFields.map((field, i) => {
                const num = i + 1;
                const isCorrect = form.correctAnswer === num;
                return (
                  <div key={field} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, correctAnswer: num }))}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                        isCorrect
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-400 hover:border-green-400'
                      }`}
                      title="Als richtige Antwort markieren"
                    >
                      {isCorrect ? <CheckCircle2 size={16} /> : num}
                    </button>
                    <Input
                      value={form[field]}
                      onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={`${answerLabels[i]} eingeben`}
                      className={isCorrect ? 'border-green-400 bg-green-50' : ''}
                    />
                  </div>
                );
              })}
              <p className="text-xs text-gray-500">Klicke auf die Nummer links, um die richtige Antwort zu markieren.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog} className="flex-1">
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird gespeichert…
                  </>
                ) : (
                  editingQuestion ? "Speichern" : "Erstellen"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
