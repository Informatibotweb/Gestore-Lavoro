// ============================================================
//  Nexiquar · logica applicazione
//  Le credenziali stanno in credenziali.js (file separato)
// ============================================================ */

/* ---------------- utility ---------------- */
const $  = (sel, radice = document) => radice.querySelector(sel);
const $$ = (sel, radice = document) => [...radice.querySelectorAll(sel)];

function elemento(id) { return document.getElementById(id); }

/* ============================================================
   TOAST
   ============================================================ */
function toast(titolo, testo, ico = "ℹ️") {
  const contenitore = elemento("contenitore-toast");
  if (!contenitore) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span class="ico-toast">${ico}</span>
                 <div><strong>${titolo}</strong><span>${testo}</span></div>`;
  contenitore.appendChild(t);
  setTimeout(() => {
    t.classList.add("esce");
    setTimeout(() => t.remove(), 420);
  }, 3200);
}

/* ============================================================
   COLORI AVATAR (da nome)
   ============================================================ */
function coloriDi(nome) {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
  return {
    a: `hsl(${h}, 78%, 58%)`,
    b: `hsl(${(h + 55) % 360}, 72%, 48%)`,
  };
}
function applicaColori(el, nome) {
  if (!el) return;
  const c = coloriDi(nome);
  el.style.setProperty("--hue-a", c.a);
  el.style.setProperty("--hue-b", c.b);
}

/* ============================================================
   ACCESSO
   ============================================================ */
let accountScelto = null;

function credenziali() {
  if (typeof CREDENZIALI === "undefined") return null;
  return CREDENZIALI;
}

// Passo 1: lista account
function mostraAccount() {
  const lista = elemento("lista-account");
  const dati = credenziali();

  if (!dati || !dati.length) {
    lista.innerHTML = `<p class="vuoto">Nessun account trovato nel file credenziali.js</p>`;
    return;
  }

  lista.innerHTML = "";
  dati.forEach((acc, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "account";
    btn.innerHTML = `
      <span class="avatar-cerchio">${acc.nome.trim().charAt(0).toUpperCase()}</span>
      <span class="account-testo">
        <strong>${acc.nome}</strong>
        <span>${acc.ruolo || "Utente"}</span>
      </span>
      <span class="freccia-destra">›</span>`;
    applicaColori($(".avatar-cerchio", btn), acc.nome);
    btn.addEventListener("click", () => selezionaAccount(i));
    lista.appendChild(btn);
  });
}

function selezionaAccount(indice) {
  const dati = credenziali();
  if (!dati) return;
  accountScelto = dati[indice];

  elemento("avatar-login").textContent = accountScelto.nome.trim().charAt(0).toUpperCase();
  applicaColori(elemento("avatar-login"), accountScelto.nome);
  elemento("nome-scelto").textContent = accountScelto.nome;

  elemento("step-accounts").classList.add("nascosto");
  elemento("step-password").classList.remove("nascosto");

  const campo = elemento("password");
  campo.value = "";
  campo.type = "password";
  pulisciErrore();
  setTimeout(() => campo.focus(), 120);
}

function tornaAllaLista() {
  elemento("step-password").classList.add("nascosto");
  elemento("step-accounts").classList.remove("nascosto");
  accountScelto = null;
  pulisciErrore();
}

function mostraErrore(testo) {
  const el = elemento("messaggio-errore");
  el.textContent = testo;
  el.classList.remove("nascosto");
}
function pulisciErrore() {
  elemento("messaggio-errore")?.classList.add("nascosto");
}

elemento("btn-indietro")?.addEventListener("click", tornaAllaLista);

elemento("form-accesso").addEventListener("submit", (e) => {
  e.preventDefault();
  pulisciErrore();

  const password = elemento("password").value;

  if (!accountScelto) {
    mostraErrore("Seleziona prima un account.");
    return;
  }
  if (!password) {
    mostraErrore("Inserisci la password per continuare.");
    return;
  }
  if (accountScelto.password !== password) {
    mostraErrore("Password errata. Riprova.");
    elemento("password").value = "";
    elemento("password").focus();
    return;
  }
  entra(accountScelto);
});

/* ============================================================
   DASHBOARD / DESKTOP
   ============================================================ */
function titoloDelGiorno() {
  const h = new Date().getHours();
  if (h < 5)  return "Ancora sveglio?";
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function dataFormattata(d = new Date()) {
  return d.toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function aggiornaOrologio() {
  const ora = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const giorno = new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });

  const o1 = elemento("orologio");
  if (o1) o1.textContent = `${giorno}  ${ora}`;
  const o2 = elemento("orologio-accesso");
  if (o2) o2.textContent = `${dataFormattata()} · ${ora}`;
}

function entra(utente) {
  const nome = utente.nome;
  const iniziale = nome.trim().charAt(0).toUpperCase();

  [elemento("avatar"), elemento("avatar-mini"), elemento("avatar-account")]
    .forEach((el) => { if (el) el.textContent = iniziale; });
  [elemento("avatar"), elemento("avatar-mini"), elemento("avatar-account")]
    .forEach((el) => applicaColori(el, nome));

  elemento("titolo-benvenuto").textContent = `${titoloDelGiorno()}, ${nome.split(" ")[0]} 👋`;
  elemento("sottotitolo-benvenuto").textContent = "Sei connesso all'area di lavoro Nexiquar.";

  const ruolo = utente.ruolo || "Utente";
  elemento("ruolo-utente").textContent = ruolo;
  elemento("nome-laterale").textContent = nome;
  elemento("ruolo-laterale").textContent = ruolo;
  elemento("nome-account").textContent = nome;
  elemento("ruolo-account").textContent = ruolo;
  elemento("account-nome").textContent = nome;
  elemento("account-ruolo").textContent = ruolo;
  elemento("account-accesso").textContent =
    new Date().toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  aggiornaAccountGoogle();

  elemento("data-oggi").textContent = dataFormattata();
  aggiornaOrologio();

  elemento("schermata-accesso").classList.remove("attiva");
  elemento("schermata-interni").classList.add("attiva");

  try { sessionStorage.setItem("utenteLoggato", nome); } catch (e) {}

  setTimeout(() => toast("Accesso effettuato", `Bentornato, ${nome.split(" ")[0]}`, "👋"), 500);
}

function esci() {
  chiudiTutteLeFinestre();
  try { sessionStorage.removeItem("utenteLoggato"); } catch (e) {}
  elemento("schermata-interni").classList.remove("attiva");
  elemento("schermata-accesso").classList.add("attiva");
  tornaAllaLista();
  elemento("password").value = "";
}

elemento("btn-esci").addEventListener("click", esci);
elemento("btn-esci-account").addEventListener("click", esci);
elemento("btn-esci-laterale")?.addEventListener("click", esci);

/* ============================================================
   FINESTRE (apri / chiudi / riduci / ingrandisci / trascina)
   ============================================================ */
const APP = {
  impostazioni: elemento("app-impostazioni"),
  calendario:   elemento("app-calendario"),
  file:         elemento("app-file"),
};

function nomeAppPer(id) {
  if (id === "calendario") return "Calendario";
  if (id === "file") return "File";
  return "Impostazioni";
}

function apriApp(nome) {
  const finestra = APP[nome];
  if (!finestra) return;

  Object.values(APP).forEach((f) => f && f.classList.add("nascosto"));
  finestra.classList.remove("nascosto");

  // ripristina posizione e animazione di ingresso
  finestra.style.left = "";
  finestra.style.top = "";
  finestra.style.transform = "";
  finestra.style.animation = "";
  finestra.classList.remove("ingrandita");

  elemento("app-menu-nome").textContent = nomeAppPer(nome);

  $$(".dock-item[data-app]").forEach((b) =>
    b.classList.toggle("aperta", b.dataset.app === nome)
  );

  if (nome === "calendario") renderCalendario();
  if (nome === "file") renderFile();
}

function chiudiFinestra(finestra) {
  finestra.classList.add("nascosto");
  elemento("app-menu-nome").textContent = "Nexiquar";
  $$(".dock-item[data-app]").forEach((b) => b.classList.remove("aperta"));
}

function chiudiTutteLeFinestre() {
  Object.values(APP).forEach((f) => f && f.classList.add("nascosto"));
  elemento("app-menu-nome").textContent = "Nexiquar";
  $$(".dock-item[data-app]").forEach((b) => b.classList.remove("aperta"));
}

// semafori
$$(".finestra-app .luce").forEach((luce) => {
  luce.addEventListener("click", (e) => {
    e.stopPropagation();
    const finestra = luce.closest(".finestra-app");
    const azione = luce.dataset.azione;
    if (azione === "chiudi") chiudiFinestra(finestra);
    if (azione === "ingrandisci") finestra.classList.toggle("ingrandita");
    if (azione === "riduci") {
      chiudiFinestra(finestra);
      toast(nomeAppPer(finestra.id.includes("calendario") ? "calendario" : "impostazioni"),
            "Ridotto a icona nel Dock", "➖");
    }
  });
});

// dock
$$(".dock-item[data-app]").forEach((btn) =>
  btn.addEventListener("click", () => apriApp(btn.dataset.app))
);
$$("[data-azione-home]").forEach((btn) =>
  btn.addEventListener("click", chiudiTutteLeFinestre)
);

// schede scrivania
$$(".pannello[data-apri]").forEach((p) =>
  p.addEventListener("click", () => apriApp(p.dataset.apri))
);

// trascinamento finestra
// Le finestre sono figlie di .desktop (position: fixed, top: 42px):
// left/top sono coordinate del contenitore, non dello schermo.
// La posizione visiva va presa dal rettangolo (che include il transform di
// centratura translateX(-50%)) e poi convertita nel sistema del contenitore.
let trascinamento = null;
$$(".finestra-app .barra-finestra").forEach((barra) => {
  barra.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".luce")) return;
    const finestra = barra.closest(".finestra-app");
    if (finestra.classList.contains("ingrandita")) return;

    const cont = finestra.offsetParent || document.body;
    const contRect = cont.getBoundingClientRect();
    const r = finestra.getBoundingClientRect();

    // posizione visiva corrente, espressa in coordinate del contenitore
    const x = r.left - contRect.left;
    const y = r.top - contRect.top;

    // ferma l'animazione di ingresso: con fill-mode "both" resterebbe
    // applicata e sovrascriverebbe il transform, facendo scattare la finestra
    finestra.style.animation = "none";
    finestra.style.left = x + "px";
    finestra.style.top = y + "px";
    finestra.style.transform = "none";

    trascinamento = {
      finestra,
      startX: e.clientX,
      startY: e.clientY,
      baseX: x,
      baseY: y,
      contLeft: contRect.left,
      contTop: contRect.top,
    };
    try { barra.setPointerCapture(e.pointerId); } catch (err) {}
  });

  barra.addEventListener("pointermove", (e) => {
    if (!trascinamento) return;
    const t = trascinamento;
    const f = t.finestra;

    // limiti in coordinate del contenitore (viewport -> contenitore)
    const minLeft = -f.offsetWidth + 140 - t.contLeft;
    const maxLeft = window.innerWidth - 140 - t.contLeft;
    const minTop = 50 - t.contTop;                     // sempre sotto la menu bar
    const maxTop = window.innerHeight - 70 - t.contTop;

    let x = t.baseX + (e.clientX - t.startX);
    let y = t.baseY + (e.clientY - t.startY);
    x = Math.min(Math.max(x, minLeft), maxLeft);
    y = Math.min(Math.max(y, minTop), maxTop);

    f.style.left = x + "px";
    f.style.top = y + "px";
  });

  const fine = (e) => {
    if (!trascinamento) return;
    try { barra.releasePointerCapture(e.pointerId); } catch (err) {}
    trascinamento = null;
  };
  barra.addEventListener("pointerup", fine);
  barra.addEventListener("pointercancel", fine);
});

/* ============================================================
   IMPOSTAZIONI
   ============================================================ */
// sezioni (schede)
$$(".voce[data-sezione]").forEach((voce) => {
  voce.addEventListener("click", () => {
    $$(".voce").forEach((v) => v.classList.remove("attiva"));
    voce.classList.add("attiva");
    $$(".scheda-sett").forEach((s) =>
      s.classList.toggle("attiva", s.dataset.scheda === voce.dataset.sezione)
    );
  });
});

// interruttori
$$(".interruttore").forEach((interruttore) => {
  interruttore.addEventListener("click", () => {
    const attivo = interruttore.classList.toggle("attivo");
    interruttore.setAttribute("aria-checked", String(attivo));

    const effetto = interruttore.dataset.effetto;
    if (effetto === "trasparenza")
      document.body.classList.toggle("riduci-trasparenza", attivo);
    if (effetto === "movimento")
      document.body.classList.toggle("riduci-movimento", attivo);
    if (effetto === "wifi")
      toast("Wi‑Fi", attivo ? "Wi‑Fi attivato" : "Wi‑Fi disattivato", "📡");
  });
});

// colori accento
$$(".colore").forEach((c) => {
  c.addEventListener("click", () => {
    $$(".colore").forEach((x) => x.classList.remove("attivo"));
    c.classList.add("attivo");
    document.documentElement.style.setProperty("--accento", c.dataset.accento);
  });
});

// slider
$$('input[type="range"]').forEach((range) => {
  range.addEventListener("input", () => {
    const tipo = range.dataset.scala;
    const v = range.value;
    if (tipo === "luminosita") {
      document.documentElement.style.setProperty("--luminosita", v / 100);
      elemento("val-luminosita").textContent = v + "%";
    }
    if (tipo === "volume") elemento("val-volume").textContent = v + "%";
    if (tipo === "dock") {
      document.documentElement.style.setProperty("--dock-scale", v / 100);
      elemento("val-dock").textContent = v + "%";
    }
  });
});

// aggiornamento software (se presente)
elemento("btn-aggiorna")?.addEventListener("click", () => {
  toast("Aggiornamento", "Aggiornamento richiesto", "🔄");
});

/* ============================================================
   CALENDARIO
   ============================================================ */
const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
              "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

let vistaAnno, vistaMese;        // mese visualizzato
let giornoSel = chiave(new Date()); // giorno selezionato
let eventi = caricaEventi();

function chiave(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function caricaEventi() {
  try {
    // pulizia: rimuove gli eventi di esempio delle versioni precedenti
    localStorage.removeItem("nexiquar_eventi");
    localStorage.removeItem("nexiquar_eventi_v1");
    const salvati = localStorage.getItem("nexiquar_eventi_v2");
    if (salvati) return JSON.parse(salvati);
  } catch (e) {}
  return [];
}

function salvaEventi() {
  try { localStorage.setItem("nexiquar_eventi_v2", JSON.stringify(eventi)); } catch (e) {}
}

function initCalendario() {
  const oggi = new Date();
  vistaAnno = oggi.getFullYear();
  vistaMese = oggi.getMonth();
}

function renderCalendario() {
  elemento("titolo-mese").textContent = `${MESI[vistaMese]} ${vistaAnno}`;

  const griglia = elemento("griglia-giorni");
  griglia.innerHTML = "";

  const primo = new Date(vistaAnno, vistaMese, 1);
  const offset = (primo.getDay() + 6) % 7;          // lunedì = 0
  const inizio = new Date(vistaAnno, vistaMese, 1 - offset);

  const oggiKey = chiave(new Date());

  for (let i = 0; i < 42; i++) {
    const d = new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + i);
    const key = chiave(d);

    const cella = document.createElement("div");
    cella.className = "giorno";
    if (d.getMonth() !== vistaMese) cella.classList.add("altro-mese");
    if (key === oggiKey) cella.classList.add("oggi");
    if (key === giornoSel) cella.classList.add("selezionato");
    cella.dataset.key = key;

    cella.innerHTML = `<div class="num">${d.getDate()}</div>`;

    const delGiorno = eventi
      .filter((ev) => ev.data === key)
      .sort((a, b) => a.ora.localeCompare(b.ora));

    delGiorno.slice(0, 2).forEach((ev) => {
      const e = document.createElement("div");
      e.className = "evento";
      e.innerHTML = `<span class="ora">${ev.ora}</span> ${ev.testo}`;
      cella.appendChild(e);
    });
    if (delGiorno.length > 2) {
      const extra = document.createElement("div");
      extra.className = "evento piu";
      extra.textContent = `+${delGiorno.length - 2} altri`;
      cella.appendChild(extra);
    }

    cella.addEventListener("click", () => {
      giornoSel = key;
      renderCalendario();
      renderGiornoSelezionato();
    });

    griglia.appendChild(cella);
  }

  renderGiornoSelezionato();
}

function renderGiornoSelezionato() {
  const [a, m, g] = giornoSel.split("-").map(Number);
  const d = new Date(a, m - 1, g);

  elemento("titolo-giorno").textContent =
    `${d.toLocaleDateString("it-IT", { weekday: "long" })} ${g} ${MESI[m - 1]}`;

  const lista = elemento("elenco-eventi");
  const delGiorno = eventi
    .filter((ev) => ev.data === giornoSel)
    .sort((x, y) => x.ora.localeCompare(y.ora));

  if (!delGiorno.length) {
    lista.innerHTML = `<li class="vuoto" style="border:none;background:none;padding:4px 0">Nessun impegno</li>`;
    return;
  }

  lista.innerHTML = "";
  delGiorno.forEach((ev) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="pallino"></span>
      <span class="testo-ev">${ev.testo}</span>
      <span class="ora-ev">${ev.ora}</span>
      <button class="cancella" title="Elimina">×</button>`;
    $(".cancella", li).addEventListener("click", () => {
      eventi = eventi.filter((x) => x !== ev);
      salvaEventi();
      renderCalendario();
      toast("Calendario", "Impegno eliminato", "🗑️");
    });
    lista.appendChild(li);
  });
}

