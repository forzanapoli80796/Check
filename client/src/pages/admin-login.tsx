import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";


export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async (adminCode: string) => {
      const response = await apiRequest("POST", "/api/admin/verify", { code: adminCode });
      return response.json();
    },
    onSuccess: () => {
      navigate("/admin");
    },
    onError: () => {
      setError("Ungültiger Code. Bitte versuchen Sie es erneut.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    verifyMutation.mutate(code);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full mx-auto">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="pt-6">
          <h2 className="text-2xl font-medium text-center mb-6">Admin-Code eingeben</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Code eingeben"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full"
            />
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? "Überprüfung..." : "Bestätigen"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
              >
                Zurück
              </Button>
            </div>
          </form>
          {error && (
            <Alert className="mt-4 border-destructive">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
