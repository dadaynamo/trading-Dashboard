import React, { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';


export default function DashboardBorsa({ aziende, dateDisponibili, dataScelta, titoloScelto, ftseMib, risultatoRicerca, quotazioni, storico }) {
  const [formSymbol, setFormSymbol] = useState(titoloScelto);
  const [formData, setFormData] = useState(dataScelta || '');

  const handleRicerca = (e) => {
    e.preventDefault();
    router.get('/', { data: formData, titolo: formSymbol }, { preserveState: true });
  };

  const selezionaTitolo = (symbol) => {
    setFormSymbol(symbol);
    router.get('/', { data: dataScelta, titolo: symbol }, { preserveState: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏛️ Trading Dashboard & Ricerca Storica</h1>
        <Link
        href="/storico-azienda"
        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow flex items-center gap-2"
        >
        📊 Vai allo Storico Dettagliato Aziende →
        </Link>
      </div>


      {/* --- BANNER IN ALTO: INDEX FTSE MIB --- */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-lg text-2xl font-black">
            🇮🇹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-wide">FTSE MIB</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Indice Milano</span>
            </div>
            <p className="text-xs text-slate-400">Data riferimento: {new Date(dataScelta).toLocaleDateString('it-IT')}</p>
          </div>
        </div>

        {ftseMib ? (
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs text-slate-400 block">Punti Chiusura</span>
              <span className="text-2xl font-extrabold tracking-tight">
                {Number(ftseMib.prezzo_chiusura).toLocaleString('it-IT', { minimumFractionDigits: 2 })} pts
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Variazione</span>
              <span className={`text-lg font-bold ${ftseMib.variazione_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ftseMib.variazione_pct >= 0 ? `+${ftseMib.variazione_pct}` : ftseMib.variazione_pct}%
              </span>
            </div>
            <button
              onClick={() => selezionaTitolo('FTSEMIB.MI')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                titoloScelto === 'FTSEMIB.MI' 
                  ? 'bg-blue-500 text-white shadow' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {titoloScelto === 'FTSEMIB.MI' ? '📊 Grafico Attivo' : '📈 Mostra Grafico FTSE MIB'}
            </button>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Dati FTSE MIB non disponibili per questa data.</div>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-gray-800">🏛️ Trading Dashboard & Ricerca Storica</h1>

      {/* --- SCHEDA DI RICERCA --- */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-l-4 border-blue-600">
        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          🔍 Ricerca Valore in Chiusura
        </h2>

        <form onSubmit={handleRicerca} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Azienda / Indice:</label>
            <select
              value={formSymbol}
              onChange={(e) => setFormSymbol(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="FTSEMIB.MI">FTSE MIB (Indice)</option>
              {aziende.map((az) => (
                <option key={az.symbol} value={az.symbol}>
                  {az.nome} ({az.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seleziona Data:</label>
            <input
              type="date"
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2.5 rounded-lg text-sm transition"
            >
              Cerca Quotazione
            </button>
          </div>
        </form>

        {/* RISULTATO RICERCA */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          {risultatoRicerca ? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs uppercase tracking-wide text-blue-600 font-bold">Risultato Selezionato</span>
                <h3 className="text-lg font-bold text-gray-900">{risultatoRicerca.nome} ({risultatoRicerca.symbol})</h3>
                <p className="text-xs text-gray-600">Data: <span className="font-semibold">{risultatoRicerca.data}</span></p>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <span className="text-xs text-gray-500 block">Apertura</span>
                  <span className="text-sm font-semibold">{risultatoRicerca.prezzo_apertura ? `${Number(risultatoRicerca.prezzo_apertura).toLocaleString('it-IT')} €/pts` : 'N/D'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Chiusura</span>
                  <span className="text-xl font-bold text-blue-700">{Number(risultatoRicerca.prezzo_chiusura).toLocaleString('it-IT')} €/pts</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Var. %</span>
                  <span className={`text-sm font-bold ${risultatoRicerca.variazione_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {risultatoRicerca.variazione_pct >= 0 ? `+${risultatoRicerca.variazione_pct}` : risultatoRicerca.variazione_pct}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-sm">
              ⚠️ Nessun dato trovato per <strong>{formSymbol}</strong> in data <strong>{formData}</strong>.
            </div>
          )}
        </div>
      </div>

      {/* --- SEZIONE GRAFICO E TABELLA --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grafico Storico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              📈 Storico {titoloScelto === 'FTSEMIB.MI' ? 'FTSE MIB (Indice)' : titoloScelto}
            </h3>
            {titoloScelto === 'FTSEMIB.MI' && (
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
                Vista Indice
              </span>
            )}
          </div>
          
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={storico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString('it-IT')}`, 'Valore']} />
                <Line 
                  type="monotone" 
                  dataKey="prezzo_chiusura" 
                  stroke={titoloScelto === 'FTSEMIB.MI' ? '#0f172a' : '#2563eb'} 
                  strokeWidth={3} 
                  dot={{ r: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabella Titoli */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-y-auto max-h-[440px]">
          <h3 className="text-lg font-bold mb-3 text-gray-800">Aziende FTSEMIB ({new Date(dataScelta).toLocaleDateString('it-IT')})</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b text-gray-400 text-xs uppercase">
                <th className="pb-2">Azienda</th>
                <th className="pb-2">Chiusura</th>
                <th className="pb-2">Var %</th>
              </tr>
            </thead>
            <tbody>
              {quotazioni.map((q) => (
                <tr 
                  key={q.symbol} 
                  className={`border-b hover:bg-blue-50 cursor-pointer transition ${titoloScelto === q.symbol ? 'bg-blue-50' : ''}`} 
                  onClick={() => selezionaTitolo(q.symbol)}
                >
                  <td className="py-2.5 font-medium text-gray-800">{q.nome}</td>
                  <td className="py-2.5 text-gray-600">{Number(q.prezzo_chiusura).toFixed(2)} €</td>
                  <td className={`py-2.5 font-bold ${q.variazione_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {q.variazione_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}