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

Si aggiornano a ogni invio e ogni ~8 secondi se la finestra Chat è aperta.

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