elemento("form-evento").addEventListener("submit", (e) => {
  e.preventDefault();
  const testo = elemento("testo-evento").value.trim();
  if (!testo) return;
  eventi.push({ data: giornoSel, ora: elemento("ora-evento").value || "09:00", testo });
  salvaEventi();
  elemento("testo-evento").value = "";
  renderCalendario();
  toast("Calendario", `Aggiunto: ${testo}`, "📅");
});

elemento("mese-prec").addEventListener("click", () => {
  vistaMese--;
  if (vistaMese < 0) { vistaMese = 11; vistaAnno--; }
  renderCalendario();
});
elemento("mese-succ").addEventListener("click", () => {
  vistaMese++;
  if (vistaMese > 11) { vistaMese = 0; vistaAnno++; }
  renderCalendario();
});
elemento("btn-oggi").addEventListener("click", () => {
  const oggi = new Date();
  vistaAnno = oggi.getFullYear();
  vistaMese = oggi.getMonth();
  giornoSel = chiave(oggi);
  renderCalendario();
});

/* ============================================================
   DRIVE NEXIQUAR · archivio file
   - Online (http/https): IndexedDB, nessun limite pratico
   - Da file:// (Chrome): IndexedDB non è disponibile →
     fallback automatico su localStorage con data-URL (~3 MB/file)
   - Se collegato a Google Drive (drive-google.js): i file nuovi
     finiscono sul Drive dell'utente, quelli locali restano visibili
   ============================================================ */
