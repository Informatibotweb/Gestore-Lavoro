NEXIQUAR · GOOGLE DRIVE – GUIDA
================================

STATO: Client ID configurato. Accesso obbligatorio con nexiquar@gmail.com
dopo la password locale (altrimenti il desktop non si apre).

Client ID:
1067372020805-i47ki5du62c4eotbee6b00q493lnipjm.apps.googleusercontent.com
(in drive-google.js)

Scope: drive + openid email
→ accesso COMPLETO a tutto il Google Drive dell'account
  (non solo la cartella Nexiquar). I file chat restano in Nexiquar/.

CARTELLE (navigazione in File)
------------------------------
In File vedi le cartelle del Drive (Mattia, Ahmed, Silvio, Nexiquar…) come
in Google Drive:
- clic su una cartella = la apre; il percorso "☁ Il mio Drive › Mattia"
  mostra dove sei e permette di tornare indietro.
- i file caricati finiscono nella cartella APERTA (in radice se non ne apri).
- "＋ Nuova cartella" crea una cartella dove ti trovi (Invio = crea).
- la cerca in alto cerca in TUTTO il Drive, dentro e fuori dalle cartelle.
- i file di questo computer compaiono solo in radice (badge 💾).
- i documenti Google (Doc/Fogli) si aprono online con "Apri su Google ↗".

SE LE CARTELLE NON SI VEDONO
----------------------------
Il browser ha ancora un permesso vecchio (scope drive.file): l'app non
vede le cartella e mostra il messaggio "Serve autorizzazione per le
cartelle" (o il pulsante "☁ Collega Google Drive").
Soluzione: premi "☁ Collega Google Drive" e riaccetta i permessi nella
finestra di Google (se compare "app non verificata": Avanzato →
"Vai a lavoronx.netlify.app (non sicuro)"). Serve farlo una volta sola.

CHAT
----
I file di testo nella cartella Nexiquar:
  gruppo.txt
  ahmed_mattia.txt
  ahmed_silvio.txt
  mattia_silvio.txt

Formato riga messaggio:
  [YYYY-MM-DD HH:MM] Nome Cognome: testo |§|seen:Nome1;Nome2
  (i nomi dopo seen: sono chi ha aperto e visualizzato il messaggio)

Si aggiornano a ogni invio e ogni ~4 secondi se la finestra Chat è aperta.

PUBBLICAZIONE
-------------
Serve HTTPS (es. Netlify). Aggiungi l'URL tra gli Authorized JavaScript origins
in Google Cloud Console → Credenziali → Client OAuth.

PASSWORD LOCALI
---------------
Si cambiano da Impostazioni → Account (vecchia + nuova ×2).
Le modifiche restano nel browser (localStorage), non riscrivono credenziali.js.


IMPORTANTE – NUOVO SCOPE (Drive completo)
----------------------------------------
Lo scope è passato da drive.file a drive (accesso a TUTTI i file).

1) In Google Cloud Console → Schermata di consenso OAuth → Ambiti,
   aggiungi: https://www.googleapis.com/auth/drive
2) Sul sito: Impostazioni/File → scollega Google Drive, poi ricollega
   e accetta i nuovi permessi (altrimenti restano i vecchi token limitati).
3) In elenco File vedrai tutti i file del Drive di nexiquar@gmail.com
   (non solo la cartella Nexiquar). I messaggi chat restano in Nexiquar/.
