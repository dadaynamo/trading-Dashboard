import sqlite3
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import os

# Perimetro del DB SQLite del progetto Laravel
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "database.sqlite")

AZIENDE = {
    "FTSEMIB.MI": "FTSE MIB (Indice)",
    "A2A.MI": "A2A", "AMP.MI": "Amplifon", "AZM.MI": "Azimut", "BAMI.MI": "Banco BPM",
    "BPE.MI": "BPER Banca", "CPR.MI": "Campari", "ENEL.MI": "Enel", "ENI.MI": "Eni",
    "ERG.MI": "ERG", "STLAM.MI": "Stellantis", "RACE.MI": "Ferrari", "FBK.MI": "FinecoBank",
    "G.MI": "Generali", "INW.MI": "Inwit", "ISP.MI": "Intesa Sanpaolo", "IG.MI": "Italgas",
    "LDO.MI": "Leonardo", "MONC.MI": "Moncler", "NEXI.MI": "Nexi", "PIRC.MI": "Pirelli",
    "PST.MI": "Poste Italiane", "PRY.MI": "Prysmian", "REC.MI": "Recordati", "SPM.MI": "Saipem",
    "SRG.MI": "Snam", "STMMI.MI": "STMicroelectronics", "TEN.MI": "Tenaris", "TRN.MI": "Terna",
    "UCG.MI": "UniCredit", "UNI.MI": "Unipol"
}

def ottieni_ultima_data_db(conn):
    """Trova la data più recente registrata nel database."""
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(data) FROM prezzi_giornalieri")
    risultato = cursor.fetchone()[0]
    return risultato

def sincronizza_dati_mancanti():
    conn = sqlite3.connect(DB_PATH)
    ultima_data_str = ottieni_ultima_data_db(conn)

    oggi = datetime.now().date()

    if ultima_data_str:
        ultima_data = datetime.strptime(ultima_data_str, "%Y-%m-%d").date()
        # Iniziamo dal giorno successivo all'ultimo record
        data_inizio = ultima_data + timedelta(days=1)
    else:
        # Se il DB fosse vuoto, scarichiamo gli ultimi 2 anni
        data_inizio = oggi - timedelta(days=730)

    # Se la data di inizio è oggi o nel futuro, il DB è già perfettamente aggiornato
    if data_inizio > oggi:
        conn.close()
        print("DB già aggiornato.")
        return

    # Data fine per yfinance (start e end: end è esclusivo, quindi aggiungiamo 1 giorno ad oggi)
    data_inizio_str = data_inizio.strftime("%Y-%m-%d")
    data_fine_str = (oggi + timedelta(days=1)).strftime("%Y-%m-%d")

    print(f"Sincronizzazione in corso dal {data_inizio_str} al {oggi.strftime('%Y-%m-%d')}...")

    tickers = list(AZIENDE.keys())
    
    # Scarichiamo SOLO l'intervallo di date mancanti
    data = yf.download(
        tickers, 
        start=data_inizio_str, 
        end=data_fine_str, 
        interval="1d", 
        group_by='ticker', 
        progress=False
    )

    if data.empty:
        conn.close()
        print("Nessun nuovo dato disponibile sui mercati.")
        return

    cursor = conn.cursor()
    inseriti = 0

    for ticker, nome in AZIENDE.items():
        try:
            # Gestione struttura dati yfinance (multi-index o single ticker)
            if len(tickers) == 1:
                df_ticker = data
            else:
                if ticker not in data.columns.levels[0]:
                    continue
                df_ticker = data[ticker]

            df = df_ticker.dropna(subset=['Close'])
            if df.empty:
                continue

            # Calcolo variazione percentuale
            df['Var_Pct'] = df['Close'].pct_change() * 100

            for timestamp, riga in df.iterrows():
                data_record = timestamp.strftime('%Y-%m-%d')
                                
                # Metti 2 decimali per i prezzi (es. 12.34) e 2 per le variazioni %
                chiusura = round(float(riga['Close']), 2) if pd.notna(riga['Close']) else None
                apertura = round(float(riga['Open']), 2) if pd.notna(riga['Open']) else None
                massimo  = round(float(riga['High']), 2) if pd.notna(riga['High']) else None
                minimo   = round(float(riga['Low']), 2) if pd.notna(riga['Low']) else None
                var_pct  = round(float(riga['Var_Pct']), 2) if pd.notna(riga['Var_Pct']) else 0.0

                cursor.execute('''
                    INSERT INTO prezzi_giornalieri 
                    (symbol, nome, data, prezzo_chiusura, prezzo_apertura, massimo, minimo, volume, variazione_pct)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol, data) DO UPDATE SET
                        prezzo_chiusura=excluded.prezzo_chiusura,
                        prezzo_apertura=excluded.prezzo_apertura,
                        massimo=excluded.massimo,
                        minimo=excluded.minimo,
                        volume=excluded.volume,
                        variazione_pct=excluded.variazione_pct
                ''', (ticker, nome, data_record, round(chiusura, 3), 
                      round(apertura, 3) if apertura else None, 
                      round(massimo, 3) if massimo else None, 
                      round(minimo, 3) if minimo else None, 
                      volume, round(var_pct, 2)))
                inseriti += 1

        except Exception as e:
            continue

    conn.commit()
    conn.close()
    print(f"Sincronizzazione completata: {inseriti} record aggiornati.")

if __name__ == "__main__":
    sincronizza_dati_mancanti()