const CHIAVE_FILE = "nexiquar_file_v1";
const LIMITE_LS = 3 * 1024 * 1024;

const Drive = {
  db: null,
  tipo: "ls",
  pronto: false,

  apriIdb() {
    return new Promise((risolvi) => {
      try {
        const req = indexedDB.open("nexiquar_drive", 1);
        const timer = setTimeout(() => risolvi(null), 700); // su file:// resta in pending
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("file"))
            db.createObjectStore("file", { keyPath: "id" });
        };
        req.onsuccess = () => { clearTimeout(timer); risolvi(req.result); };
        req.onerror = () => { clearTimeout(timer); risolvi(null); };
      } catch (e) { risolvi(null); }
    });
  },

  async init() {
    if (this.pronto) return;
    this.db = await this.apriIdb();
    this.tipo = this.db ? "idb" : "ls";
    this.pronto = true;
    // prova a rientrare in Google Drive senza mostrare finestre
    if (typeof GoogleDrive !== "undefined" && GoogleDrive.disponibile)
      GoogleDrive.riconnetti().then((ok) => { if (ok) aggiornaStatoCloud(); });
  },

  leggiLs() {
    try { return JSON.parse(localStorage.getItem(CHIAVE_FILE) || "[]"); }
    catch (e) { return []; }
  },
  scriviLs(lista) {
    localStorage.setItem(CHIAVE_FILE, JSON.stringify(lista));
  },

  async elenco() {
    await this.init();

    // file locali
    let locali = [];
    if (this.tipo === "idb") {
      locali = await new Promise((risolvi) => {
        try {
          const r = this.db.transaction("file", "readonly").objectStore("file").getAll();
          r.onsuccess = () => risolvi(r.result);
          r.onerror = () => risolvi([]);
        } catch (e) { risolvi([]); }
      });
    } else {
      locali = this.leggiLs();
    }

    // file su Google Drive (se collegato)
    if (typeof GoogleDrive !== "undefined" && GoogleDrive.disponibile) {
      if (GoogleDrive.connesso) {
        try {
          const g = await GoogleDrive.elenco();
          return locali.concat(g).sort((a, b) => b.data.localeCompare(a.data));
        } catch (e) {
          if (window.console) console.warn("Google Drive:", e.message);
        }
      } else {
        // tentativo silenzioso: se il consenso è già stato dato rientra da solo
        const ok = await GoogleDrive.riconnetti();
        if (ok) {
          try {
            const g = await GoogleDrive.elenco();
            aggiornaStatoCloud();
            return locali.concat(g).sort((a, b) => b.data.localeCompare(a.data));
          } catch (e) {
            if (window.console) console.warn("Google Drive:", e.message);
          }
        }
      }
    }

    return locali.sort((a, b) => b.data.localeCompare(a.data));
  },

  async salva(file) {
    await this.init();

    // collegato a Google Drive → il file finisce sul Drive dell'utente
    if (typeof GoogleDrive !== "undefined" && GoogleDrive.connesso) {
      return GoogleDrive.salva(file);
    }

    const rec = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      nome: file.name,
      tipo: file.type || "application/octet-stream",
      size: file.size,
      data: new Date().toISOString(),
    };

    if (this.tipo === "idb") {
      rec.blob = file;
      await new Promise((risolvi, rifiuta) => {
        try {
          const r = this.db.transaction("file", "readwrite").objectStore("file").put(rec);
          r.onsuccess = () => risolvi();
          r.onerror = () => rifiuta(r.error);
        } catch (e) { rifiuta(e); }
      });
      return rec;
    }

    if (file.size > LIMITE_LS) {
      throw new Error(
        "“" + file.name + "” è troppo grande (" + formatoDim(file.size) +
        "), massimo ~3 MB con l'archivio locale. Pubblicando il sito online il limite sparisce."
      );
    }
    rec.url = await new Promise((risolvi, rifiuta) => {
      const fr = new FileReader();
      fr.onload = () => risolvi(fr.result);
      fr.onerror = () => rifiuta(fr.error);
      fr.readAsDataURL(file);
    });
    const lista = this.leggiLs();
    lista.push(rec);
    try { this.scriviLs(lista); }
    catch (e) {
      throw new Error("Spazio esaurito nell'archivio del browser: elimina qualche file.");
    }
    return rec;
  },

  async url(rec) {
    if (rec && rec.origine === "google" && typeof GoogleDrive !== "undefined")
      return GoogleDrive.url(rec);
    if (this.tipo === "idb" && rec.blob) return URL.createObjectURL(rec.blob);
    return rec.url;
  },

  async elimina(rec) {
    await this.init();
    if (rec && rec.origine === "google" && typeof GoogleDrive !== "undefined") {
      await GoogleDrive.elimina(rec);
      return;
    }
    const id = typeof rec === "object" ? rec.id : rec;
    if (this.tipo === "idb") {
      return new Promise((risolvi) => {
        try {
          const r = this.db.transaction("file", "readwrite").objectStore("file").delete(id);
          r.onsuccess = () => risolvi();
          r.onerror = () => risolvi();
        } catch (e) { risolvi(); }
      });
    }
    this.scriviLs(this.leggiLs().filter((f) => f.id !== id));
  },
};

