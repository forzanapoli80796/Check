import tableImage from "@assets/image_1781206551776.png";

export default function Pruefplan() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Prüfplan – Fehlende Checklisten</h2>
        <p className="text-sm text-gray-500 mt-1">
          Übersicht: Wann wird welche Liste an welchem Tag als fehlend gemeldet.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left px-5 py-4 font-semibold border border-gray-700 leading-tight">
                Admin geöffnet am
              </th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700 leading-tight">
                Ausgewähltes Datum<br />(gestern)
              </th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">
                Tag-Nummer
              </th>
              <th className="text-left px-5 py-4 font-semibold border border-gray-700">
                Was passiert
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                tag: "Montag",
                datum: "Sonntag",
                nummer: "0",
                was: "Kein Montagsliste-Check",
                highlight: false,
              },
              {
                tag: "Dienstag",
                datum: "Montag",
                nummer: "1",
                was: "Kein Montagsliste-Check",
                highlight: false,
              },
              {
                tag: "Mittwoch",
                datum: "Dienstag",
                nummer: "2",
                was: "✅ JP23/KP5 check Montag, TS17 check Dienstag",
                highlight: true,
              },
              {
                tag: "Donnerstag",
                datum: "Mittwoch",
                nummer: "3",
                was: "✅ Kein Montagsliste-Check (vorher war hier der Bug)",
                highlight: true,
              },
              {
                tag: "Freitag",
                datum: "Donnerstag",
                nummer: "4",
                was: "Kein Montagsliste-Check",
                highlight: false,
              },
            ].map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-200 last:border-0 ${
                  row.highlight ? "bg-gray-800 text-white font-semibold" : "bg-white text-gray-800"
                }`}
              >
                <td className={`px-5 py-4 border border-gray-200 ${row.highlight ? "border-gray-600" : ""}`}>
                  {row.tag}
                </td>
                <td className={`px-5 py-4 border border-gray-200 ${row.highlight ? "border-gray-600" : ""}`}>
                  {row.datum}
                </td>
                <td className={`px-5 py-4 border border-gray-200 font-bold text-center ${row.highlight ? "border-gray-600" : ""}`}>
                  {row.nummer}
                </td>
                <td className={`px-5 py-4 border border-gray-200 ${row.highlight ? "border-gray-600" : ""}`}>
                  {row.was}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
