<?php

namespace App\Http\Controllers;

use App\Models\PrezzoGiornaliero;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class BorsaController extends Controller
{
   public function index(Request $request)
{
    // 1. Recupera le date disponibili nel DB
    $dateDisponibili = PrezzoGiornaliero::select('data')
        ->distinct()
        ->orderBy('data', 'desc')
        ->pluck('data');

    // Se il DB è vuoto, evita errori
    $dataScelta = $request->input('data', $dateDisponibili->first() ?? date('Y-m-d'));
    $titoloScelto = $request->input('titolo', 'FTSEMIB.MI');

    // 2. Aziende (escludendo l'indice)
    $aziende = PrezzoGiornaliero::select('symbol', 'nome')
        ->where('symbol', '!=', 'FTSEMIB.MI')
        ->distinct()
        ->orderBy('nome', 'asc')
        ->get();

    // 3. FTSE MIB per il banner (se assente per la data scelta, prende l'ultimo disponibile)
    $ftseMib = PrezzoGiornaliero::where('symbol', 'FTSEMIB.MI')
        ->where('data', $dataScelta)
        ->first() 
        ?? PrezzoGiornaliero::where('symbol', 'FTSEMIB.MI')->orderBy('data', 'desc')->first();

    // 4. Risultato ricerca corrente
    $risultatoRicerca = PrezzoGiornaliero::where('symbol', $titoloScelto)
        ->where('data', $dataScelta)
        ->first();

    // 5. Quotazioni per la tabella
    $quotazioni = PrezzoGiornaliero::where('data', $dataScelta)
        ->where('symbol', '!=', 'FTSEMIB.MI')
        ->orderBy('symbol', 'asc')
        ->get();

    // 6. Storico grafico
    $storico = PrezzoGiornaliero::where('symbol', $titoloScelto)
        ->orderBy('data', 'asc')
        ->take(30)
        ->get(['data', 'prezzo_chiusura', 'variazione_pct']);

    return Inertia::render('DashboardBorsa', [
        'aziende' => $aziende,
        'dateDisponibili' => $dateDisponibili,
        'dataScelta' => $dataScelta,
        'titoloScelto' => $titoloScelto,
        'ftseMib' => $ftseMib,
        'risultatoRicerca' => $risultatoRicerca,
        'quotazioni' => $quotazioni,
        'storico' => $storico
    ]);
}

public function storicoAzienda(Request $request)
    {
        // 1. Lista aziende disponibili per la sidebar
        $aziende = PrezzoGiornaliero::select('symbol', 'nome')
            ->distinct()
            ->orderBy('nome', 'asc')
            ->get();

        // 2. Simbolo selezionato (di default prende la prima azienda della lista)
        $simboloScelto = $request->input('symbol', $aziende->first()?->symbol ?? 'A2A.MI');

        // 3. Date limite disponibili nel DB per questo simbolo
        $minDataDb = PrezzoGiornaliero::where('symbol', $simboloScelto)->min('data');
        $maxDataDb = PrezzoGiornaliero::where('symbol', $simboloScelto)->max('data');

        // 4. Intervallo di date inviato dall'utente (oppure mostra tutto il range)
        $dataInizio = $request->input('data_inizio', $minDataDb);
        $dataFine = $request->input('data_fine', $maxDataDb);

        // 5. Query per tabella e grafico
        $query = PrezzoGiornaliero::where('symbol', $simboloScelto);

        if ($dataInizio) {
            $query->where('data', '>=', $dataInizio);
        }
        if ($dataFine) {
            $query->where('data', '<=', $dataFine);
        }

        $datiAzienda = $query->orderBy('data', 'desc')->get();
        // Dati ordinati in senso crescente per il grafico
        $datiGrafico = $datiAzienda->sortBy('data')->values();

    
        $aziendaCorrente = $aziende->firstWhere('symbol', $simboloScelto) ?? (object)['symbol' => $simboloScelto, 'nome' => $simboloScelto];
        return Inertia::render('StoricoAzienda', [
            'aziende' => $aziende,
            'simboloScelto' => $simboloScelto,
            'aziendaCorrente' => $aziendaCorrente,
            'dataInizio' => $dataInizio,
            'dataFine' => $dataFine,
            'minDataDb' => $minDataDb,
            'maxDataDb' => $maxDataDb,
            'datiAzienda' => $datiAzienda,
            'datiGrafico' => $datiGrafico
        ]);
    }
    private function verificaEAggiornaDatiAuto()
    {
        // Esegui il controllo al massimo una volta all'ora per non rallentare la navigazione
        Cache::remember('controllo_sincronizzazione_borsa', 3600, function () {
            $ultimaDataDb = PrezzoGiornaliero::max('data');
            $oggi = date('Y-m-d');

            // Se l'ultima data nel DB è precedente ad oggi, lancia la sincronizzazione dinamica
            if (!$ultimaDataDb || $ultimaDataDb < $oggi) {
                $scriptPath = base_path('aggiorna_mancanti.py');
                Process::start("python3 {$scriptPath}");
            }

            return true;
        });
    }
    public function aggiungiAzienda(Request $request)
{
    // 1. Validazione base del form
    $request->validate([
        'symbol' => [
            'required',
            'string',
            'uppercase',
            'regex:/^[A-Z0-9\.]+$/' // Accetta es. RACE.MI, NVDA, AAPL
        ],
        'nome' => 'required|string|max:255',
    ], [
        'symbol.required' => 'Il simbolo Ticker è obbligatorio.',
        'symbol.regex'    => 'Formato Ticker non valido (usa ad es. RACE.MI o NVDA).',
        'nome.required'   => 'Il nome dell\'azienda è obbligatorio.'
    ]);

    $symbol = strtoupper(trim($request->symbol));
    $nome = trim($request->nome);

    // 2. Controllo se il simbolo esiste già nel DB
    $esisteGia = PrezzoGiornaliero::where('symbol', $symbol)->exists();

    if ($esisteGia) {
        return back()->withErrors(['symbol' => "L'azienda con simbolo {$symbol} è già presente nel DB!"]);
    }

    // 3. Inseriamo un record segnaposto (placeholder) per registrare l'azienda nel DB senza dati storici
    PrezzoGiornaliero::create([
        'symbol'          => $symbol,
        'nome'            => $nome,
        'data'            => date('Y-m-d'),
        'prezzo_chiusura' => 0,
        'variazione_pct'  => 0,
    ]);

    return back()->with('success', "Azienda {$nome} ({$symbol}) creata con successo!");
}
}