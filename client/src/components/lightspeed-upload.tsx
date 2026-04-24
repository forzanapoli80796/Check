import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STORES = ["JP23", "KP5", "TS17"] as const;
type Store = typeof STORES[number];

// Match group name extracted BEFORE any parenthesis, e.g. "Pizza(123)" → "Pizza"
const VALID_GROUPS = new Set(["Pizza", "Panuozzo", "Rollini", "Pizza Team", "Ausschuss"]);

// Sales weekday (1-7) → Production weekday (1-7), always 2 days before
// Mo(1)→Sa(6), Di(2)→So(7), Mi(3)→Mo(1), Do(4)→Di(2), Fr(5)→Mi(3), Sa(6)→Do(4), So(7)→Fr(5)
function productionWeekday(salesWeekday: number): number {
  return ((salesWeekday - 3 + 7) % 7) + 1;
}

const WEEKDAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

interface DayResult {
  salesWeekday: number;   // 1=Mo … 7=So (sales day)
  prodWeekday: number;    // 1=Mo … 7=So (production day = 2 days before)
  label: string;          // short label of sales day
  prodLabel: string;      // short label of production day
  weeklyValues: (number | null)[];
  median: number;
  produktion: number;
}

interface AnalysisResult {
  store: Store;
  kwLabels: string[];
  days: DayResult[];
}

const WEEKDAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]; // 0=Mo … 6=So

// ── CSV parser (handles quoted fields with commas inside) ──────────────────
function parseLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if ((ch === "," || ch === ";") && !inQuote) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length < 2) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

// ── Date parsing: DD.MM.YY or DD.MM.YYYY (with optional time) ────────────
function parseDate(str: string): Date | null {
  if (!str) return null;
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (m) {
    let year = parseInt(m[3]);
    if (year < 100) year += 2000;
    return new Date(year, parseInt(m[2]) - 1, parseInt(m[1]));
  }
  const m2 = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(parseInt(m2[1]), parseInt(m2[2]) - 1, parseInt(m2[3]));
  return null;
}

// ── Calendar week (ISO) ───────────────────────────────────────────────────
function getISOWeek(date: Date): { kw: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const kw = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { kw, year: d.getUTCFullYear() };
}

function getWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7; // 0=Mo … 6=So
}

// ── Find column (exact first, then partial) ───────────────────────────────
function findCol(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.includes(c)) return c;
  }
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

