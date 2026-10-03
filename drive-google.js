/* ============================================================
   NEXIQUAR · Google Drive
   Collegamento reale al Google Drive dell'utente.

   Come funziona:
   - OAuth 2.0 con Google Identity Services (login "Accedi con Google")
   - Scope drive: accesso completo al Drive, per sfogliare le tue cartelle
     (Mattia, Ahmed, Silvio, Nexiquar…) e caricarci dentro i file
   - I file finiscono nella cartella che stai aprendo nel programma

   ATTENZIONE: richiede un sito online (https) e un OAuth Client ID.
   Da file:// Google rifiuta il login (origine non autorizzata).
   ============================================================ */

/* >>> INCOLLA QUI IL TUO OAUTH CLIENT ID DI GOOGLE CLOUD <<< */
const GOOGLE_CLIENT_ID =
  "1067372020805-i47ki5du62c4eotbee6b00q493lnipjm.apps.googleusercontent.com";

const GOOGLE_SCOPE =
  "https://www.googleapis.com/auth/drive openid email";

const GoogleDrive = {
  token: null,
  scadenza: 0,
  email: "",
  cartella: null,
  riconnessione: null,
  cacheUrl: new Map(), // id -> blob url (per non rigenerare gli url a ogni render)

  get configurato() {
    return !!GOOGLE_CLIENT_ID;
  },
  get online() {
    return location.protocol === "https:" || location.protocol === "http:";
  },
  get disponibile() {
    return this.configurato && this.online;
  },
  get connesso() {
    return !!this.token && Date.now() < this.scadenza;
  },

  /* ---------- errore chiaro per ogni situazione ---------- */
  errore() {
    if (!this.configurato)
      return new Error(
        "Google Drive non è ancora configurato: manca l'OAuth Client ID."
      );
    if (!this.online)
      return new Error(
        "Google Drive funziona solo con il sito online. Apri il programma da Netlify (non con il file sul computer)."
      );
    return new Error("Google Drive non collegato.");
  },

  /* ---------- caricamento libreria di accesso Google ---------- */
  scriptGis() {
    return new Promise((risolvi, rifiuta) => {
      if (window.google && window.google.accounts) return risolvi();
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => risolvi();
      s.onerror = () =>
        rifiuta(new Error("Impossibile contattare il servizio di accesso Google."));
      document.head.appendChild(s);
    });
  },

  /* ---------- accesso (finestra "Accedi con Google") ---------- */
  async apri(silenzioso = false) {
    if (!this.configurato || !this.online) throw this.errore();
    if (this.connesso) return this.token;
    await this.scriptGis();

    return new Promise((risolvi, rifiuta) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPE,
        prompt: silenzioso ? "none" : "",
        callback: (ris) => {
          if (ris.error) {
            // "interaction_required" = serve cliccare di nuovo: nessun errore da mostrare
            if (silenzioso) return rifiuta(new Error("silenzioso"));
            return rifiuta(
              new Error("Accesso Google non completato (" + ris.error + ").")
            );
          }
          this.token = ris.access_token;
          this.scadenza = Date.now() + (Number(ris.expires_in || 3600) - 60) * 1000;
          // prima di considerarci collegati recuperiamo l'email del conto
          this.prendiEmail().finally(() => risolvi(this.token));
        },
        error_callback: (err) => {
          if (silenzioso) return rifiuta(new Error("silenzioso"));
          const tipo = err && err.type;
          const msg =
            tipo === "popup_closed"
              ? "Hai chiuso la finestra di accesso."
              : tipo === "popup_failed_to_open"
                ? "Il browser ha bloccato la finestra di accesso: consenti i popup per questo sito."
                : "Accesso Google non riuscito" +
                  (err && err.message ? " (" + err.message + ")"
                    : tipo ? " (" + tipo + ")" : "") + ".";
          rifiuta(new Error(msg));
        },
      });
      client.requestAccessToken();
    });
  },

  /* riconnessione automatica e silenziosa (nessuna finestra) */
  riconnetti() {
    if (!this.disponibile || this.connesso) return Promise.resolve(false);
    if (this.riconnessione) return this.riconnessione;
    this.riconnessione = this.apri(true)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        this.riconnessione = null;
      });
    return this.riconnessione;
  },

  async prendiEmail() {
    try {
      const ris = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: "Bearer " + this.token },
      });
      const j = await ris.json();
      this.email = j.email || "";
    } catch (e) {
      this.email = this.email || "";
    }
    // la mail dell'account collegato resta salvata nel browser
    if (this.email) {
      try { localStorage.setItem("nexiquar_google_email", this.email); } catch (e) {}
    }
    if (typeof aggiornaStatoCloud === "function") aggiornaStatoCloud();
  },

  disconnetti() {
    const t = this.token;
    this.token = null;
    this.scadenza = 0;
    this.email = "";
    this.cartella = null;
    try { localStorage.removeItem("nexiquar_google_email"); } catch (e) {}
    this.cacheUrl.forEach((u) => URL.revokeObjectURL(u));
    this.cacheUrl.clear();
    if (typeof aggiornaStatoCloud === "function") aggiornaStatoCloud();
    if (t && window.google && window.google.accounts) {
      try { window.google.accounts.oauth2.revoke(t, () => {}); } catch (e) {}
    }
  },

  /* ---------- richieste autenticate con retry sui token scaduti ---------- */
  async chiedi(url, opzioni = {}) {
    const invia = async () => {
      const ris = await fetch(url, {
        ...opzioni,
        headers: {
          ...(opzioni.headers || {}),
          Authorization: "Bearer " + this.token,
        },
      });
      if (ris.status === 401) throw Object.assign(new Error("token"), { scaduto: true });
      if (!ris.ok) {
        let msg = "Google Drive ha risposto " + ris.status;
        let corpo = "";
        try {
          const j = await ris.json();
          corpo = JSON.stringify(j);
          if (j.error && j.error.message) msg += " – " + j.error.message;
        } catch (e) {}
        // permesso insufficiente (es. consenso vecchio): serve ricollegarsi
        if (ris.status === 403 && /insufficient|scope/i.test(corpo)) {
          this.disconnetti();
          throw new Error(
            "Serve autorizzazione per le cartelle: premi “Collega Google Drive” e consenti di nuovo l'accesso."
          );
        }
        throw new Error(msg);
      }
      return ris;
    };

    if (!this.connesso) await this.apri();
    try {
      return await invia();
    } catch (e) {
      if (!e.scaduto) throw e;
      this.token = null;
      await this.apri();
      return invia();
    }
  },

  /* ---------- contenuto di una cartella (null = radice del Drive) ---------- */
  async contenuto(padreId) {
    const q = encodeURIComponent(
      (padreId ? "'" + padreId + "'" : "'root'") +
        " in parents and trashed=false"
    );
    const ris = await this.chiedi(
      "https://www.googleapis.com/drive/v3/files?q=" + q +
        "&pageSize=500&fields=files(id,name,mimeType,size,createdTime,modifiedTime)"
    );
    const j = await ris.json();
    return (j.files || []).map((f) => this.mappaVoce(f));
  },

  /* ---------- ricerca in tutto il Drive ---------- */
  async cerca(testo) {
    let voci = [];
    let token = null;
    for (let i = 0; i < 3; i++) {
      const ris = await this.chiedi(
        "https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse" +
          "&pageSize=1000&fields=nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime)" +
          (token ? "&pageToken=" + token : "")
      );
      const j = await ris.json();
      voci = voci.concat(j.files || []);
      token = j.nextPageToken;
      if (!token) break;
    }
    const t = testo.toLowerCase();
    return voci
      .filter((f) => (f.name || "").toLowerCase().includes(t))
      .map((f) => this.mappaVoce(f));
  },

  mappaVoce(f) {
    return {
      id: f.id,
      origine: "google",
      cartella: f.mimeType === "application/vnd.google-apps.folder",
      nome: f.name,
      tipo: f.mimeType || "application/octet-stream",
      size: Number(f.size || 0),
      data: f.modifiedTime || f.createdTime || new Date().toISOString(),
    };
  },

  /* ---------- nuova cartella ---------- */
  async creaCartella(nome, padreId) {
    const meta = {
      name: nome,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (padreId) meta.parents = [padreId];
    const ris = await this.chiedi(
      "https://www.googleapis.com/drive/v3/files?fields=id,name,createdTime",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      }
    );
    const c = await ris.json();
    return this.mappaVoce({
      id: c.id,
      name: c.name || nome,
      mimeType: "application/vnd.google-apps.folder",
      createdTime: c.createdTime,
    });
  },

  /* ---------- operazioni ---------- */
  async salva(file, padreId) {
    const fd = new FormData();
    const meta = { name: file.name };
    if (padreId) meta.parents = [padreId]; // senza parents finisce nella radice
    fd.append(
      "metadata",
      new Blob([JSON.stringify(meta)], { type: "application/json" })
    );
    fd.append("file", file);
    const ris = await this.chiedi(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime",
      { method: "POST", body: fd }
    );
    const f = await ris.json();
    return {
      id: f.id,
      origine: "google",
      nome: f.name,
      tipo: f.mimeType || file.type || "application/octet-stream",
      size: Number(f.size || file.size),
      data: f.createdTime || new Date().toISOString(),
    };
  },

  async url(rec) {
    if (this.cacheUrl.has(rec.id)) return this.cacheUrl.get(rec.id);
    const ris = await this.chiedi(
      "https://www.googleapis.com/drive/v3/files/" + rec.id + "?alt=media"
    );
    const blob = await ris.blob();
    const u = URL.createObjectURL(blob);
    this.cacheUrl.set(rec.id, u);
    return u;
  },

  async elimina(rec) {
    await this.chiedi(
      "https://www.googleapis.com/drive/v3/files/" + rec.id,
      { method: "DELETE" }
    );
    const u = this.cacheUrl.get(rec.id);
    if (u) {
      URL.revokeObjectURL(u);
      this.cacheUrl.delete(rec.id);
    }
  },
};

/* la mail dell'ultimo account collegato resta disponibile anche
   prima della riconnessione silenziosa (Impostazioni → Account) */
try {
  GoogleDrive.email = localStorage.getItem("nexiquar_google_email") || "";
} catch (e) {}
