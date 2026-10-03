NEXIQUAR · GOOGLE DRIVE – GUIDA DI CONFIGURAZIONE
==================================================

Cosa fa: il pulsante "Collega Google Drive" della finestra File collega il
programma al TUO Google Drive. I file caricati finiscono nella cartella
"Nexiquar" del tuo Drive e li vedi da telefono, tablet e altri computer.

Prerequisito: il sito pubblicato su internet (es. Netlify). Da file:// Google
non concede l'accesso (origine non autorizzata).

--------------------------------------------------
1) CREA L'OAUTH CLIENT ID (5 minuti, una tantum)
--------------------------------------------------
Vai su https://console.cloud.google.com/ e acconta con il tuo Google.

 a. In alto a sinistra → "Nuovo progetto" → nome: Nexiquar → Crea.
 b. Menu ☰ → "API e servizi" → "Libreria" → cerca "Google Drive API"
    → "Abilita".
 c. Menu ☰ → "API e servizi" → "Schermata di consenso OAuth"
    → Tipo utente: "Esterno" → Crea.
    - Nome app: Nexiquar
    - Email di supporto: la tua email
    - Sito della home: l'URL del sito pubblicato (es. https://nexiquar.netlify.app)
    - Salva e continua → Aggiungi utenti di prova:
      aggiungi la TUA email (serve finché l'app è in "Testing")
    - Salva e continua →orna indietro alla dashboard.
 d. Menu ☰ → "API e servizi" → "Credenziali" → "+ Crea credenziali"
    → "ID cliente OAuth".
    - Tipo applicazione: "Applicazione Web"
    - Nome: Nexiquar
    - Autorizza gli origini JavaScript:
        http://localhost:8000                      (per i test locali)
        https://nexiquar.netlify.app               (il sito pubblicato)
        https://IL-TUO-SITO.netlify.app             (se usi un altro indirizzo)
      NON aggiungere file:// : Google lo rifiuta.
    - Crea → copia il "Client ID" (finisce con .apps.googleusercontent.com)

--------------------------------------------------
2) DAMMI IL CLIENT ID
--------------------------------------------------
Incollamelo qui in chat: lo inserisco io in drive-google.js al posto della
riga GOOGLE_CLIENT_ID = "".

--------------------------------------------------
3) PUBBLICA IL SITO SU NETLIFY
--------------------------------------------------
 - Vai su https://app.netlify.com/ (lo stesso account di nexiquar.netlify.app)
 - "Add new site" → "Deploy manually" → trascina la cartella del programma
 - Aspetta il deploy e copia l'URL (es. https://nome-sito.netlify.app)
 - Se l'URL non è tra le origin autorizzate al punto 1d, aggiungilo e salva.

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