function formatoDim(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function iconaFile(tipo, nome) {
  const t = (tipo || "").toLowerCase();
  const e = (nome || "").split(".").pop().toLowerCase();
  if (t.startsWith("image/")) return "🖼️";
  if (t.startsWith("audio/")) return "🎵";
  if (t.startsWith("video/")) return "🎬";
  if (t === "application/pdf" || e === "pdf") return "📕";
  if (t.includes("zip") || t.includes("compress") || ["zip","rar","7z","tar","gz"].includes(e)) return "🗜️";
  if (t.includes("sheet") || ["csv","xls","xlsx","ods"].includes(e)) return "📊";
  if (t.includes("presentation") || ["ppt","pptx","odp"].includes(e)) return "📽️";
  if (t.startsWith("text/") || ["txt","md","json","js","css","html","xml","log","ini","conf","py","sh"].includes(e)) return "📄";
  return "📎";
}

function testoAnteprima(tipo, nome) {
  const t = (tipo || "").toLowerCase();
  const e = (nome || "").split(".").pop().toLowerCase();
  return t.startsWith("text/") ||
    t === "application/json" || t === "application/xml" ||
    t === "application/javascript" || t.includes("html") ||
    ["txt","md","json","js","css","html","xml","csv","log","ini","py","sh"].includes(e);
}

/* ---------- interfaccia drive ---------- */
let urlCorrente = null;

async function renderFile() {
  await Drive.init();
  const lista = await Drive.elenco();
  aggiornaStatoCloud();

  const elenco = elemento("elenco-file");
  const vuoto = elemento("drive-vuoto");
  const conta = elemento("contatore-file");
  const pannello = elemento("pannello-file-conta");
  const sulCloud =
    typeof GoogleDrive !== "undefined" && GoogleDrive.connesso;

  if (conta) conta.textContent = lista.length === 1 ? "1 file" : lista.length + " file";
  if (pannello)
    pannello.textContent = lista.length === 0 ? "Nessun file salvato."
      : lista.length === 1 ? "1 file salvato." : lista.length + " file salvati.";

  const termini = (elemento("cerca-file").value || "").toLowerCase();
  const filtrati = lista.filter((f) => !termini || f.nome.toLowerCase().includes(termini));

  elenco.innerHTML = "";
  vuoto.classList.toggle("nascosto", filtrati.length > 0);

  // stato vuoto: drive vuoto oppure ricerca senza risultati
  if (filtrati.length === 0) {
    vuoto.innerHTML = "";
    const icona = document.createElement("span");
    icona.className = "icona-vuota";
    const titolo = document.createElement("p");
    const nota = document.createElement("span");
    if (lista.length === 0) {
      icona.textContent = "📁";
      titolo.textContent = sulCloud ? "Il tuo Google Drive è vuoto" : "Il tuo drive è vuoto";
      nota.textContent = sulCloud
        ? "Trascina qui i file: finiranno sul tuo Google Drive, cartella “Nexiquar”."
        : "Trascina qui i file oppure premi “Carica file”.";
    } else {
      icona.textContent = "🔍";
      titolo.textContent = "Nessun risultato";
      nota.textContent = "Nessun file corrisponde a “" + elemento("cerca-file").value + "”.";
    }
    vuoto.append(icona, titolo, nota);
  }

  filtrati.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "card-file";
      card.style.animationDelay = Math.min(i * 0.03, 0.3) + "s";
      const quando = new Date(f.data).toLocaleDateString("it-IT",
        { day: "2-digit", month: "short", year: "numeric" });
      // con il cloud attivo, i file rimasti sul computer mostrano da dove vengono
      const origine = f.origine === "google" ? "☁ Google"
        : sulCloud ? "💾 Questo computer" : "";

      const antemina = document.createElement("div");
      antemina.className = "antemina-file";
      antemina.textContent = iconaFile(f.tipo, f.nome);

      const nome = document.createElement("div");
      nome.className = "nome-file";
      nome.textContent = f.nome;
      nome.title = f.nome;

      const meta = document.createElement("div");
      meta.className = "meta-file";
      meta.textContent = formatoDim(f.size) + " · " + quando +
        (origine ? " · " + origine : "");

      const azioni = document.createElement("div");
      azioni.className = "azioni-card";
      [["apri", "Apri"], ["scarica", "Salva"], ["elimina", "Elimina"]].forEach(([a, etichetta]) => {
        const b = document.createElement("button");
        b.dataset.azione = a;
        b.textContent = etichetta;
        if (a === "elimina") b.className = "cancella";
        azioni.appendChild(b);
      });

      card.append(antemina, nome, meta, azioni);

      // anteprima miniatura per le immagini
      if ((f.tipo || "").startsWith("image/")) {
        Drive.url(f).then((u) => {
          const img = document.createElement("img");
          img.src = u;
          img.alt = "";
          antemina.innerHTML = "";
          antemina.appendChild(img);
        }).catch(() => {});
      }

      card.addEventListener("click", (e) => {
        const azione = e.target.closest("button")?.dataset.azione;
        if (azione === "scarica") { scaricaRecord(f); return; }
        if (azione === "elimina") { eliminaRecord(f); return; }
        apriAnteprima(f);
      });

      elenco.appendChild(card);
    });
}

