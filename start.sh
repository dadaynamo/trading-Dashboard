#!/bin/bash

# --- COLORI E FORMATTAZIONE STILE TERMINALE ---
NC='\033[0m' # Reset
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'

# Pulisce lo schermo all'avvio
clear

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}   ${BOLD}${GREEN}🚀 TRADING DASHBOARD - SERVER CONTROL PANEL${NC}            ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╗${NC}"
echo ""

# 1. Avvio del server Laravel in background
echo -e "[${YELLOW}i${NC}] Avvio del server backend Laravel..."
php artisan serve > /dev/null 2>&1 &
SERVER_PID=$!

# Attesa rapida per la partenza del server
sleep 1.5

# Verifica se il processo di Laravel è attivo
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "[${GREEN}✓${NC}] Server Laravel attivo su ${BOLD}http://127.0.0.1:8000${NC} (PID: $SERVER_PID)"
else
    echo -e "[${RED}✗${NC}] Impossibile avviare il server Laravel!"
    exit 1
fi

# 2. Apertura di Google Chrome sulla pagina dell'app
echo -e "[${YELLOW}i${NC}] Apertura di Google Chrome..."

if command -v google-chrome &> /dev/null; then
    google-chrome "http://127.0.0.1:8000" &> /dev/null &
elif command -v google-chrome-stable &> /dev/null; then
    google-chrome-stable "http://127.0.0.1:8000" &> /dev/null &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser "http://127.0.0.1:8000" &> /dev/null &
elif command -v chromium &> /dev/null; then
    chromium "http://127.0.0.1:8000" &> /dev/null &
else
    # Fallback al browser predefinito di sistema se Chrome non viene trovato col nome standard
    xdg-open "http://127.0.0.1:8000" &> /dev/null &
fi

echo ""
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
echo -e " ${BOLD}IL SERVER È IN ESECUZIONE.${NC}"
echo -e " Premi ${BOLD}${RED}[INVIO]${NC} oppure ${BOLD}${RED}[Q]${NC} per arrestare il server e uscire."
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
echo ""

# 3. Attesa del comando di spegnimento da parte dell'utente
read -n 1 -r -s key

echo -e "\n[${YELLOW}i${NC}] Arresto del server Laravel in corso..."

# Kill pulita del processo di Laravel
kill $SERVER_PID 2>/dev/null

echo -e "[${GREEN}✓${NC}] Server spento correttamente. Buona giornata!\n"