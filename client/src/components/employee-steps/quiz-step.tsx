import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, HelpCircle, Loader2, RefreshCw } from "lucide-react";
import type { EmployeeWorkflowState } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

interface QuizStepProps {
  state: EmployeeWorkflowState;
  updateState: (updates: Partial<EmployeeWorkflowState>) => void;
  goBack: () => void;
  onCorrect: () => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
}

export default function QuizStep({ state, updateState, goBack, onCorrect }: QuizStepProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [excludeId, setExcludeId] = useState<string | null>(null);
  const [fetchCounter, setFetchCounter] = useState(() => Date.now());

  const { data: question, isLoading, isError } = useQuery<QuizQuestion>({
    queryKey: ["/api/terminal-quiz/random", fetchCounter],
    queryFn: async () => {
      const url = excludeId
        ? `/api/terminal-quiz/random?exclude=${excludeId}`
        : "/api/terminal-quiz/random";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("No questions");
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer }: { questionId: string; selectedAnswer: number }) => {
      const res = await apiRequest("POST", "/api/terminal-quiz/verify", { questionId, selectedAnswer });
      return res.json() as Promise<{ isCorrect: boolean }>;
    },
    onSuccess: (data) => {
      if (data.isCorrect) {
        setResult('correct');
        setTimeout(() => onCorrect(), 1000);
      } else {
        setResult('wrong');
      }
    },
  });

  const handleSelect = (num: number) => {
    if (result === 'correct' || verifyMutation.isPending) return;
    setSelectedAnswer(num);
    setResult(null);
    verifyMutation.mutate({ questionId: question!.id, selectedAnswer: num });
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setResult(null);
    if (question) setExcludeId(question.id);
    setFetchCounter(c => c + 1);
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !question) {
    onCorrect();
    return null;
  }

  const answers = [
    { num: 1, text: question.answer1 },
    { num: 2, text: question.answer2 },
    { num: 3, text: question.answer3 },
  ];

  return (
    <Card className="shadow-sm border border-gray-200 w-full">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center mb-6">
          <div className="step-indicator mr-3">
            <HelpCircle size={16} />
          </div>
          <h2 className="text-xl font-medium">Terminal Quiz</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Beantworte die folgende Frage richtig, um fortzufahren.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-base font-semibold text-blue-900 leading-relaxed">
            {question.question}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {answers.map((answer) => {
            const isSelected = selectedAnswer === answer.num;
            const isWrong = isSelected && result === 'wrong';
            const isCorrectResult = isSelected && result === 'correct';

            const isBlocked = verifyMutation.isPending || result === 'correct';

            let inlineStyle: React.CSSProperties = {};
            if (isCorrectResult) {
              inlineStyle = { backgroundColor: '#f0fdf4', borderColor: '#22c55e', color: '#166534' };
            } else if (isWrong) {
              inlineStyle = { backgroundColor: '#fef2f2', borderColor: '#ef4444', color: '#991b1b' };
            } else if (isSelected) {
              inlineStyle = { backgroundColor: '#dbeafe', borderColor: '#3b82f6', color: '#1e3a8a' };
            }

            return (
              <Button
                key={answer.num}
                variant="outline"
                className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal${isBlocked ? ' pointer-events-none' : ''}`}
                style={inlineStyle}
                onClick={() => handleSelect(answer.num)}
              >
                <span className="flex items-center gap-3 w-full">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                    {answer.num}
                  </span>
                  <span className="flex-1">{answer.text}</span>
                  {isCorrectResult && <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-600" />}
                  {isWrong && <XCircle className="flex-shrink-0 w-5 h-5 text-red-500" />}
                  {isSelected && verifyMutation.isPending && <Loader2 className="flex-shrink-0 w-5 h-5 animate-spin" />}
                </span>
              </Button>
            );
          })}
        </div>

        {result === 'correct' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Richtig! Du wirst weitergeleitet…</span>
          </div>
        )}

        {result === 'wrong' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Falsch! Bitte versuche es erneut.</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Neue Frage versuchen
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          onClick={goBack}
          className="mt-4 w-full"
        >
          ← Zurück
        </Button>
      </CardContent>
    </Card>
  );
}
