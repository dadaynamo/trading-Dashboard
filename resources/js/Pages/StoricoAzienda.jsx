import React, { useState, useEffect } from 'react';
import { router, Link, useForm } from '@inertiajs/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StoricoAzienda({
  aziende,
  simboloScelto,
  aziendaCorrente,
  dataInizio,
  dataFine,
  minDataDb,
  maxDataDb,
  datiAzienda = [],
  datiGrafico = []
}) {
  const [fInizio, setFInizio] = useState(dataInizio || '');
  const [fFine, setFFine] = useState(dataFine || '');
  const [mostraMenuAggiungi, setMostraMenuAggiungi] = useState(false);

  // NUOVO: Stato per la finestra popup di aggiunta nuova azienda da Ticker
  const [mostraModalNuovaAzienda, setMostraModalNuovaAzienda] = useState(false);

  // NUOVO: Form Inertia per aggiungere una nuova azienda vuota nel DB
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    symbol: '',
    nome: '',
  });

  // 1. Inizializza la lista dei simboli attivi nella Sidebar salvata nel localStorage.
  const [aziendeAttive, setAziendeAttive] = useState(() => {
    const salvate = localStorage.getItem('sidebar_aziende_attive');
    if (salvate) {
      return JSON.parse(salvate);
    }
    return aziende.map(a => a.symbol);
  });

  // 2. Sincronizza il localStorage ogni volta che la lista cambia
  useEffect(() => {
    localStorage.setItem('sidebar_aziende_attive', JSON.stringify(aziendeAttive));
  }, [aziendeAttive]);

  // Rimuove un'azienda dalla sidebar
  const rimuoviAziendaDallaSidebar = (e, symbol) => {
    e.stopPropagation();
    const nuovaLista = aziendeAttive.filter(s => s !== symbol);
    setAziendeAttive(nuovaLista);

    if (simboloScelto === symbol && nuovaLista.length > 0) {
      selezionaAzienda(nuovaLista[0]);
    }
  };

  // Riaggiunge un'azienda nascosta o selezionata dal menu
  const riaggiungiAzienda = (symbol) => {
    if (!aziendeAttive.includes(symbol)) {
      setAziendeAttive([...aziendeAttive, symbol]);
    }
    selezionaAzienda(symbol);
    setMostraMenuAggiungi(false);
  };

  const selezionaAzienda = (symbol) => {
    router.get('/storico-azienda', {
      symbol: symbol,
      data_inizio: fInizio,
      data_fine: fFine
    }, { preserveState: true });
  };

  // NUOVO: Invio del form per salvare la nuova azienda nel DB e aggiungerla alla Sidebar
  const handleCreaAzienda = (e) => {
    e.preventDefault();
    const simboloFormattato = data.symbol.toUpperCase().trim();

    post('/aggiungi-azienda', {
      onSuccess: () => {
        // Aggiungiamo subito il simbolo alla lista attiva della sidebar se non c'è già
        if (!aziendeAttive.includes(simboloFormattato)) {
          setAziendeAttive(prev => [...prev, simboloFormattato]);
        }
        reset();
        setMostraModalNuovaAzienda(false);
        // Selezioniamo la nuova azienda appena creata
        selezionaAzienda(simboloFormattato);
      },
    });
  };

  const applicaFiltroDate = (e) => {
    e.preventDefault();
    router.get('/storico-azienda', {
      symbol: simboloScelto,
      data_inizio: fInizio,
      data_fine: fFine
    }, { preserveState: true });
  };

  const mostraTutto = () => {
    setFInizio(minDataDb || '');
    setFFine(maxDataDb || '');
    router.get('/storico-azienda', {
      symbol: simboloScelto,
      data_inizio: minDataDb,
      data_fine: maxDataDb
    }, { preserveState: true });
  };

  // Filtra la lista per la sidebar: solo quelle attualmente abilitate
  const listaSidebar = aziende.filter(a => aziendeAttive.includes(a.symbol));
  
  // Lista delle aziende presenti nel DB che sono state nascoste dall'utente
  const listaNascoste = aziende.filter(a => !aziendeAttive.includes(a.symbol));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* BARRA DI NAVIGAZIONE IN ALTO */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">📈</span>
          <h1 className="font-bold text-lg tracking-wide">TradingDash - Dettaglio Storico</h1>
        </div>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
        >
          ← Torna alla Dashboard
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR SINISTRA: LISTA AZIENDE CON RIMOZIONE/AGGIUNTA */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto p-4 flex-shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Aziende Attive ({listaSidebar.length})
              </h2>
              
              {/* DROPDOWN AZIENDE NASCOSTE */}
              <button
                onClick={() => setMostraMenuAggiungi(!mostraMenuAggiungi)}
                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-md font-bold transition flex items-center gap-1"
                title="Riaggiungi un'azienda nascosta"
              >
                ➕ Visibilità
              </button>
            </div>

            {/* SEZIONE DROPDOWN PER RIATTIVARE AZIENDE NASCOSTE */}
            {mostraMenuAggiungi && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <span className="text-xs font-bold text-gray-600 block mb-2">Seleziona da riaggiungere:</span>
                {listaNascoste.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {listaNascoste.map((az) => (
                      <button
                        key={az.symbol}
                        onClick={() => riaggiungiAzienda(az.symbol)}
                        className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-emerald-100 text-gray-700 flex justify-between"
                      >
                        <span className="truncate">{az.nome}</span>
                        <span className="font-mono text-emerald-600 font-bold">+</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tutte le aziende del DB sono già visibili nella sidebar.</p>
                )}
              </div>
            )}

            {/* PULSANTE NUOVA AZIENDA DA TICKER */}
            <button
              onClick={() => {
                clearErrors();
                reset();
                setMostraModalNuovaAzienda(true);
              }}
              className="w-full mb-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              <span>✨</span> Crea Nuova Azienda
            </button>

            {/* LISTA AZIENDE IN SIDEBAR CON TASTO RIMOZIONE */}
            <div className="space-y-1">
              {listaSidebar.map((az) => {
                const isSelezionata = simboloScelto === az.symbol;
                return (
                  <div
                    key={az.symbol}
                    onClick={() => selezionaAzienda(az.symbol)}
                    className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer flex justify-between items-center ${
                      isSelezionata
                        ? 'bg-blue-600 text-white font-semibold shadow'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{az.nome}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${isSelezionata ? 'text-blue-200' : 'text-gray-400'}`}>
                        {az.symbol.replace('.MI', '')}
                      </span>
                      <button
                        onClick={(e) => rimuoviAziendaDallaSidebar(e, az.symbol)}
                        title="Rimuovi totalmente dalla Sidebar"
                        className={`ml-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-xs rounded transition ${
                          isSelezionata ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-red-100 text-red-500'
                        }`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setAziendeAttive(aziende.map(a => a.symbol));
              }}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Ripristina tutte le aziende originali
            </button>
          </div>
        </aside>

        {/* CONTENUTO CENTRALE */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* HEADER AZIENDA & FILTRI DATE */}
          <div className="bg-white p-5 rounded-xl shadow-md mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black text-gray-800">{aziendaCorrente?.nome || simboloScelto}</h2>
                <p className="text-xs text-gray-500">Simbolo: <span className="font-semibold">{simboloScelto}</span></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Record trovati</span>
                <span className="text-lg font-bold text-blue-600">{datiAzienda.length}</span>
              </div>
            </div>

            {/* BARRA FILTRO PER INTERVALLO DATE */}
            <form onSubmit={applicaFiltroDate} className="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Da (Data Inizio):</label>
                <input
                  type="date"
                  value={fInizio}
                  onChange={(e) => setFInizio(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">A (Data Fine):</label>
                <input
                  type="date"
                  value={fFine}
                  onChange={(e) => setFFine(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Filtra Intervallo
              </button>

              <button
                type="button"
                onClick={mostraTutto}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                Mostra Tutto
              </button>
            </form>
          </div>

          {/* GRIGLIA A 2 COLONNE: TABELLA DATI (SINISTRA) + GRAFICO (DESTRA) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TABELLA DATI STORICI */}
            <div className="bg-white p-5 rounded-xl shadow-md overflow-hidden flex flex-col max-h-[550px]">
              <h3 className="text-md font-bold text-gray-800 mb-3 flex justify-between items-center">
                <span>📋 Tabella Dati Storici</span>
                <span className="text-xs font-normal text-gray-500">Ordinato dal più recente</span>
              </h3>

              <div className="overflow-y-auto flex-1 border border-gray-100 rounded-lg">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr className="text-gray-500 text-xs uppercase">
                      <th className="p-3">Data</th>
                      <th className="p-3">Apertura</th>
                      <th className="p-3">Chiusura</th>
                      <th className="p-3">Var %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datiAzienda.length > 0 ? (
                      datiAzienda.map((row, index) => (
                        <tr key={index} className="hover:bg-blue-50/50 transition">
                          <td className="p-3 font-medium text-gray-800">
                            {new Date(row.data).toLocaleDateString('it-IT')}
                          </td>
                          <td className="p-3 text-gray-600">
                            {row.prezzo_apertura ? `${Number(row.prezzo_apertura).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €` : 'N/D'}
                          </td>
                          <td className="p-3 font-bold text-gray-900">
                            {Number(row.prezzo_chiusura).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €
                          </td>
                          <td className={`p-3 font-bold text-xs ${row.variazione_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.variazione_pct >= 0 ? `+${row.variazione_pct}` : row.variazione_pct}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-gray-400 italic">
                          📭 Nessun dato ancora presente per questa azienda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GRAFICO RIASSUNTIVO DELL'ANDAMENTO */}
            <div className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-1">📊 Grafico Andamento Intervallo</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Visualizzazione temporale per l'intervallo selezionato
                </p>
              </div>

              <div className="w-full h-96">
                {datiGrafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datiGrafico}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="data" 
                        tick={{ fontSize: 11 }} 
                        tickFormatter={(v) => new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        labelFormatter={(v) => new Date(v).toLocaleDateString('it-IT')}
                        formatter={(v) => [`${Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2 })} €`, 'Prezzo Chiusura']} 
                      />
                      <Line
                        type="monotone"
                        dataKey="prezzo_chiusura"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <span className="text-3xl mb-2">📊</span>
                    <span>Nessun dato da mostrare nel grafico per questa azienda.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* --- POPUP MODALE AGGIUNTA NUOVA AZIENDA --- */}
      {mostraModalNuovaAzienda && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-md font-bold text-gray-800">✨ Registra Nuova Azienda</h3>
              <button 
                onClick={() => setMostraModalNuovaAzienda(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreaAzienda} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Ticker / Simbolo Ufficiale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="es. RACE.MI, STLAM.MI, NVDA"
                  value={data.symbol}
                  onChange={(e) => setData('symbol', e.target.value.toUpperCase())}
                  className={`w-full border rounded-lg p-2.5 text-sm uppercase transition focus:outline-none ${
                    errors.symbol ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  required
                />
                {errors.symbol && (
                  <p className="text-xs text-red-600 font-medium mt-1">⚠️ {errors.symbol}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome Azienda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="es. Ferrari N.V."
                  value={data.nome}
                  onChange={(e) => setData('nome', e.target.value)}
                  className={`w-full border rounded-lg p-2.5 text-sm transition focus:outline-none ${
                    errors.nome ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  required
                />
                {errors.nome && (
                  <p className="text-xs text-red-600 font-medium mt-1">⚠️ {errors.nome}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setMostraModalNuovaAzienda(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow disabled:opacity-50"
                >
                  {processing ? 'Salvataggio...' : 'Aggiungi in Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}