function scaricaRecord(rec) {
  Drive.url(rec).then((u) => {
    const a = document.createElement("a");
    a.href = u;
    a.download = rec.nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Download", "“" + rec.nome + "” in download", "⬇️");
  });
}

async function eliminaRecord(rec) {
  const dove = rec.origine === "google" ? "dal tuo Google Drive" : "dal drive";
  if (!confirm("Eliminare “" + rec.nome + "” " + dove + "?")) return;
  try {
    await Drive.elimina(rec);
  } catch (e) {
    toast("Google Drive", e.message, "⚠️");
    return;
  }
  renderFile();
  toast("Drive", "“" + rec.nome + "” eliminato", "🗑️");
}

async function apriAnteprima(rec) {
  const modal = elemento("modal-file");
  const corpo = elemento("corpo-modal");
  const titolo = elemento("titolo-modal");

  titolo.textContent = rec.nome;
  corpo.innerHTML = `<div class="nessuna-anteprima"><span class="grande">⏳</span><span>Apertura…</span></div>`;
  modal.classList.remove("nascosto");

  if (urlCorrente && urlCorrente.startsWith("blob:")) URL.revokeObjectURL(urlCorrente);
  urlCorrente = await Drive.url(rec);
  elemento("scarica-modal").onclick = () => scaricaRecord(rec);

  if (testoAnteprima(rec.tipo, rec.nome)) {
    try {
      const ris = await fetch(urlCorrente);
      const testo = await ris.text();
      const pre = document.createElement("pre");
      pre.textContent = testo.length > 200000
        ? testo.slice(0, 200000) + "\n\n… (file troncato, usa “Scarica” per il completo)"
        : testo;
      corpo.innerHTML = "";
      corpo.appendChild(pre);
      return;
    } catch (e) { /* cade sotto all'anteprima generica */ }
  }

  if ((rec.tipo || "").startsWith("image/")) {
    corpo.innerHTML = `<img src="${urlCorrente}" alt="${rec.nome}">`;
    return;
  }
  if (rec.tipo === "application/pdf" || (rec.nome || "").toLowerCase().endsWith(".pdf")) {
    corpo.innerHTML = `<iframe src="${urlCorrente}" title="${rec.nome}"></iframe>`;
    return;
  }
  if ((rec.tipo || "").startsWith("video/")) {
    corpo.innerHTML = `<video src="${urlCorrente}" controls autoplay></video>`;
    return;
  }
  if ((rec.tipo || "").startsWith("audio/")) {
    corpo.innerHTML = `<div class="nessuna-anteprima"><span class="grande">🎵</span>
      <span>${rec.nome}</span><audio src="${urlCorrente}" controls autoplay style="width:80%"></audio></div>`;
    return;
  }

  corpo.innerHTML = `<div class="nessuna-anteprima">
      <span class="grande">${iconaFile(rec.tipo, rec.nome)}</span>
      <span>Anteprima non disponibile per questo formato</span>
      <span style="font-size:12.5px">${rec.tipo || "tipo sconosciuto"} · ${formatoDim(rec.size)}</span>
      <span style="font-size:12.5px">Usa “Scarica” per aprirlo con il programma di sistema.</span>
    </div>`;
}

