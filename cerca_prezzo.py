import yfinance as yf
import pandas as pd

def cerca_chiusura(symbol, data_target):
    """
    symbol: es. 'ENI.MI', 'RACE.MI' (Ferrari), 'AAPL' (Apple)
    data_target: stringa in formato 'YYYY-MM-DD' (es. '2024-01-15')
    """
    # Convertiamo la data per prendere un intervallo di 3 giorni attorno alla data desiderata
    # (utile per gestire i giorni in cui la borsa è chiusa, come i weekend)
    start_date = pd.to_datetime(data_target) - pd.Timedelta(days=2)
    end_date = pd.to_datetime(data_target) + pd.Timedelta(days=2)

    ticker = yf.Ticker(symbol)
    df = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))

    if df.empty:
        print(f"Nessun dato trovato per {symbol} attorno alla data {data_target}.")
        return

    # Cerchiamo la data esatta o il primo giorno utile di contrattazione
    df.index = df.index.strftime('%Y-%m-%d')
    
    if data_target in df.index:
        riga = df.loc[data_target]
        print(f"\n--- QUOTAZIONE {symbol} del {data_target} ---")
        print(f"Prezzo Chiusura: {round(riga['Close'], 3)} €")
        print(f"Prezzo Apertura: {round(riga['Open'], 3)} €")
        print(f"Massimo:         {round(riga['High'], 3)} €")
        print(f"Minimo:          {round(riga['Low'], 3)} €")
        print(f"Volume:          {int(riga['Volume']):,}")
    else:
        print(f"\nLa Borsa era chiusa il {data_target} (weekend o festività).")
        print("I giorni di contrattazione più vicini trovati sono:")
        print(df[['Open', 'Close']])

# --- ESEMPIO DI UTILIZZO ---
cerca_chiusura("RACE.MI", "2024-03-15")