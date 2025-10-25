import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DevTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dev Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Entwickler-Werkzeuge werden hier angezeigt.</p>
        </CardContent>
      </Card>
    </div>
  );
}
