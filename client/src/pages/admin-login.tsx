import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
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
      {/* Logo zentriert oben */}
      <div className="text-center py-6">
        <img 
          src="/attached_assets/FORZACHECK1_black_1753816621910.png" 
          alt="ForzaCheck Logo" 
          className="max-h-40 max-w-full mx-auto object-contain"
        />
      </div>
      
      {/* Zurück Button */}
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Zurück zur Startseite
        </Button>
      </div>
      <div className="flex items-center justify-center px-4 pt-8">
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
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Überprüfung..." : "Bestätigen"}
            </Button>
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