function chiudiAnteprima() {
  elemento("modal-file").classList.add("nascosto");
  if (urlCorrente && urlCorrente.startsWith("blob:")) URL.revokeObjectURL(urlCorrente);
  urlCorrente = null;
}

async function caricaFiles(fileList) {
  const file = Array.from(fileList || []);
  if (!file.length) return;
  const sulCloud = typeof GoogleDrive !== "undefined" && GoogleDrive.connesso;
  let ok = 0;
  let ultimo = null;
  for (const f of file) {
    try { ultimo = await Drive.salva(f); ok++; }
    catch (e) { toast(sulCloud ? "Google Drive" : "Drive", e.message, "⚠️"); }
  }
  await renderFile();
  if (ok) {
    const dove = ultimo && ultimo.origine === "google" ? "su Google Drive" : "in locale";
    toast("Drive",
      (ok === 1 ? "“" + file[0].name + "” salvato " + dove
                : ok + " file salvati " + dove), "📁");
  }
}

/* ---------- stato della connessione Google Drive ---------- */
function aggiornaAccountGoogle() {
  const el = elemento("account-google");
  if (!el) return;
  let email = typeof GoogleDrive !== "undefined" ? GoogleDrive.email : "";
  if (!email) {
    try { email = localStorage.getItem("nexiquar_google_email") || ""; } catch (e) {}
  }
  el.textContent = email || "Non collegato";
}

