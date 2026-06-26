import { AlertTriangle, Eye, ShieldAlert, Store } from "lucide-react";

const SONDERLISTEN = [
  {
    name: "Montagsliste",
    icon: "📋",
    filialen: [
      { stores: "JP23, KP5", mitarbeiterTag: "Montag", adminWarnTag: "Dienstag", dow: 1 },
      { stores: "TS17",       mitarbeiterTag: "Dienstag", adminWarnTag: "Mittwoch", dow: 2 },
    ],
    hinweis: "TS17 ist montags geschlossen – reicht deshalb dienstags (Spätschicht) ein. JP23 & KP5: Montag Frühschicht.",
  },
  {
    name: "Mittwochsliste",
    icon: "🧹",
    filialen: [
      { stores: "JP23", mitarbeiterTag: "Mittwoch", adminWarnTag: "Donnerstag", dow: 3 },
    ],
    hinweis: "Nur JP23 – Frühschicht (Küche). KP5 und TS17 erhalten diese Liste nicht.",
  },
  {
    name: "MHD-Check",
    icon: "📅",
    filialen: [
      { stores: "JP23, KP5", mitarbeiterTag: "Freitag", adminWarnTag: "Samstag", dow: 5 },
      { stores: "TS17",      mitarbeiterTag: "Freitag", adminWarnTag: "Samstag", dow: 5 },
    ],
    hinweis: "JP23 & KP5: Frühschicht – TS17: Spätschicht.",
  },
  {
    name: "Sonder/Samstagsreinigung",
    icon: "🧽",
    filialen: [
      { stores: "JP23, KP5, TS17", mitarbeiterTag: "Samstag", adminWarnTag: "Sonntag", dow: 6 },
    ],
    hinweis: "JP23 & KP5: Frühschicht – TS17: Spätschicht. Erscheint samstags unter Terminal.",
  },
];

const DOW_LABELS = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

export default function Pruefplan() {
  const todayDow = new Date().getDay();
  const todayName = DOW_LABELS[todayDow];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Prüfplan Sonderlisten</h2>
        <p className="text-sm text-gray-500 mt-1">
          Alle 4 Sonderlisten mit Sichtbarkeit für Mitarbeiter und Fehlermeldung im Admin.
          Heute ist <strong>{todayName}</strong>.
        </p>
      </div>

      {/* Cards für jede Sonderliste */}
      <div className="grid grid-cols-1 gap-4">
        {SONDERLISTEN.map((liste) => {
          const isActiveToday = liste.filialen.some(f => f.dow === todayDow);
          const isWarnToday = liste.filialen.some(f => {
            const warnDow = (f.dow + 1) % 7;
            return warnDow === todayDow;
          });

          return (
            <div
              key={liste.name}
              className={`rounded-xl border-2 p-5 transition-all ${
                isActiveToday
                  ? "border-blue-400 bg-blue-50"
                  : isWarnToday
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Listenname + Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{liste.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base">{liste.name}</h3>
                  {liste.hinweis && (
                    <p className="text-xs text-gray-500 mt-0.5">{liste.hinweis}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isActiveToday && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">
                      Heute sichtbar
                    </span>
                  )}
                  {isWarnToday && (
                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">
                      Heute Admin-Check
                    </span>
                  )}
                </div>
              </div>

              {/* Tabelle pro Filialgruppe */}
              <div className="space-y-3">
                {liste.filialen.map((f, fi) => (
                  <div
                    key={fi}
                    className="grid grid-cols-3 gap-3 bg-white rounded-lg border border-gray-200 p-3"
                  >
                    {/* Filialen */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase mb-1">
                        <Store size={11} />
                        Filialen
                      </div>
                      <p className="text-sm font-medium text-gray-900">{f.stores}</p>
                    </div>

                    {/* Mitarbeiter sieht die Liste am */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 uppercase mb-1">
                        <Eye size={11} />
                        Mitarbeiter sieht Liste
                      </div>
                      <p className={`text-sm font-semibold ${f.dow === todayDow ? "text-blue-600" : "text-gray-900"}`}>
                        {f.mitarbeiterTag}
                        {f.dow === todayDow && " ✦ Heute"}
                      </p>
                      {liste.name === 'Sonder/Samstagsreinigung' ? (
                        <p className="text-xs text-gray-400 mt-0.5">⚠️ JP23 & KP5: Frühschicht – TS17: Spätschicht</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">⚠️ nur Frühschicht – bei Spätschicht nicht sichtbar</p>
                      )}
                    </div>

                    {/* Admin-Warnung bei Fehlen */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 uppercase mb-1">
                        <ShieldAlert size={11} />
                        Admin-Warnung wenn fehlend
                      </div>
                      <p className={`text-sm font-semibold ${((f.dow + 1) % 7) === todayDow ? "text-orange-600" : "text-gray-900"}`}>
                        {f.adminWarnTag}
                        {((f.dow + 1) % 7) === todayDow && " ✦ Heute"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">am Folgetag sichtbar</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legende */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">Legende</p>
        <div className="flex items-start gap-2">
          <span className="inline-block w-3 h-3 mt-0.5 rounded bg-blue-400 flex-shrink-0" />
          <span><strong>Mitarbeiter sieht Liste:</strong> Die Sonderliste erscheint in der Auswahl. Nur für Frühschicht – Spätschicht sieht sie nicht.</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="inline-block w-3 h-3 mt-0.5 rounded bg-orange-400 flex-shrink-0" />
          <span><strong>Admin-Warnung:</strong> Wenn die Liste am Einreichtag nicht abgegeben wurde, erscheint am nächsten Tag im Admin ein roter Hinweis.</span>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span><strong>Alle anderen Listen</strong> (Terminal, Küche, Fahrer etc.) werden täglich geprüft – Fehlmeldung erscheint immer am Folgetag.</span>
        </div>
      </div>
    </div>
  );
}
