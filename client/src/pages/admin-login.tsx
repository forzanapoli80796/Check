import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";
import AppLogo from "@/components/app-logo";
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
      setError("Ungültiger Code. Bitte versuche es erneut.");
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Logo Header - Mobile optimized */}
      <div className="flex justify-center py-4 sm:py-6">
        <AppLogo asLink imgClassName="h-14 sm:h-16 object-contain" />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-3 sm:px-4">
        <div className="max-w-md w-full mx-auto">
          <Card className="shadow-lg border border-gray-100">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-medium text-center mb-6">Admin-Code eingeben</h2>
              <div className="space-y-4">
                <Input
                  type="password"
                  name="forzacheck-admin"
                  autoComplete="off"
                  placeholder="Code eingeben"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(e as any); } }}
                  className="w-full"
                />
                <Button 
                  type="button"
                  onClick={handleSubmit as any}
                  className="w-full" 
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? "Überprüfung..." : "Bestätigen"}
                </Button>
              </div>
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