function aggiornaStatoCloud() {
  const pulsante = elemento("pulsante-cloud");
  const stato = elemento("stato-cloud");
  aggiornaAccountGoogle();
  if (!pulsante || !stato || typeof GoogleDrive === "undefined") return;

  const connesso = GoogleDrive.connesso;
  const disponibile = GoogleDrive.disponibile;

  stato.classList.toggle("nascosto", !connesso);
  pulsante.classList.toggle("nascosto", connesso);

  if (connesso) {
    stato.textContent = "☁ " + (GoogleDrive.email || "Google Drive collegato");
    stato.title = "Premi per scollegare Google Drive";
  } else if (!GoogleDrive.configurato) {
    pulsante.classList.add("off");
    pulsante.setAttribute("aria-disabled", "true");
    pulsante.textContent = "☁ Google Drive non configurato";
    pulsante.title = "Manca l'OAuth Client ID: leggi README-drive-google.txt";
  } else if (!disponibile) {
    pulsante.classList.add("off");
    pulsante.setAttribute("aria-disabled", "true");
    pulsante.textContent = "☁ Google Drive online";
    pulsante.title = "Google funziona solo con il sito pubblicato: premi per sapere come fare";
  } else {
    pulsante.classList.remove("off");
    pulsante.removeAttribute("aria-disabled");
    pulsante.textContent = "☁ Collega Google Drive";
    pulsante.title = "I file caricati finiranno sul tuo Google Drive";
  }
}

