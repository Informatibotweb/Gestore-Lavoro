NEXIQUAR · GOOGLE DRIVE – GUIDA DI CONFIGURAZIONE
==================================================

STATO ATTUALE: ✅ Sito online su https://lavoronx.netlify.app
               ✅ Client ID inserito e origin autorizzato
               ✅ Login Google riuscito (consenso dato)
               ✅ Mail account salvata (Impostazioni → Account → Google Drive)
               ✅ Cartelle sfogliabili: Il mio Drive › Mattia / Ahmed /
                  Silvio / Nexiquar… (upload nella cartella aperta,
                  ricerca in tutto il Drive, nuova cartella, elimina)
Resta da fare: ripubblicare su Netlify dopo le modifiche e ricollegarsi.

IMPORTANTE – PERMESSO AMPIATO
Lo scope è ora "drive" completo (serve per vedere le cartelle che hai già
creato/rinominato tu nel Drive). Se in precedenza avevi già collegato,
premi di nuovo "Collega Google Drive" e consenti: Google chiede di
riconfermare l'accesso (altrimenti il programma mostra un avviso e il
pulsante "Collega" ricompare da solo).

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
 - Scope usato: drive = il programma vede e usa tutto il tuo Drive (serve per
   le tue cartelle già create). In Google Cloud l'app deve restare in
   "Testing" con il tuo account tra gli "utenti di prova".
 - Nella finestra File: un clic su una cartella la apre; il breadcrumb
   "☁ Il mio Drive › Mattia" torna indietro; "＋ Nuova cartella" crea una
   cartella dove ti trovi; "Elimina" la manda nel cestino di Google Drive.
 - La ricerca vale su TUTTO il Drive (non solo la cartella aperta).
 - I file Google nativi (Docs, Fogli, Presentazioni) non si scaricano:
   si aprono online con "Apri su Google".
 - I file già presenti in locale restano visibili con l'etichetta
   "💾 Questo computer" quando sei in radice; quelli nuovi vanno sul Drive.
 - ATTENZIONE all'archivio locale: quello creato aprendo index.html sul
   computer (file://) è SEPARATO da quello del sito online. I file caricati
   prima della pubblicazione non compaiono su Netlify: vanno ricaricati lì.
 - La mail dell'account Google collegato resta salvata nel browser
   (Impostazioni → Account → Google Drive) finché non premi "scollega".
