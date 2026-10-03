NEXIQUAR · GOOGLE DRIVE – GUIDA DI CONFIGURAZIONE
==================================================

STATO ATTUALE: ✅ Client ID già inserito in drive-google.js.
Resta da fare: il punto 3 (pubblicare il sito) e il punto 4 (test).

Cosa fa: il pulsante "Collega Google Drive" della finestra File collega il
programma al TUO Google Drive. I file caricati finiscono nella cartella
"Nexiquar" del tuo Drive e li vedi da telefono, tablet e altri computer.

Prerequisito: il sito pubblicato su internet (es. Netlify). Da file:// Google
non concede l'accesso (origine non autorizzata).

--------------------------------------------------
1) GIÀ FATTO – OAuth Client ID
--------------------------------------------------
Client ID: 1067372020805-i47ki5du62c4eotbee6b00q493lnipjm.apps.googleusercontent.com
Già inserito in drive-google.js. Per cambiarlo: modifica la riga
GOOGLE_CLIENT_ID e aggiorna drive-google.js?v=N in index.html.

--------------------------------------------------
3) PUBBLICA IL SITO SU NETLIFY
--------------------------------------------------
 - Vai su https://app.netlify.com/ (lo stesso account di nexiquar.netlify.app)
 - "Add new site" → "Deploy manually" → trascina la cartella del programma
 - Aspetta il deploy e copia l'URL (es. https://nome-sito.netlify.app)
 - Se l'URL non è tra gli origin autorizzati su Google Cloud Console
   (API e servizi → Credenziali → ID cliente OAuth → Authorized JavaScript
   origins), aggiungilo e salva.

--------------------------------------------------
4) TEST
--------------------------------------------------
 - Apri il sito pubblicato, vai su File → "Collega Google Drive"
 - Accedi con Google e consenti l'accesso
 - Carica un file: appare in Drive → cartella "Nexiquar"
 - Da un altro dispositivo (telefono) apri lo stesso sito, collegati:
   i file sono tutti lì.

NOTE
 - Scope usato: drive.file = l'app vede e modifica SOLO i file che ha creato
   lei, mai i tuoi altri documenti.
 - Se l'applicazione è in "Testing" su Google Cloud, i token durano 7 giorni:
   dopo basta ricollegarsi (o premi "Pubblica app" nella schermata di consenso).
 - I file già presenti in locale restano visibili con l'etichetta
   "💾 Questo computer"; quelli nuovi vanno su Google Drive.
