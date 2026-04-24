import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STORES = ["JP23", "KP5", "TS17"] as const;
type Store = typeof STORES[number];

const VALID_GROUPS = new Set(["Pizza", "Panuozzo", "Rollini", "Pizza Team", "Ausschuss"]);

interface DayResult {
  weekday: number; // 1=Mo, 2=Di, ..., 7=So
  label: string;
  weeklyValues: (number | null)[]; // 5 values, one per KW
  median: number;
  produktion: number;
}

interface AnalysisResult {
  store: Store;
  detectedStore: string;
  kwLabels: string[];
  days: DayResult[];
}

const WEEKDAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
// weekday index 0=Mo...6=So

function getISOWeek(date: Date): { kw: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const kw = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { kw, year: d.getUTCFullYear() };
}

function getWeekdayIndex(date: Date): number {
  // 0=Mo, 6=So
  return (date.getDay() + 6) % 7;
}

function parseGermanDate(str: string): Date | null {
  if (!str) return null;
  // Try DD.MM.YYYY or DD.MM.YYYY HH:MM
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  // Try YYYY-MM-DD
  const m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(parseInt(m2[1]), parseInt(m2[2]) - 1, parseInt(m2[3]));
  return null;
}

function parseCSV(text: string): Record<string, string>[] {
  // Detect delimiter
  const firstLine = text.split("\n")[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""));
    if (cells.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

function findCol(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  // Partial match
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function roundProduktion(value: number): number {
  if (value <= 0) return 0;
  // Round to nearest 5
  return Math.round(value / 5) * 5;
}

function analyzeCSV(text: string, selectedStore: Store): AnalysisResult | null {
  const rows = parseCSV(text);
  if (!rows.length) return null;

  const headers = Object.keys(rows[0]);
  const datumCol = findCol(headers, ["Datum", "Date", "Datum/Uhrzeit", "Transaktionsdatum"]);
  const gruppeCol = findCol(headers, ["Gruppe", "Group", "Warengruppe"]);
  const mngCol = findCol(headers, ["Mng", "Menge", "Quantity", "Anzahl"]);
  const geraeteCol = findCol(headers, ["Geräte_Name", "Geraete_Name", "Gerät", "Device", "Store", "Filiale", "Geräte Name"]);

  if (!datumCol || !gruppeCol || !mngCol) return null;

  // Build map: weekKey -> weekdayIndex -> total
  const weekMap: Map<string, Map<number, number>> = new Map();
  let detectedStore = selectedStore;

  for (const row of rows) {
    const gruppe = row[gruppeCol]?.trim();
    if (!VALID_GROUPS.has(gruppe)) continue;

    const dateStr = row[datumCol]?.trim();
    const date = parseGermanDate(dateStr);
    if (!date) continue;

    const weekdayIdx = getWeekdayIndex(date); // 0=Mo, 6=So
    const { kw, year } = getISOWeek(date);

    // TS17: ignore Monday (weekdayIdx === 0)
    if (selectedStore === "TS17" && weekdayIdx === 0) continue;

    // Parse quantity (handle German comma decimals)
    const mngStr = row[mngCol]?.replace(",", ".").trim() ?? "0";
    const mng = parseFloat(mngStr) || 0;
    if (mng <= 0) continue;

    // Detect store from data if column exists
    if (geraeteCol && row[geraeteCol]) {
      const gs = row[geraeteCol].trim();
      if (gs) detectedStore = gs as Store;
    }

    const weekKey = `${year}-W${String(kw).padStart(2, "0")}`;
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map());
    const dayMap = weekMap.get(weekKey)!;
    dayMap.set(weekdayIdx, (dayMap.get(weekdayIdx) ?? 0) + mng);
  }

  if (!weekMap.size) return null;

  // Sort weeks descending and pick last 5 valid
  const allWeeks = Array.from(weekMap.keys()).sort().reverse();

  const isValidWeek = (key: string): boolean => {
    const dayMap = weekMap.get(key)!;
    if (selectedStore === "TS17") {
      // Valid if has Di–So: indices 1-6
      return [1, 2, 3, 4, 5, 6].some(d => dayMap.has(d));
    } else {
      // Valid if has Mo–So: indices 0-6
      return [0, 1, 2, 3, 4, 5, 6].some(d => dayMap.has(d));
    }
  };

  const validWeeks = allWeeks.filter(isValidWeek).slice(0, 5).reverse();
  if (!validWeeks.length) return null;

  // Parse KW labels
  const kwLabels = validWeeks.map(k => {
    const m = k.match(/(\d{4})-W(\d+)/);
    return m ? `KW ${parseInt(m[2])}` : k;
  });

  // Determine which weekday indices to include
  const dayIndices = selectedStore === "TS17"
    ? [1, 2, 3, 4, 5, 6]   // Di–So
    : [0, 1, 2, 3, 4, 5, 6]; // Mo–So

  const days: DayResult[] = dayIndices.map(idx => {
    const weeklyValues: (number | null)[] = validWeeks.map(weekKey => {
      const dayMap = weekMap.get(weekKey);
      return dayMap?.get(idx) ?? null;
    });

    const presentValues = weeklyValues.filter(v => v !== null) as number[];
    const med = median(presentValues);
    const produktion = roundProduktion(med * 1.12);

    return {
      weekday: idx + 1, // 1=Mo...7=So
      label: WEEKDAY_NAMES[idx],
      weeklyValues,
      median: Math.round(med),
      produktion,
    };
  });

  return { store: selectedStore, detectedStore, kwLabels, days };
}

export default function LightspeedUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStore, setSelectedStore] = useState<Store>("JP23");
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async ({ weekday, store, kugelMenge }: { weekday: number; store: string; kugelMenge: number }) => {
      const response = await apiRequest("PUT", "/api/teig-production", { weekday, store, kugelMenge });
      return response.json();
    },
  });

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      if (!text.trim()) {
        setError("Die Datei ist leer. Bitte lade eine gültige Lightspeed CSV-Datei hoch.");
        setIsProcessing(false);
        return;
      }

      // Show detected columns for debugging
      const rows = parseCSV(text);
      if (!rows.length) {
        setError("Die CSV-Datei konnte nicht gelesen werden. Prüfe ob die Datei korrekt exportiert wurde.");
        setIsProcessing(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const datumCol = findCol(headers, ["Datum", "Date", "Datum/Uhrzeit", "Transaktionsdatum"]);
      const gruppeCol = findCol(headers, ["Gruppe", "Group", "Warengruppe"]);
      const mngCol = findCol(headers, ["Mng", "Menge", "Quantity", "Anzahl"]);

      const missing: string[] = [];
      if (!datumCol) missing.push("Datum");
      if (!gruppeCol) missing.push("Gruppe");
      if (!mngCol) missing.push("Mng");

      if (missing.length > 0) {
        setError(
          `Spalten nicht gefunden: ${missing.join(", ")}.\n` +
          `Gefundene Spalten: ${headers.slice(0, 10).join(", ")}${headers.length > 10 ? " ..." : ""}`
        );
        setIsProcessing(false);
        return;
      }

      const analysis = analyzeCSV(text, selectedStore);
      if (!analysis) {
        setError(
          `Keine passenden Transaktionsdaten gefunden. Prüfe ob die Gruppen (Pizza, Panuozzo, Rollini, Pizza Team, Ausschuss) vorhanden sind und ob die letzten 5 Wochen Daten enthalten.`
        );
      } else {
        setResult(analysis);
      }
    } catch (e) {
      setError("Fehler beim Lesen der Datei. Bitte stelle sicher, dass es sich um eine CSV-Datei handelt.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedStore]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!result) return;
    let successCount = 0;
    for (const day of result.days) {
      if (day.produktion > 0) {
        try {
          await saveMutation.mutateAsync({
            weekday: day.weekday,
            store: result.store,
            kugelMenge: day.produktion,
          });
          successCount++;
        } catch (e) {
          // continue
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/teig-production"] });
    toast({
      title: "Teig-Planung übernommen",
      description: `${successCount} Werte für ${result.store} wurden erfolgreich in die Teig-Planung übertragen.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Store Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={18} />
            Lightspeed CSV analysieren
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Lade eine CSV-Datei mit den Transaktionen der letzten 5 Wochen hoch. Die Auswertung berechnet automatisch Median und Produktionsmenge.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Store picker */}
          <div>
            <p className="text-sm font-medium mb-2">Store auswählen</p>
            <div className="flex gap-2">
              {STORES.map(s => (
                <button
                  key={s}
                  onClick={() => { setSelectedStore(s); setResult(null); setError(null); setFileName(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    selectedStore === s
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileInput} />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-gray-500" size={28} />
                <p className="text-sm text-gray-500">Analysiere...</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="text-green-500" size={28} />
                <p className="text-sm font-medium text-gray-700">{fileName}</p>
                <p className="text-xs text-gray-400">Andere Datei hochladen</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="text-gray-400" size={28} />
                <p className="text-sm font-medium text-gray-700">CSV-Datei hier ablegen oder klicken</p>
                <p className="text-xs text-gray-400">Lightspeed Transaktionsexport (.csv)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={20} />
                <CardTitle className="text-base">Auswertung – {result.store}</CardTitle>
                {result.detectedStore !== result.store && (
                  <Badge variant="outline" className="text-xs">Erkannt: {result.detectedStore}</Badge>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={saveMutation.isPending}
                className="bg-black hover:bg-gray-800 text-white text-sm"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={14} />
                ) : (
                  <ArrowRight className="mr-2" size={14} />
                )}
                In Teig-Planung übernehmen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left font-semibold">Woche</th>
                    {result.days.map(d => (
                      <th key={d.label} className="border border-gray-200 p-2 text-right font-semibold min-w-[50px]">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.kwLabels.map((kw, wIdx) => (
                    <tr key={kw} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 font-medium text-gray-600">{kw}</td>
                      {result.days.map(d => (
                        <td key={d.label} className="border border-gray-200 p-2 text-right tabular-nums">
                          {d.weeklyValues[wIdx] !== null ? d.weeklyValues[wIdx] : "–"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Median row */}
                  <tr className="bg-blue-50 italic">
                    <td className="border border-gray-200 p-2 text-blue-700 font-medium">Median</td>
                    {result.days.map(d => (
                      <td key={d.label} className="border border-gray-200 p-2 text-right text-blue-700 tabular-nums">
                        {d.median}
                      </td>
                    ))}
                  </tr>
                  {/* PRODUKTION row */}
                  <tr className="bg-green-50 font-bold">
                    <td className="border border-gray-200 p-2 text-green-800">PRODUKTION</td>
                    {result.days.map(d => (
                      <td key={d.label} className="border border-gray-200 p-2 text-right text-green-800 tabular-nums">
                        {d.produktion}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              PRODUKTION = Median + 12 % · auf 5er gerundet · {result.store === "TS17" ? "ohne Montag" : "inkl. Montag"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
