import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Info, ShieldAlert } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ── Types for the upcoming-week-info endpoint ──────────────────────────────
interface HolidayEntry { name: string; datum: string; }
interface BayernGame  { competition: string; date: string; opponent: string; }
interface WeatherDay  {
  date: string; tempMax: number; tempMin: number;
  precipMm: number; windKmh: number;
  icon: string; label: string; prognosis: string;
}
interface UpcomingWeekInfo {
  weekRange: { from: string; to: string };
  holidays: HolidayEntry[];
  bayernHomeGames: BayernGame[];
  weather: WeatherDay[];
}

// Format ISO date "2026-04-28" → "Di, 28.04."
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const wd = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(`${y}-${m}-${d}T12:00:00`).getDay()];
  return `${wd}, ${d}.${m}.`;
}

const STORES = ["JP23", "KP5", "TS17"] as const;
type Store = typeof STORES[number];

// Match group name extracted BEFORE any parenthesis, e.g. "Pizza(123)" → "Pizza"
// "Ausschuss" is intentionally excluded – it represents waste and must not count toward production
const VALID_GROUPS = new Set(["Pizza", "Panuozzo", "Rollini", "Pizza Team"]);

// Sales weekday (1-7) → Production weekday (1-7), always 2 days before
// Mo(1)→Sa(6), Di(2)→So(7), Mi(3)→Mo(1), Do(4)→Di(2), Fr(5)→Mi(3), Sa(6)→Do(4), So(7)→Fr(5)
function productionWeekday(salesWeekday: number): number {
  return ((salesWeekday - 3 + 7) % 7) + 1;
}

const WEEKDAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

interface StoreDay {
  store: Store;
  weeklyValues: (number | null)[];  // per-KW sales for this store+weekday
  median: number;
  produktion: number; // median + 10%, rounded to nearest 5 → saved to this store's teig-entry
}

interface DayResult {
  salesWeekday: number;   // 1=Mo … 7=So (sales day)
  prodWeekday: number;    // 1=Mo … 7=So (production day = 2 days before)
  label: string;          // short label of sales day
  prodLabel: string;      // short label of production day
  combinedWeeklyValues: (number | null)[]; // sum across all stores per KW
  storeData: StoreDay[];                   // per-store breakdown
  totalProduktion: number;                 // sum of all stores' produktion (Mindestbedarf GESAMT)
}

