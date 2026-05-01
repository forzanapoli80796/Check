import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface MissingEntry {
  categoryId: string;
  categoryName: string;
  store: string;
  shiftType: string;
}

interface MissingChecklistsResponse {
  date: string;
  totalMissing: number;
  missing: MissingEntry[];
  submittedCount: number;
}

const SHIFT_LABELS: Record<string, string> = {
  frühschicht_schichtanfang: "Frühschicht – Anfang",
  frühschicht_schichtende: "Frühschicht – Ende",
  spätschicht_schichtanfang: "Spätschicht – Anfang",
  spätschicht_schichtende: "Spätschicht – Ende",
  keine_schicht: "Einfache Checkliste",
};

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function MissingChecklists() {
  const [expanded, setExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getYesterday());

  const { data, isLoading } = useQuery<MissingChecklistsResponse>({
    queryKey: ["/api/missing-checklists", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/missing-checklists?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  // Day-restricted categories – only count as missing on their designated weekday.
  // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const DAY_RESTRICTED: Record<string, number> = {
    "Montagliste": 1,
    "Mittwochsliste": 3,
    "Sonder/Samstagsreinigung": 6,
  };

  // Categories that should never appear as missing
  const NEVER_MISSING = new Set(["INVENTUR/NON-FOOD"]);

  const selectedDayOfWeek = new Date(selectedDate + "T12:00:00").getDay();

  const filteredMissing = data
    ? data.missing.filter((entry) => {
        if (NEVER_MISSING.has(entry.categoryName)) return false;
        const restrictedDay = DAY_RESTRICTED[entry.categoryName];
        if (restrictedDay !== undefined && restrictedDay !== selectedDayOfWeek) return false;
        return true;
      })
    : [];

  const grouped = filteredMissing.reduce<Record<string, MissingEntry[]>>((acc, entry) => {
    const key = entry.categoryName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const hasMissing = filteredMissing.length > 0;

  return (
    <Card className={`mb-4 border-2 ${hasMissing ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {hasMissing ? (
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
            ) : (
              <CheckCircle2 className="text-green-500 shrink-0" size={20} />
            )}
            <CardTitle className="text-base font-semibold">
              Fehlende Checklisten
              {data && (
                <span className={`ml-2 text-sm font-normal ${hasMissing ? "text-red-600" : "text-green-600"}`}>
                  {hasMissing
                    ? `${filteredMissing.length} fehlend`
                    : "Alle vollständig"}
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar size={14} />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 w-36 text-xs px-2"
                max={getYesterday()}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 px-4 pb-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ) : data && hasMissing ? (
            <>
              <p className="text-xs text-gray-500 mb-3">
                {formatDate(selectedDate)} – {data.submittedCount} eingereicht, {filteredMissing.length} fehlend
              </p>
              <div className="space-y-3">
                {Object.entries(grouped).map(([categoryName, entries]) => (
                  <div key={categoryName}>
                    <p className="text-sm font-semibold text-gray-800 mb-1">{categoryName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {entries.map((entry, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs bg-white border-red-300 text-red-700 font-normal"
                        >
                          <span className="font-semibold mr-1">{entry.store}</span>
                          {SHIFT_LABELS[entry.shiftType] || entry.shiftType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : data ? (
            <p className="text-sm text-green-700">
              Alle erwarteten Checklisten wurden am {formatDate(selectedDate)} eingereicht.
            </p>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
