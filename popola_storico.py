import sqlite3
import yfinance as yf
import pandas as pd
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "database.sqlite")

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

def scarica_storico_completo(periodo="2y"):
    tickers = list(AZIENDE.keys())
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Scaricamento dello storico ({periodo}) per {len(tickers)} aziende...")
    
    # Scarica lo storico completo (2 anni) in un unico blocco
    data = yf.download(tickers, period=periodo, interval="1d", group_by='ticker', progress=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    totale_inseriti = 0

    for ticker, nome in AZIENDE.items():
        try:
            df = data[ticker].dropna(subset=['Close'])
            if df.empty:
                continue

            # Calcola la variazione percentuale rispetto al giorno precedente
            df['Var_Pct'] = df['Close'].pct_change() * 100

            for timestamp, riga in df.iterrows():
                # Metti 2 decimali per i prezzi (es. 12.34) e 2 per le variazioni %
                chiusura = round(float(riga['Close']), 2) if pd.notna(riga['Close']) else None
                apertura = round(float(riga['Open']), 2) if pd.notna(riga['Open']) else None
                massimo  = round(float(riga['High']), 2) if pd.notna(riga['High']) else None
                minimo   = round(float(riga['Low']), 2) if pd.notna(riga['Low']) else None
                var_pct  = round(float(riga['Var_Pct']), 2) if pd.notna(riga['Var_Pct']) else 0.0
                
                data_str = timestamp.strftime('%Y-%m-%d')

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
                ''', (ticker, nome, data_str, round(chiusura, 3), 
                      round(apertura, 3) if apertura else None, 
                      round(massimo, 3) if massimo else None, 
                      round(minimo, 3) if minimo else None, 
                      volume, round(var_pct, 2)))
                totale_inseriti += 1

        except Exception as e:
            print(f"Errore nell'elaborazione di {ticker}: {e}")

    conn.commit()
    conn.close()
    print(f"\n✅ Popolamento completato! Inseriti/Aggiornati {totale_inseriti} record nel database.")

if __name__ == "__main__":
    scarica_storico_completo("2y") # 2y = 2 anni