import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PruefplanRow {
  adminTag: string;
  zeigtDatum: string;
  liste: string;
  filialen: string[];
  prueftVom: string;
  type: 'regular' | 'special';
}

const DAYS: PruefplanRow[] = [
  {
    adminTag: "Montag",
    zeigtDatum: "Sonntag",
    liste: "Alle regulären Listen",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Sonntag",
    type: "regular",
  },
  {
    adminTag: "Dienstag",
    zeigtDatum: "Montag",
    liste: "Alle regulären Listen",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Montag",
    type: "regular",
  },
  {
    adminTag: "Mittwoch",
    zeigtDatum: "Dienstag",
    liste: "Alle regulären Listen",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Dienstag",
    type: "regular",
  },
  {
    adminTag: "Mittwoch",
    zeigtDatum: "Dienstag",
    liste: "Montagsliste – JP23 & KP5",
    filialen: ["JP23", "KP5"],
    prueftVom: "Montag",
    type: "special",
  },
  {
    adminTag: "Mittwoch",
    zeigtDatum: "Dienstag",
    liste: "Montagsliste – TS17",
    filialen: ["TS17"],
    prueftVom: "Dienstag",
    type: "special",
  },
  {
    adminTag: "Donnerstag",
    zeigtDatum: "Mittwoch",
    liste: "Alle regulären Listen",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Mittwoch",
    type: "regular",
  },
  {
    adminTag: "Freitag",
    zeigtDatum: "Donnerstag",
    liste: "Alle regulären Listen",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Donnerstag",
    type: "regular",
  },
  {
    adminTag: "Freitag",
    zeigtDatum: "Donnerstag",
    liste: "Mittwochsliste",
    filialen: ["JP23", "KP5", "TS17"],
    prueftVom: "Mittwoch",
    type: "special",
  },
];

const DAYS_OF_WEEK = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const storeColor: Record<string, string> = {
  JP23: "bg-blue-100 text-blue-800",
  KP5: "bg-green-100 text-green-800",
  TS17: "bg-purple-100 text-purple-800",
};

export default function Pruefplan() {
  const today = new Date();
  const todayName = DAYS_OF_WEEK[today.getDay() - 1] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Prüfplan – Fehlende Checklisten</h2>
        <p className="text-sm text-gray-500 mt-1">
          Übersicht: Wann wird welche Liste an welchem Tag als fehlend angezeigt (Mo–Fr).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Admin geöffnet am</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Zeigt Datum</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Liste</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Filialen</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Prüft Einreichung vom</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Art</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((row, i) => {
              const isToday = row.adminTag === todayName;
              const isFirstForDay = i === 0 || DAYS[i - 1].adminTag !== row.adminTag;
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${
                    isToday ? "bg-amber-50" : "hover:bg-gray-50"
                  } ${isFirstForDay && i > 0 ? "border-t-2 border-gray-200" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isToday && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                      {row.adminTag}
                      {isToday && (
                        <span className="text-xs font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Heute</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.zeigtDatum}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div className="flex items-center gap-2">
                      {row.type === "special" && <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />}
                      {row.type === "regular" && <CheckCircle2 className="w-4 h-4 text-gray-300 shrink-0" />}
                      {row.liste}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.filialen.map(store => (
                        <span
                          key={store}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${storeColor[store]}`}
                        >
                          {store}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.prueftVom}</td>
                  <td className="px-4 py-3">
                    {row.type === "special" ? (
                      <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 text-xs">
                        Sonderliste
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-200 text-gray-500 text-xs">
                        Regulär
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-1">
        <p className="font-medium text-gray-700">Hinweise:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Der Admin zeigt standardmäßig immer das <strong>gestrige Datum</strong>.</li>
          <li>Reguläre Listen (Terminal, Küche, etc.) werden jeden Tag für den Vortag geprüft.</li>
          <li><strong>Montagsliste JP23 & KP5</strong>: Einreichung Montag – Fehler sichtbar am Mittwoch.</li>
          <li><strong>Montagsliste TS17</strong>: TS17 ist Montag geschlossen, reicht Dienstag ein – Fehler sichtbar am Mittwoch.</li>
          <li><strong>Mittwochsliste</strong>: Einreichung Mittwoch – Fehler sichtbar am Freitag.</li>
        </ul>
      </div>
    </div>
  );
}
