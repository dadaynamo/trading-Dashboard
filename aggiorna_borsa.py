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

def scarica_dati():
    tickers = list(AZIENDE.keys())
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Scaricamento dati da Yahoo Finance...")
    
    data = yf.download(tickers, period="5d", interval="1d", group_by='ticker', progress=False)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    inseriti = 0

    for ticker, nome in AZIENDE.items():
        try:
            df = data[ticker].dropna()
            if len(df) >= 2:
                ultimo = df.iloc[-1]
                precedente = df.iloc[-2]
                
                chiusura = float(ultimo['Close'])
                apertura = float(ultimo['Open'])
                massimo = float(ultimo['High'])
                minimo = float(ultimo['Low'])
                prec_chiusura = float(precedente['Close'])
                
                var_pct = ((chiusura - prec_chiusura) / prec_chiusura) * 100
                data_str = df.index[-1].strftime('%Y-%m-%d')
                
                cursor.execute('''
                    INSERT INTO prezzi_giornalieri 
                    (symbol, nome, data, prezzo_chiusura, prezzo_apertura, massimo, minimo, volume, variazione_pct)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(symbol, data) DO UPDATE SET
                        prezzo_chiusura=excluded.prezzo_chiusura,
                        variazione_pct=excluded.variazione_pct,
                        volume=excluded.volume
                ''', (ticker, nome, data_str, round(chiusura, 3), round(apertura, 3), 
                      round(massimo, 3), round(minimo, 3), int(ultimo['Volume']), round(var_pct, 2)))
                inseriti += 1
        except Exception as e:
            print(f"Errore su {ticker}: {e}")

    conn.commit()
    conn.close()
    print(f"Aggiornamento completato! Inseriti {inseriti} record.")

if __name__ == "__main__":
    scarica_dati()