// ── Median ────────────────────────────────────────────────────────────────
function calcMedian(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function roundProduktion(value: number): number {
  if (value <= 0) return 0;
  return Math.round(value / 5) * 5;
}

// ── Core analysis ─────────────────────────────────────────────────────────
function analyzeCSV(text: string, selectedStore: Store): AnalysisResult | string {
  const rows = parseCSV(text);
  if (!rows.length) return "CSV konnte nicht gelesen werden.";

  const headers = Object.keys(rows[0]);
  const datumCol  = findCol(headers, ["Datum", "Date", "Datum/Uhrzeit", "Transaktionsdatum"]);
  const gruppeCol = findCol(headers, ["Gruppe", "Group", "Warengruppe"]);
  const mngCol    = findCol(headers, ["Mng", "Menge", "Quantity", "Anzahl"]);
  const geraeteCol = findCol(headers, ["Geräte_Name", "Geraete_Name", "Gerät", "Device", "Store", "Geräte Name"]);

  const missing: string[] = [];
  if (!datumCol)  missing.push("Datum");
  if (!gruppeCol) missing.push("Gruppe");
  if (!mngCol)    missing.push("Mng");

  if (missing.length) {
    return (
      `Spalten nicht gefunden: ${missing.join(", ")}.\n` +
      `Gefundene Spalten: ${headers.slice(0, 12).join(", ")}${headers.length > 12 ? " …" : ""}`
    );
  }

  // weekKey → weekdayIndex → total
  const weekMap = new Map<string, Map<number, number>>();

  for (const row of rows) {
    // Filter by store if device column exists
    if (geraeteCol && row[geraeteCol]) {
      if (!row[geraeteCol].includes(selectedStore)) continue;
    }

    // Extract group name before any parenthesis: "Pizza(123)" → "Pizza"
    const gruppeRaw  = (row[gruppeCol!] ?? "").trim();
    const gruppeName = gruppeRaw.split("(")[0].trim();
    if (!VALID_GROUPS.has(gruppeName)) continue;

    const date = parseDate((row[datumCol!] ?? "").trim());
    if (!date) continue;

    const weekdayIdx = getWeekdayIndex(date); // 0=Mo … 6=So

    // TS17: ignore Monday
    if (selectedStore === "TS17" && weekdayIdx === 0) continue;

    const mngStr = (row[mngCol!] ?? "0").replace(",", ".").trim();
    const mng = parseFloat(mngStr);
    if (!mng || mng <= 0) continue;

    const { kw, year } = getISOWeek(date);
    const weekKey = `${year}-W${String(kw).padStart(2, "0")}`;
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map());
    const dayMap = weekMap.get(weekKey)!;
    dayMap.set(weekdayIdx, (dayMap.get(weekdayIdx) ?? 0) + mng);
  }

  if (!weekMap.size) {
    return (
      `Keine passenden Transaktionsdaten gefunden für Store "${selectedStore}".\n` +
      `Prüfe ob der Store korrekt ausgewählt wurde und ob Gruppen (Pizza, Panuozzo, Rollini, Pizza Team, Ausschuss) vorhanden sind.`
    );
  }

  // Last 5 valid weeks
  const isValidWeek = (key: string): boolean => {
    const dayMap = weekMap.get(key)!;
    const checkDays = selectedStore === "TS17" ? [1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
    return checkDays.some(d => dayMap.has(d));
  };

  const validWeeks = Array.from(weekMap.keys())
    .sort()
    .reverse()
    .filter(isValidWeek)
    .slice(0, 5)
    .reverse();

  if (!validWeeks.length) return "Keine vollständigen Wochen gefunden.";

  const kwLabels = validWeeks.map(k => {
    const m = k.match(/(\d{4})-W(\d+)/);
    return m ? `KW ${parseInt(m[2])}` : k;
  });

  const dayIndices = selectedStore === "TS17"
    ? [1, 2, 3, 4, 5, 6]    // Di–So
    : [0, 1, 2, 3, 4, 5, 6]; // Mo–So

  const days: DayResult[] = dayIndices.map(idx => {
    const weeklyValues: (number | null)[] = validWeeks.map(weekKey => {
      const v = weekMap.get(weekKey)?.get(idx);
      return v != null ? Math.round(v) : null;
    });
    const presentValues = weeklyValues.filter(v => v !== null) as number[];
    const med = calcMedian(presentValues);
    const sw = idx + 1; // sales weekday 1-7
    const pw = productionWeekday(sw);
    return {
      salesWeekday: sw,
      prodWeekday: pw,
      label: WEEKDAY_NAMES[idx],
      prodLabel: WEEKDAY_NAMES[pw - 1],
      weeklyValues,
      median: Math.round(med),
      produktion: roundProduktion(med * 1.12),
    };
  });

  return { store: selectedStore, kwLabels, days };
}

// ── Component ─────────────────────────────────────────────────────────────
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
      const analysis = analyzeCSV(text, selectedStore);
      if (typeof analysis === "string") {
        setError(analysis);
      } else {
        setResult(analysis);
      }
    } catch {
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
          // Save using PRODUCTION weekday (2 days before the sales day)
          await saveMutation.mutateAsync({ weekday: day.prodWeekday, store: result.store, kugelMenge: day.produktion });
          successCount++;
        } catch { /* continue */ }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/teig-production"] });
    toast({
      title: "Teig-Planung übernommen",
      description: `${successCount} Produktionstage für ${result.store} wurden übertragen.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload size={18} />
            Lightspeed CSV analysieren
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Lade einen Lightspeed-Transaktionsexport der letzten 5 Wochen hoch. Median + PRODUKTION werden automatisch berechnet.
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
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
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
                <p className="text-sm text-gray-500">Analysiere …</p>
              </div>
            ) : fileName && !error ? (
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

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={20} />
                <CardTitle className="text-base">Auswertung – {result.store}</CardTitle>
              </div>
              <Button
                onClick={handleImport}
                disabled={saveMutation.isPending}
                className="bg-black hover:bg-gray-800 text-white text-sm"
              >
                {saveMutation.isPending
                  ? <Loader2 className="animate-spin mr-2" size={14} />
                  : <ArrowRight className="mr-2" size={14} />}
                In Teig-Planung übernehmen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Production schedule summary */}
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1.5">Produktionsplan – Kugeln werden 2 Tage vor Verkauf produziert:</p>
              <div className="flex flex-wrap gap-2">
                {result.days.map(d => (
                  <div key={d.label} className="flex items-center gap-1 text-xs bg-white border border-amber-200 rounded px-2 py-1">
                    <span className="font-bold text-amber-700">{d.prodLabel}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-600">{d.produktion} Kugeln für {WEEKDAY_FULL[d.salesWeekday - 1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left font-semibold">Verkaufstag</th>
                    {result.days.map(d => (
                      <th key={d.label} className="border border-gray-200 p-2 text-right font-semibold min-w-[52px]">
                        {d.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="border border-gray-200 p-2 text-xs text-amber-700 font-medium">Produzieren am</td>
                    {result.days.map(d => (
                      <td key={d.label} className="border border-gray-200 p-2 text-right text-xs text-amber-700 font-semibold">
                        {d.prodLabel}
                      </td>
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
                  <tr className="bg-blue-50 italic">
                    <td className="border border-gray-200 p-2 text-blue-700 font-medium">Median</td>
                    {result.days.map(d => (
                      <td key={d.label} className="border border-gray-200 p-2 text-right text-blue-700 tabular-nums">
                        {d.median}
                      </td>
                    ))}
                  </tr>
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
              PRODUKTION = Median +12 % · auf 5er gerundet · wird im Produktionstag gespeichert (−2 Tage){result.store === "TS17" ? " · ohne Montag" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
