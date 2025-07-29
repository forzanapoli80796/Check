import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Checklist } from "@shared/schema";
import { AREA_LABELS } from "@/lib/types";

export default function BetriebsleiterDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentChecklists, isLoading: checklistsLoading } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  // Get today's checklists for recent activity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayChecklists = recentChecklists?.filter(checklist => {
    const submittedDate = new Date(checklist.submittedAt!);
    return submittedDate >= today;
  }).slice(0, 5) || [];

  return (
    <div>
      <Card className="shadow-md mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-medium mb-6">Betriebsleiter Dashboard</h2>
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Heutige Checklisten</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">{stats?.todayCompleted || 0}</p>
                  )}
                </div>
                <ClipboardCheck className="text-primary" size={24} />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Abschlussrate</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-secondary">{stats?.completionRate || 0}%</p>
                  )}
                </div>
                <TrendingUp className="text-secondary" size={24} />
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Offene Aufgaben</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-accent">{stats?.pendingTasks || 0}</p>
                  )}
                </div>
                <AlertTriangle className="text-accent" size={24} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-medium mb-4">Aktuelle Aktivitäten</h3>
            <div className="space-y-3">
              {checklistsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : todayChecklists.length > 0 ? (
                todayChecklists.map((checklist) => (
                  <div key={checklist.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {checklist.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {checklist.employeeName} hat {AREA_LABELS[checklist.area as keyof typeof AREA_LABELS]}-Checkliste abgeschlossen
                      </p>
                      <p className="text-xs text-gray-500">
                        {checklist.store} • {format(new Date(checklist.submittedAt!), "HH:mm", { locale: de })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Vollständig
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Keine Aktivitäten heute gefunden.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
