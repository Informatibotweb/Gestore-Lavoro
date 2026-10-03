NEXIQUAR · GOOGLE DRIVE – GUIDA
================================

STATO: Client ID configurato. Accesso obbligatorio con nexiquar@gmail.com
dopo la password locale (altrimenti il desktop non si apre).

Client ID:
1067372020805-i47ki5du62c4eotbee6b00q493lnipjm.apps.googleusercontent.com
(in drive-google.js)

Scope: drive.file + openid email
→ solo file creati dall'app, cartella "Nexiquar" sul Drive.

CHAT
----
I file di testo nella cartella Nexiquar:
  gruppo.txt
  ahmed_mattia.txt
  ahmed_silvio.txt
  mattia_silvio.txt

Formato riga messaggio:
  [YYYY-MM-DD HH:MM] Nome Cognome: testo del messaggio

Si aggiornano a ogni invio e ogni ~8 secondi se la finestra Chat è aperta.

PUBBLICAZIONE
-------------
Serve HTTPS (es. Netlify). Aggiungi l'URL tra gli Authorized JavaScript origins
in Google Cloud Console → Credenziali → Client OAuth.

PASSWORD LOCALI
---------------
Si cambiano da Impostazioni → Account (vecchia + nuova ×2).
Le modifiche restano nel browser (localStorage), non riscrivono credenziali.js.
