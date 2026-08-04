#!/bin/bash
echo "🚀 Avvio di TradingDash..."

# Apre il browser predefinito all'indirizzo dell'app dopo 2 secondi
(sleep 2 && xdg-open http://127.0.0.1:8000) &

# Avvia il server Laravel
php artisan serve