elemento("pulsante-cloud").addEventListener("click", async () => {
  const pulsante = elemento("pulsante-cloud");

  // non collegabile qui → spieghiamo cosa fare invece di ignorare il click
  if (typeof GoogleDrive !== "undefined" && !GoogleDrive.disponibile) {
    if (!GoogleDrive.configurato)
      toast("Google Drive",
        "Manca il Client ID: leggi README-drive-google.txt", "ℹ️");
    else
      toast("Google Drive",
        "Funziona solo con il sito pubblicato: trascina la cartella su " +
        "app.netlify.com, apri l'URL che ti dà e premi qui di nuovo.", "☁️");
    return;
  }

  pulsante.classList.add("off");
  pulsante.setAttribute("aria-disabled", "true");
  pulsante.textContent = "Accesso in corso…";
  try {
    await GoogleDrive.apri();
    toast("Google Drive",
      "Collegato" + (GoogleDrive.email ? " – " + GoogleDrive.email : "") +
      ". I file caricati finiranno sul tuo Drive.", "☁️");
  } catch (e) {
    toast("Google Drive", e.message, "⚠️");
  } finally {
    aggiornaStatoCloud();
    await renderFile();
  }
});

elemento("stato-cloud").addEventListener("click", async () => {
  if (!confirm("Scollegare Google Drive? I file restano sul tuo Drive, quelli locali sul computer.")) return;
  GoogleDrive.disconnetti();
  toast("Google Drive", "Scollegato. I file cloud torneranno visibili al prossimo accesso.", "💾");
  await renderFile();
});

// collegamenti interfaccia
elemento("input-file").addEventListener("change", (e) => {
  caricaFiles(e.target.files);
  e.target.value = "";
});
elemento("cerca-file").addEventListener("input", renderFile);
elemento("chiudi-modal").addEventListener("click", chiudiAnteprima);
elemento("chiudi-modal-2").addEventListener("click", chiudiAnteprima);
elemento("modal-file").addEventListener("click", (e) => {
  if (e.target.id === "modal-file") chiudiAnteprima();
});

// trascina-e-rilascia
const zonaFile = elemento("zona-file");
["dragenter", "dragover"].forEach((ev) =>
  zonaFile.addEventListener(ev, (e) => {
    e.preventDefault();
    zonaFile.classList.add("trascinando");
    elemento("sottomesso").classList.remove("nascosto");
  })
);
["dragleave", "drop"].forEach((ev) =>
  zonaFile.addEventListener(ev, (e) => {
    e.preventDefault();
    zonaFile.classList.remove("trascinando");
    elemento("sottomesso").classList.add("nascosto");
  })
);
zonaFile.addEventListener("drop", (e) => caricaFiles(e.dataTransfer.files));

/* ============================================================
   EXTRAS
   ============================================================ */
// orologio
aggiornaOrologio();
setInterval(aggiornaOrologio, 15000);

// riflesso sui pannelli
document.addEventListener("pointermove", (e) => {
  const pannello = e.target.closest ? e.target.closest(".pannello") : null;
  if (!pannello) return;
  const r = pannello.getBoundingClientRect();
  pannello.style.setProperty("--mx", `${e.clientX - r.left}px`);
  pannello.style.setProperty("--my", `${e.clientY - r.top}px`);
});

// tastiera
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modal = elemento("modal-file");
    if (modal && !modal.classList.contains("nascosto")) { chiudiAnteprima(); return; }
    const aperta = Object.values(APP).find((f) => f && !f.classList.contains("nascosto"));
    if (aperta) chiudiFinestra(aperta);
    else if (elemento("schermata-interni").classList.contains("attiva")) esci();
    else if (!elemento("step-password").classList.contains("nascosto")) tornaAllaLista();
  }
});

/* ---------------- avvio ---------------- */
initCalendario();
renderCalendario();
mostraAccount();
