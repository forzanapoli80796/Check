export default function Pruefplan() {
  const today = new Date();
  const todayDow = today.getDay(); // 0=So,1=Mo,2=Di,3=Mi,4=Do,5=Fr,6=Sa

  const rows = [
    {
      adminTag: "Montag",    dow: 1, ausgewaehlt: "Sonntag",    tagnr: "0", liste: null,                             filialen: null,               einreichTag: null },
    { adminTag: "Dienstag",  dow: 2, ausgewaehlt: "Montag",     tagnr: "1", liste: "Montagsliste",                   filialen: "JP23, KP5",        einreichTag: "Montag" },
    { adminTag: "Mittwoch",  dow: 3, ausgewaehlt: "Dienstag",   tagnr: "2", liste: "Montagsliste",                   filialen: "TS17",             einreichTag: "Dienstag" },
    { adminTag: "Donnerstag",dow: 4, ausgewaehlt: "Mittwoch",   tagnr: "3", liste: "Mittwochsliste",                 filialen: "JP23, KP5, TS17",  einreichTag: "Mittwoch" },
    { adminTag: "Freitag",   dow: 5, ausgewaehlt: "Donnerstag", tagnr: "4", liste: null,                             filialen: null,               einreichTag: null },
    { adminTag: "Samstag",   dow: 6, ausgewaehlt: "Freitag",    tagnr: "5", liste: "MHD-Check",                      filialen: "JP23, KP5, TS17",  einreichTag: "Freitag" },
    { adminTag: "Sonntag",   dow: 0, ausgewaehlt: "Samstag",    tagnr: "6", liste: "Sonder/Samstagsreinigung",       filialen: "JP23, KP5, TS17",  einreichTag: "Samstag" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Prüfplan – Fehlende Checklisten</h2>
        <p className="text-sm text-gray-500 mt-1">
          Wenn eine Liste nicht ausgefüllt wurde, erscheint die Meldung <strong>nur am Folgetag</strong> im Admin.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">Admin geöffnet am</th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">Ausgewähltes Datum (gestern)</th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">Liste</th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">Filialen</th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">Einreichtag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isToday = row.dow === todayDow;
              const hasCheck = row.liste !== null;
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-200 last:border-0 ${
                    isToday && hasCheck
                      ? "bg-gray-800 text-white font-semibold"
                      : isToday
                      ? "bg-amber-50 font-semibold"
                      : hasCheck
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "bg-white text-gray-500"
                  }`}
                >
                  <td className={`px-5 py-4 border border-gray-200 ${isToday && hasCheck ? "border-gray-600" : ""}`}>
                    <span className="flex items-center gap-2">
                      {row.adminTag}
                      {isToday && (
                        <span className="text-xs bg-amber-400 text-gray-900 px-1.5 py-0.5 rounded font-semibold">Heute</span>
                      )}
                    </span>
                  </td>
                  <td className={`px-5 py-4 border border-gray-200 ${isToday && hasCheck ? "border-gray-600" : ""}`}>
                    {row.ausgewaehlt}
                  </td>
                  <td className={`px-5 py-4 border border-gray-200 ${isToday && hasCheck ? "border-gray-600" : ""}`}>
                    {hasCheck ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-green-400">✅</span>
                        {row.liste}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Kein Sondercheck</span>
                    )}
                  </td>
                  <td className={`px-5 py-4 border border-gray-200 ${isToday && hasCheck ? "border-gray-600" : ""}`}>
                    {row.filialen ?? <span className="text-gray-400">–</span>}
                  </td>
                  <td className={`px-5 py-4 border border-gray-200 ${isToday && hasCheck ? "border-gray-600" : ""}`}>
                    {row.einreichTag ?? <span className="text-gray-400">–</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 space-y-1.5">
        <p className="font-semibold text-gray-800">Regeln:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Montagsliste</strong> – JP23 & KP5 reichen montags ein → Meldung dienstags</li>
          <li><strong>Montagsliste</strong> – TS17 reicht dienstags ein (montags geschlossen) → Meldung mittwochs</li>
          <li><strong>Mittwochsliste</strong> – alle Filialen reichen mittwochs ein → Meldung donnerstags</li>
          <li><strong>MHD-Check</strong> – alle Filialen reichen freitags ein → Meldung samstags</li>
          <li><strong>Sonder/Samstagsreinigung</strong> – alle Filialen reichen samstags ein → Meldung sonntags</li>
        </ul>
      </div>
    </div>
  );
}