interface AnalysisResult {
  detectedStores: Store[];
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

// ── Core analysis ─────────────────────────────────────────────────────────
// Analyses ALL stores present in the CSV simultaneously.
// Mindestbedarf = Median + 10 %, rounded to the nearest 5 (economical rounding).
// Machine plan optimisation is intentionally NOT done here – it belongs in Planung.
function analyzeCSV(text: string): AnalysisResult | string {
  const rows = parseCSV(text);
  if (!rows.length) return "CSV konnte nicht gelesen werden.";

  const headers = Object.keys(rows[0]);
  const datumCol   = findCol(headers, ["Datum", "Date", "Datum/Uhrzeit", "Transaktionsdatum"]);
  const gruppeCol  = findCol(headers, ["Gruppe", "Group", "Warengruppe"]);
  const mngCol     = findCol(headers, ["Mng", "Menge", "Quantity", "Anzahl"]);
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

  // Determine current ISO week key – to EXCLUDE the incomplete current week
  const { kw: todayKw, year: todayYear } = getISOWeek(new Date());
  const currentWeekKey = `${todayYear}-W${String(todayKw).padStart(2, "0")}`;

  // store → weekKey → weekdayIndex → total
  const storeWeekMap = new Map<Store, Map<string, Map<number, number>>>();

  for (const row of rows) {
    // Detect store from device column
    let rowStore: Store | null = null;
    if (geraeteCol && row[geraeteCol]) {
      const dev = row[geraeteCol];
      for (const s of STORES) {
        if (dev.includes(s)) { rowStore = s; break; }
      }
    }
    // If no device column found, cannot split by store → skip
    if (!rowStore) continue;

    // Extract group name before parenthesis: "Pizza(123)" → "Pizza"
    const gruppeRaw  = (row[gruppeCol!] ?? "").trim();
    const gruppeName = gruppeRaw.split("(")[0].trim();
    if (!VALID_GROUPS.has(gruppeName)) continue;

    const date = parseDate((row[datumCol!] ?? "").trim());
    if (!date) continue;

    const weekdayIdx = getWeekdayIndex(date); // 0=Mo … 6=So

    // TS17: no Monday sales
    if (rowStore === "TS17" && weekdayIdx === 0) continue;

    const mngStr = (row[mngCol!] ?? "0").replace(",", ".").trim();
    const mng = parseFloat(mngStr);
    if (!mng || mng <= 0) continue;

    const { kw, year } = getISOWeek(date);
    const weekKey = `${year}-W${String(kw).padStart(2, "0")}`;

    // Skip the current (incomplete) week
    if (weekKey === currentWeekKey) continue;

    if (!storeWeekMap.has(rowStore)) storeWeekMap.set(rowStore, new Map());
    const weekMap = storeWeekMap.get(rowStore)!;
    if (!weekMap.has(weekKey)) weekMap.set(weekKey, new Map());
    const dayMap = weekMap.get(weekKey)!;
    dayMap.set(weekdayIdx, (dayMap.get(weekdayIdx) ?? 0) + mng);
  }

  const detectedStores = STORES.filter(s => storeWeekMap.has(s));
  if (!detectedStores.length) {
    return (
      `Keine passenden Transaktionsdaten gefunden.\n` +
      `Prüfe ob Gruppen (Pizza, Panuozzo, Rollini, Pizza Team, Ausschuss) und Store-Namen (${STORES.join(", ")}) in der CSV vorhanden sind.`
    );
  }

  // Per store: find its last 5 complete past weeks (at least some days have data)
  const storeValidWeeks = new Map<Store, string[]>();
  for (const store of detectedStores) {
    const weekMap = storeWeekMap.get(store)!;
    const weeks = Array.from(weekMap.keys())
      .sort()
      .reverse()
      .filter(k => weekMap.get(k)!.size > 0)
      .slice(0, 5)
      .reverse();
    storeValidWeeks.set(store, weeks);
  }

  // Use the union of all stores' week sets as the global KW list (last 5 of all available)
  const allWeekKeys = new Set<string>();
  storeValidWeeks.forEach(weeks => weeks.forEach(w => allWeekKeys.add(w)));
  const validWeeks = Array.from(allWeekKeys).sort().slice(-5);

  if (!validWeeks.length) return "Keine vollständigen Wochen gefunden.";

  const kwLabels = validWeeks.map(k => {
    const m = k.match(/(\d{4})-W(\d+)/);
    return m ? `KW ${parseInt(m[2])}` : k;
  });

  // Weekday indices to show: Mo–So (0–6) for all stores combined
  // (TS17 has no Monday data, that column just shows "–" for TS17)
  const dayIndices = [0, 1, 2, 3, 4, 5, 6];

  const days: DayResult[] = dayIndices
    .filter(idx => {
      // Only include a weekday if at least one store has data for it
      return detectedStores.some(store => {
        const weekMap = storeWeekMap.get(store)!;
        return validWeeks.some(wk => weekMap.get(wk)?.has(idx));
      });
    })
    .map(idx => {
      const sw = idx + 1;
      const pw = productionWeekday(sw);

      // Per-store breakdown
      const storeData: StoreDay[] = detectedStores.map(store => {
        const weekMap = storeWeekMap.get(store)!;
        const weeklyValues: (number | null)[] = validWeeks.map(weekKey => {
          const v = weekMap.get(weekKey)?.get(idx);
          return v != null ? Math.round(v) : null;
        });
        const presentValues = weeklyValues.filter(v => v !== null) as number[];
        const med = calcMedian(presentValues);
        // Mindestbedarf: Median + 10 %, then round to nearest 5 (economical)
        const produktion = Math.round(Math.ceil(med * 1.10) / 5) * 5;
        return {
          store,
          weeklyValues,
          median: Math.round(med),
          produktion,
        };
      });

      // Combined weekly values (sum across stores)
      const combinedWeeklyValues: (number | null)[] = validWeeks.map((_, wIdx) => {
        const vals = storeData.map(sd => sd.weeklyValues[wIdx]).filter(v => v !== null) as number[];
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
      });

      const totalProduktion = storeData.reduce((s, sd) => s + sd.produktion, 0);

      return {
        salesWeekday: sw,
        prodWeekday: pw,
        label: WEEKDAY_NAMES[idx],
        prodLabel: WEEKDAY_NAMES[pw - 1],
        combinedWeeklyValues,
        storeData,
        totalProduktion,
      };
    });

  return { detectedStores, kwLabels, days };
}

// ── Component ─────────────────────────────────────────────────────────────
export default function LightspeedUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem("lightspeed_last_result");
      return saved ? JSON.parse(saved) as AnalysisResult : null;
    } catch { return null; }
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persist the last successful result to localStorage so it survives page reloads
  useEffect(() => {
    if (result) {
      try { localStorage.setItem("lightspeed_last_result", JSON.stringify(result)); } catch {}
    }
  }, [result]);

  // Fetch upcoming week info (holidays + Bayern games) as soon as a result is available
  const weekInfoQuery = useQuery<UpcomingWeekInfo>({
    queryKey: ["/api/upcoming-week-info"],
    enabled: !!result,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

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
      const analysis = analyzeCSV(text);
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
  }, []);

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
      // Save each store's individual Mindestbedarf on the production weekday
      for (const sd of day.storeData) {
        if (sd.produktion > 0) {
          try {
            await saveMutation.mutateAsync({ weekday: day.prodWeekday, store: sd.store, kugelMenge: sd.produktion });
            successCount++;
          } catch { /* continue */ }
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/teig-production"] });
    toast({
      title: "Teig-Planung übernommen",
      description: `${successCount} Einträge für ${result.detectedStores.join(", ")} wurden übertragen.`,
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
                <CardTitle className="text-base">Auswertung – {result.detectedStores.join(" + ")} (kombiniert)</CardTitle>
              </div>
            </div>

          </CardHeader>
          <CardContent>
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
                  {/* Combined weekly history rows */}
                  {result.kwLabels.map((kw, wIdx) => (
                    <tr key={kw} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 font-medium text-gray-600">{kw}</td>
                      {result.days.map(d => (
                        <td key={d.label} className="border border-gray-200 p-2 text-right tabular-nums">
                          {d.combinedWeeklyValues[wIdx] !== null ? d.combinedWeeklyValues[wIdx] : "–"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Per-store Median rows */}
                  {result.detectedStores.map(store => (
                    <tr key={`median-${store}`} className="bg-blue-50 italic">
                      <td className="border border-gray-200 p-2 text-blue-700 font-medium">Median {store}</td>
                      {result.days.map(d => {
                        const sd = d.storeData.find(s => s.store === store);
                        return (
                          <td key={d.label} className="border border-gray-200 p-2 text-right text-blue-700 tabular-nums">
                            {sd ? sd.median : "–"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Per-store Mindestbedarf rows */}
                  {result.detectedStores.map(store => (
                    <tr key={`prod-${store}`} className="bg-green-50">
                      <td className="border border-gray-200 p-2 text-green-700 font-medium text-xs">Mindestbedarf {store}</td>
                      {result.days.map(d => {
                        const sd = d.storeData.find(s => s.store === store);
                        return (
                          <td key={d.label} className="border border-gray-200 p-2 text-right text-green-700 text-xs tabular-nums">
                            {sd ? sd.produktion : "–"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Combined total Mindestbedarf */}
                  <tr className="bg-green-100 font-bold border-t-2 border-green-300">
                    <td className="border border-gray-200 p-2 text-green-900">Mindestbedarf GESAMT</td>
                    {result.days.map(d => (
                      <td key={d.label} className="border border-gray-200 p-2 text-right text-green-900 tabular-nums">
                        {d.totalProduktion}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              KW-Zeilen = kombinierte Verkaufsmenge aller Stores · Mindestbedarf = Median +10 %, gerundet auf ±5 · Produktionstag = −2 Tage · Maschinenoptimierung erfolgt in der Planung{result.detectedStores.includes("TS17") && result.detectedStores.length === 1 ? " · ohne Montag" : ""}
            </p>

            {/* Import button */}
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleImport}
                disabled={saveMutation.isPending || weekInfoQuery.isLoading}
                className="bg-black hover:bg-gray-800 text-white text-sm"
              >
                {saveMutation.isPending
                  ? <Loader2 className="animate-spin mr-2" size={14} />
                  : <ArrowRight className="mr-2" size={14} />}
                In Teig-Planung übernehmen
              </Button>
            </div>

            {/* ── Upcoming-week info box ─────────────────────────── */}
            <div className="mt-4">
              {weekInfoQuery.isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Loader2 className="animate-spin" size={15} />
                  <span>KI analysiert kommende Woche auf Feiertage &amp; Bayern-Heimspiele …</span>
                </div>
              )}
              {weekInfoQuery.isError && (
                <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Info size={15} />
                  <span>Wocheninfos konnten nicht geladen werden.</span>
                </div>
              )}
              {weekInfoQuery.data && (() => {
                const info = weekInfoQuery.data;
                const hasAlerts = info.holidays.length > 0 || info.bayernHomeGames.length > 0;
                return (
                  <div className={`p-3 rounded-lg border text-sm ${hasAlerts ? "bg-red-50 border-red-300" : "bg-green-50 border-green-200"}`}>
                    <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                      {hasAlerts
                        ? <ShieldAlert size={15} className="text-red-600" />
                        : <CheckCircle2 size={15} className="text-green-600" />}
                      <span className={hasAlerts ? "text-red-800" : "text-green-800"}>
                        Kommende Woche ({fmtDate(info.weekRange.from)} – {fmtDate(info.weekRange.to)})
                      </span>
                    </p>
                    {!hasAlerts && (
                      <p className="text-green-700 text-xs">Keine Feiertage und keine FC-Bayern-Heimspiele gefunden – Planung kann 1:1 übernommen werden.</p>
                    )}
                    {info.holidays.length > 0 && (
                      <div className="mb-1.5">
                        <p className="text-red-700 font-medium text-xs mb-1">Feiertage in Bayern:</p>
                        <ul className="space-y-0.5">
                          {info.holidays.map(h => (
                            <li key={h.datum} className="flex items-center gap-1.5 text-xs text-red-800">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              <span className="font-semibold">{fmtDate(h.datum)}</span> – {h.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {info.bayernHomeGames.length > 0 && (
                      <div>
                        <p className="text-red-700 font-medium text-xs mb-1">FC Bayern Heimspiele (Allianz Arena):</p>
                        <ul className="space-y-0.5">
                          {info.bayernHomeGames.map(g => (
                            <li key={g.date + g.opponent} className="flex items-center gap-1.5 text-xs text-red-800">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              <span className="font-semibold">{fmtDate(g.date)}</span> – FC Bayern vs {g.opponent}
                              <span className="text-red-500 text-[10px]">({g.competition})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {info.weather && info.weather.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${hasAlerts ? "border-red-200" : "border-green-200"}`}>
                        <p className="text-xs font-semibold mb-2 text-gray-700">🌤️ Wetterprognose München (Open-Meteo)</p>
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${info.weather.length}, minmax(0, 1fr))` }}>
                          {info.weather.map(w => (
                            <div key={w.date} className="bg-white rounded-lg border border-gray-200 p-2 text-center shadow-sm">
                              <p className="text-[10px] font-semibold text-gray-500 mb-0.5">{fmtDate(w.date)}</p>
                              <p className="text-2xl leading-none mb-1">{w.icon}</p>
                              <p className="text-[10px] text-gray-600 leading-tight mb-1">{w.label}</p>
                              <p className="text-xs font-bold text-red-600">{w.tempMax}°</p>
                              <p className="text-[10px] text-blue-500">{w.tempMin}°</p>
                              {w.precipMm > 0 && <p className="text-[9px] text-blue-600 mt-0.5">💧 {w.precipMm} mm</p>}
                              {w.windKmh > 20 && <p className="text-[9px] text-gray-500">💨 {w.windKmh} km/h</p>}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 space-y-1">
                          {info.weather.filter(w => w.prognosis !== "Normales Wetter").map(w => (
                            <div key={w.date} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                              <span className="font-semibold text-gray-500 min-w-[58px]">{fmtDate(w.date)}:</span>
                              <span>{w.prognosis}</span>
                            </div>
                          ))}
                          {info.weather.every(w => w.prognosis === "Normales Wetter") && (
                            <p className="text-[11px] text-gray-500 italic">Normales Wetter die ganze Woche – keine besonderen Hinweise.</p>
                          )}
                        </div>
                      </div>
                    )}
                    {hasAlerts && (
                      <p className="mt-2 text-xs text-red-700 font-medium">
                        ⚠️ Bitte Produktionsmengen vor dem Übernehmen manuell prüfen und ggf. anpassen!
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
