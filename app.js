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

/* ---- crittografia (SHA-256 + HMAC) ---- */
const CHIAVE_FIRMA_CHAT = "Nexiquar·Chat·v1·2026·sig"; // legata agli hash password

async function sha256Hex(testo) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(testo))
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(chiave, dati) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(chiave)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(dati))
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function passwordOverrides() {
  // mappa nome → passwordHash (SHA-256 hex)
  try {
    return JSON.parse(localStorage.getItem("nexiquar_pwd_v2") || "{}");
  } catch (e) { return {}; }
}

function salvaPasswordOverride(nome, hashHex) {
  const o = passwordOverrides();
  o[nome] = hashHex;
  try { localStorage.setItem("nexiquar_pwd_v2", JSON.stringify(o)); } catch (e) {}
}

function credenziali() {
  if (typeof CREDENZIALI === "undefined") return null;
  const ov = passwordOverrides();
  return CREDENZIALI.map((acc) => {
    const copia = Object.assign({}, acc);
    // passwordHash è l'unico campo segreto; override da localStorage se presente
    if (ov[acc.nome]) copia.passwordHash = ov[acc.nome];
    return copia;
  });
}

function hashDi(nomeUtente) {
  const lista = credenziali() || [];
  const acc = lista.find((a) => a.nome === nomeUtente);
  return acc ? acc.passwordHash : null;
}

async function chiaveFirmaPer(nomeUtente) {
  const h = hashDi(nomeUtente);
  if (!h) return null;
  // chiave derivata: non è la password in chiaro, né solo l'hash grezzo
  return sha256Hex(CHIAVE_FIRMA_CHAT + "|" + h);
}

let utenteCorrente = null;
const GOOGLE_OBBLIGATORIO = "nexiquar@gmail.com";

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

elemento("form-accesso").addEventListener("submit", async (e) => {
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
  // confronto solo sugli hash SHA-256 (mai password in chiaro)
  const hashInserito = await sha256Hex(password);
  const hashAtteso = accountScelto.passwordHash || "";
  if (!hashAtteso || hashInserito !== hashAtteso) {
    mostraErrore("Password errata. Riprova.");
    elemento("password").value = "";
    elemento("password").focus();
    return;
  }
  // Dopo la password corretta: obbligatorio accedere a Google come nexiquar@gmail.com
  avviaAccessoGoogleObbligatorio(accountScelto);
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
  utenteCorrente = utente;
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
  fermaPollChat();
  fermaPollCalendario();
  chiudiTutteLeFinestre();
  utenteCorrente = null;
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
  chat:         elemento("app-chat"),
};

function nomeAppPer(id) {
  if (id === "calendario") return "Calendario";
  if (id === "file") return "File";
  if (id === "chat") return "Chat";
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

  if (nome === "calendario") {
    renderCalendario();
    avviaPollCalendario();
    sincronizzaCalendario();
  }
  if (nome === "file") renderFile();
  if (nome === "chat") apriChat();
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
      const idF = finestra.id || "";
      let n = "impostazioni";
      if (idF.includes("calendario")) n = "calendario";
      else if (idF.includes("file")) n = "file";
      else if (idF.includes("chat")) n = "chat";
      toast(nomeAppPer(n), "Ridotto a icona nel Dock", "➖");
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

function salvaEventiLocali() {
  try { localStorage.setItem("nexiquar_eventi_v2", JSON.stringify(eventi)); } catch (e) {}
}

function salvaEventi() {
  // salvataggio locale + spinta su Google Drive (condiviso con tutti)
  salvaEventiLocali();
  spingiCalendario();
}

/* ---------- eventi condivisi: calendario.json sul Drive ---------- */
const FILE_CALENDARIO = "calendario.json";
const CHIAVE_MIGRA_CAL = "nexiquar_cal_migrato";
let calendarioCacheTesto = "";
let calendarioInCaricamento = false;
let calendarioGen = 0;            // protezione dagli incroci letto/scritto
let calendarioPollTimer = null;

/* legge calendario.json: [{data, ora, testo, nome, sig}, …] firmato */
async function parseEventi(testo) {
  if (!testo || !testo.trim()) return [];
  let dati;
  try { dati = JSON.parse(testo); } catch (e) { return []; }
  if (!Array.isArray(dati)) return [];
  const out = [];
  for (const e of dati) {
    if (!e || typeof e !== "object") continue;
    const ev = {
      data: String(e.data || ""),
      ora: String(e.ora || "09:00"),
      testo: String(e.testo || ""),
      nome: String(e.nome || ""),
      sig: String(e.sig || ""),
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.data) || !ev.testo) continue;
    const valida = await verificaFirma({
      ora: ev.data + " " + ev.ora, nome: ev.nome, testo: ev.testo, sig: ev.sig,
    });
    if (!valida) continue;        // file modificato a mano → scartato
    out.push(ev);
  }
  return out;
}

async function serializzaEventi(lista) {
  const out = [];
  for (const e of lista) {
    const ev = {
      data: e.data,
      ora: e.ora || "09:00",
      testo: e.testo,
      nome: e.nome || "",
    };
    // firma su data+ora+nome+testo (come la chat: mano sulla file e scartato)
    const sig = await firmaMessaggio(ev.data + " " + ev.ora, ev.nome, ev.testo);
    if (sig) ev.sig = sig;
    out.push(ev);
  }
  return JSON.stringify(out, null, 2);
}

function eventoChiave(e) {
  return e.data + "|" + (e.ora || "09:00") + "|" + e.testo;
}

/* scrive gli eventi su Drive; il contatore gen evita che una
   scrittura vecchia sovrascriva quella appena fatta */
async function spingiCalendario() {
  if (typeof GoogleDrive === "undefined" || !GoogleDrive.connesso) return;
  const gen = ++calendarioGen;
  try {
    const testo = await serializzaEventi(eventi);
    if (gen !== calendarioGen) return;
    await GoogleDrive.scriviTesto(FILE_CALENDARIO, testo);
    calendarioCacheTesto = testo;
  } catch (e) {
    toast("Calendario", "Salvataggio su Drive non riuscito", "⚠️");
  }
}

/* scarica calendario.json dalla cartella Nexiquar; la PRIMA volta unisce
   (e pubblica) gli eventi salvati solo su questo computer, poi il Drive
   fa fede: quello che un altro utente cancella resta cancellato */
async function sincronizzaCalendario() {
  if (calendarioInCaricamento) return;
  if (typeof GoogleDrive === "undefined" || !GoogleDrive.connesso) return;
  calendarioInCaricamento = true;
  const gen = calendarioGen;
  try {
    let migrato = false;
    try { migrato = localStorage.getItem(CHIAVE_MIGRA_CAL) === "1"; } catch (e) {}
    const testo = await GoogleDrive.leggiTesto(FILE_CALENDARIO);
    const cloud = await parseEventi(testo);
    let lista = cloud;
    let pubblica = false;
    if (!migrato) {
      const chiavi = new Set(cloud.map(eventoChiave));
      lista = cloud.slice();
      let locali = [];
      try { locali = JSON.parse(localStorage.getItem("nexiquar_eventi_v2") || "[]"); } catch (e) {}
      for (const e of locali) {
        if (!e || !e.data || !e.testo) continue;
        if (chiavi.has(eventoChiave(e))) continue;
        // gli eventi locali senza autore prendono chi li sincronizza
        lista.push({
          data: e.data,
          ora: e.ora || "09:00",
          testo: e.testo,
          nome: e.nome || (utenteCorrente ? utenteCorrente.nome : ""),
        });
        pubblica = true;
      }
    }
    const nuovo = await serializzaEventi(lista);
    if (gen !== calendarioGen) return;      // nel frattempo ho salvato: al prossimo giro
    if (pubblica) await GoogleDrive.scriviTesto(FILE_CALENDARIO, nuovo);
    try { localStorage.setItem(CHIAVE_MIGRA_CAL, "1"); } catch (e) {}
    if (nuovo === calendarioCacheTesto) return;   // nessun cambiamento
    calendarioCacheTesto = nuovo;
    eventi = lista;
    salvaEventiLocali();
    renderCalendario();
  } catch (e) {
    if (window.console) console.warn("Calendario:", e.message);
  } finally {
    calendarioInCaricamento = false;
  }
}

/* aggiornamenti dagli altri: controlla ogni5 secondi se la finestra
   Calendario è aperta (stesso principio della chat) */
function avviaPollCalendario() {
  if (calendarioPollTimer) return;
  calendarioPollTimer = setInterval(() => {
    if (APP.calendario && !APP.calendario.classList.contains("nascosto"))
      sincronizzaCalendario();
  }, 5000);
}

function fermaPollCalendario() {
  if (calendarioPollTimer) {
    clearInterval(calendarioPollTimer);
    calendarioPollTimer = null;
  }
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
      const oraEl = document.createElement("span");
      oraEl.className = "ora";
      oraEl.textContent = ev.ora;
      e.appendChild(oraEl);
      const autore = ev.nome ? primoNome(ev.nome) + ": " : "";
      e.appendChild(document.createTextNode(" " + autore + ev.testo));
      e.title = (ev.nome ? ev.nome + " · " : "") + ev.testo;
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
    li.innerHTML =
      '<span class="pallino"></span>' +
      '<span class="testo-ev"></span>' +
      '<span class="ora-ev"></span>' +
      '<button class="cancella" title="Elimina">×</button>';
    $(".testo-ev", li).textContent = ev.testo;
    $(".ora-ev", li).textContent = ev.ora;
    if (ev.nome) {
      const a = document.createElement("span");
      a.className = "autore-ev";
      a.textContent = primoNome(ev.nome);
      a.title = ev.nome;
      li.insertBefore(a, $(".testo-ev", li));
    }
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
  eventi.push({
    data: giornoSel,
    ora: elemento("ora-evento").value || "09:00",
    testo,
    nome: utenteCorrente ? utenteCorrente.nome : "",
  });
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
  percorso: [],          // cartelle aperte: [{id, nome}] — vuoto = radice
  avvisoPermesso: false, // evita di ripetere il messaggio "ricollegati"

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

  /* ---------- navigazione delle cartelle ---------- */
  cartellaAttuale() {
    return this.percorso.length
      ? this.percorso[this.percorso.length - 1].id
      : null;
  },
  cartellaNome() {
    return this.percorso.length
      ? this.percorso[this.percorso.length - 1].nome
      : "";
  },
  apriCartella(voce) {
    this.percorso.push({ id: voce.id, nome: voce.nome });
    return Promise.resolve();
  },
  tornaA(quanti) {
    this.percorso = this.percorso.slice(0, quanti);
    return Promise.resolve();
  },

  async elenco(termine) {
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

    // file e cartelle su Google Drive (se collegato)
    if (typeof GoogleDrive !== "undefined" && GoogleDrive.disponibile) {
      if (!GoogleDrive.connesso) {
        // tentativo silenzioso: se il consenso è già stato dato rientra da solo
        const ok = await GoogleDrive.riconnetti();
        if (ok) aggiornaStatoCloud();
        else if (GoogleDrive.email && !this.avvisoPermesso) {
          // la mail è salvata ma l'accesso non vale più: serve ricollegarsi
          this.avvisoPermesso = true;
          toast("Google Drive",
            "Accesso scaduto: premi “Collega Google Drive” e accetta di nuovo.", "🔑");
        }
      }
      if (GoogleDrive.connesso) {
        try {
          const trovati = termine
            ? await GoogleDrive.cerca(termine)
            : await GoogleDrive.contenuto(this.cartellaAttuale());
          this.avvisoPermesso = false;
          let base;
          if (termine) {
            // ricerca globale: Drive + i file locali con lo stesso nome
            base = locali.filter((f) =>
              f.nome.toLowerCase().includes(termine.toLowerCase()));
          } else {
            // i file di questo computer compaiono solo nella radice
            base = this.percorso.length ? [] : locali;
          }
          return ordinaVoci(base.concat(trovati));
        } catch (e) {
          if (window.console) console.warn("Google Drive:", e.message);
          if ((e.message || "").indexOf("Serve autorizzazione") >= 0 &&
              !this.avvisoPermesso) {
            this.avvisoPermesso = true;
            toast("Google Drive", e.message, "⚠️");
          }
        }
      }
    }

    if (this.percorso.length) return [];
    if (termine)
      locali = locali.filter((f) =>
        f.nome.toLowerCase().includes(termine.toLowerCase()));
    return ordinaVoci(locali);
  },

  async salva(file) {
    await this.init();

    // collegato a Google Drive → il file finisce nella cartella aperta
    if (typeof GoogleDrive !== "undefined" && GoogleDrive.connesso) {
      return GoogleDrive.salva(file, this.cartellaAttuale());
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
      // se abbiamo eliminato una cartella del percorso torniamo al genitore
      if (rec.cartella) {
        const i = this.percorso.findIndex((p) => p.id === rec.id);
        if (i >= 0) this.percorso = this.percorso.slice(0, i);
      }
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

/* ordina come Google Drive: prima le cartelle, poi per data di modifica */
function ordinaVoci(voci) {
  return voci.sort((a, b) =>
    (!!b.cartella) - (!!a.cartella) || b.data.localeCompare(a.data)
  );
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

function urlGoogleOnline(rec) {
  const id = encodeURIComponent(rec.id);
  const t = rec.tipo || "";
  if (t.indexOf("spreadsheet") >= 0) return "https://docs.google.com/spreadsheets/d/" + id;
  if (t.indexOf("presentation") >= 0) return "https://docs.google.com/presentation/d/" + id;
  if (t.indexOf("drawing") >= 0) return "https://docs.google.com/drawings/d/" + id;
  if (t.indexOf("document") >= 0) return "https://docs.google.com/document/d/" + id;
  return "https://drive.google.com/open?id=" + id;
}

/* breadcrumb "☁ Il mio Drive › Mattia › …" (solo da collegati;
   durante la ricerca mostra "Risultati per …") */
function aggiornaPercorso() {
  const riga = elemento("riga-percorso");
  const nav = elemento("percorso-drive");
  const btnNC = elemento("nuova-cartella");
  const termine = (elemento("cerca-file").value || "").trim();
  const connesso = typeof GoogleDrive !== "undefined" && GoogleDrive.connesso;
  if (btnNC) btnNC.classList.toggle("nascosto", !connesso || !!termine);
  if (!riga || !nav) return;
  riga.classList.toggle("nascosto", !connesso);
  nav.innerHTML = "";
  if (!connesso) return;

  if (termine) {
    const ris = document.createElement("span");
    ris.className = "perc-seg perc-attuale";
    ris.textContent = "🔍 Risultati per “" + termine + "” in tutto il Drive";
    nav.appendChild(ris);
    return;
  }

  const segmenti = [{ nome: "Il mio Drive", quanti: 0 }];
  Drive.percorso.forEach((p, i) => segmenti.push({ nome: p.nome, quanti: i + 1 }));
  segmenti.forEach((s, i) => {
    const attuale = i === segmenti.length - 1;
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "perc-sep";
      sep.textContent = "›";
      nav.appendChild(sep);
    }
    const b = document.createElement("button");
    b.type = "button";
    b.className = "perc-seg" + (attuale ? " attuale" : "");
    b.textContent = (i === 0 ? "☁ " : "") + s.nome;
    b.title = s.nome;
    if (attuale) b.setAttribute("aria-current", "page");
    else
      b.addEventListener("click", () => {
        Drive.tornaA(s.quanti);
        elemento("cerca-file").value = "";
        renderFile();
      });
    nav.appendChild(b);
  });
}

/* card di una cartella: un clic la apre (stile Google Drive) */
function creaCardCartella(f, i) {
  const card = document.createElement("div");
  card.className = "card-file cartella";
  card.style.animationDelay = Math.min(i * 0.03, 0.3) + "s";
  const quando = new Date(f.data).toLocaleDateString("it-IT",
    { day: "2-digit", month: "short", year: "numeric" });

  const antemina = document.createElement("div");
  antemina.className = "antemina-file";
  antemina.textContent = "📂";

  const nome = document.createElement("div");
  nome.className = "nome-file";
  nome.textContent = f.nome;
  nome.title = f.nome;

  const meta = document.createElement("div");
  meta.className = "meta-file";
  meta.textContent = "Cartella · " + quando;

  const azioni = document.createElement("div");
  azioni.className = "azioni-card";
  [["apri", "Apri"], ["elimina", "Elimina"]].forEach(([a, etichetta]) => {
    const b = document.createElement("button");
    b.dataset.azione = a;
    b.textContent = etichetta;
    if (a === "elimina") b.className = "cancella";
    azioni.appendChild(b);
  });

  card.append(antemina, nome, meta, azioni);
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")?.dataset.azione === "elimina") {
      eliminaRecord(f);
      return;
    }
    Drive.apriCartella(f);
    elemento("cerca-file").value = "";
    renderFile();
  });
  return card;
}

/* card di un file (con le icone di azione) */
function creaCardFile(f, i, sulCloud) {
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
  antemina.textContent = f.googleNativo ? "📝" : iconaFile(f.tipo, f.nome);

  const nome = document.createElement("div");
  nome.className = "nome-file";
  nome.textContent = f.nome;
  nome.title = f.nome;

  const meta = document.createElement("div");
  meta.className = "meta-file";
  meta.textContent = (f.googleNativo ? "Documento Google" : formatoDim(f.size)) +
    " · " + quando + (origine ? " · " + origine : "");

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

  return card;
}

async function renderFile() {
  await Drive.init();
  const termine = (elemento("cerca-file").value || "").trim();
  const lista = await Drive.elenco(termine);
  aggiornaStatoCloud();
  aggiornaPercorso();

  const elenco = elemento("elenco-file");
  const vuoto = elemento("drive-vuoto");
  const conta = elemento("contatore-file");
  const pannello = elemento("pannello-file-conta");
  const sulCloud =
    typeof GoogleDrive !== "undefined" && GoogleDrive.connesso;

  const nCartelle = lista.filter((f) => f.cartella).length;
  const nFile = lista.length - nCartelle;
  const conteggio =
    lista.length === 0 ? "Nessun elemento"
    : nCartelle === 0
      ? (nFile === 1 ? "1 file" : nFile + " file")
      : nFile === 0
        ? (nCartelle === 1 ? "1 cartella" : nCartelle + " cartelle")
        : nCartelle + " cartelle · " + nFile + " file";
  if (conta) conta.textContent = conteggio;
  if (pannello)
    pannello.textContent = lista.length === 0 ? "Nessun elemento salvato."
      : conteggio + " salvati.";

  const termini = termine.toLowerCase();
  const filtrati = lista.filter((f) => !termini || f.nome.toLowerCase().includes(termini));

  elenco.innerHTML = "";
  vuoto.classList.toggle("nascosto", filtrati.length > 0);

  // stato vuoto: cartella vuota, drive vuoto oppure ricerca senza risultati
  if (filtrati.length === 0) {
    vuoto.innerHTML = "";
    const icona = document.createElement("span");
    icona.className = "icona-vuota";
    const titolo = document.createElement("p");
    const nota = document.createElement("span");
    if (lista.length === 0) {
      if (sulCloud && Drive.percorso.length) {
        icona.textContent = "📂";
        titolo.textContent = "Questa cartella è vuota";
        nota.textContent = "Trascina qui i file: verranno salvati in “" +
          Drive.cartellaNome() + "”.";
      } else if (sulCloud) {
        icona.textContent = "📁";
        titolo.textContent = "Il tuo Google Drive è vuoto";
        nota.textContent = "Trascina qui i file: verranno salvati sul tuo Google Drive completo.";
      } else {
        icona.textContent = "📁";
        titolo.textContent = "Il tuo drive è vuoto";
        nota.textContent = "Trascina qui i file oppure premi “Carica file”.";
      }
    } else {
      icona.textContent = "🔍";
      titolo.textContent = "Nessun risultato";
      nota.textContent = "Nessun file corrisponde a “" + termine + "”.";
    }
    vuoto.append(icona, titolo, nota);
  }

  filtrati.forEach((f, i) => {
    const card = f.cartella ? creaCardCartella(f, i) : creaCardFile(f, i, sulCloud);
    elenco.appendChild(card);
  });
}

function scaricaRecord(rec) {
  if (rec.googleNativo) {
    window.open(urlGoogleOnline(rec), "_blank", "noopener");
    toast("Google", "“" + rec.nome + "” si apre su Google: usa File → Download.", "↗️");
    return;
  }
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
  const conferma = rec.cartella
    ? "Eliminare la cartella “" + rec.nome + "” e tutto il suo contenuto? " +
      "Finisce nel cestino di Google Drive."
    : "Eliminare “" + rec.nome + "” " +
      (rec.origine === "google" ? "dal tuo Google Drive" : "dal drive") + "?";
  if (!confirm(conferma)) return;
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
  urlCorrente = null;
  elemento("scarica-modal").onclick = () => scaricaRecord(rec);

  // i documenti Google non hanno contenuto scaricabile: si aprono online
  if (rec.googleNativo) {
    corpo.innerHTML = `<div class="nessuna-anteprima">
        <span class="grande">📝</span>
        <span>Documento Google</span>
        <span style="font-size:12.5px">${rec.nome}</span>
        <a class="pulsante apri-google" href="${urlGoogleOnline(rec)}" target="_blank" rel="noopener">Apri su Google ↗</a>
      </div>`;
    return;
  }

  urlCorrente = await Drive.url(rec);

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
    const cart = Drive.cartellaNome();
    const dove = ultimo && ultimo.origine === "google"
      ? (cart ? "in “" + cart + "” su Google Drive" : "su Google Drive")
      : "in locale";
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
    pulsante.title = "Accesso completo a tutti i file del Drive";
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
      ". Accesso al Drive completo attivo.", "☁️");
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
  Drive.percorso = [];
  Drive.avvisoPermesso = false;
  document.querySelector(".input-cartella")?.remove();
  toast("Google Drive", "Scollegato. I file cloud torneranno visibili al prossimo accesso.", "💾");
  await renderFile();
});

// collegamenti interfaccia
elemento("input-file").addEventListener("change", (e) => {
  caricaFiles(e.target.files);
  e.target.value = "";
});
elemento("cerca-file").addEventListener("input", renderFile);

/* nuova cartella: il pulsante mostra l'input, Invio crea, Esc annulla */
elemento("nuova-cartella").addEventListener("click", () => {
  const gia = document.querySelector(".input-cartella");
  if (gia) { gia.focus(); return; }
  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "input-cartella";
  inp.placeholder = "Nome della nuova cartella · Invio per creare, Esc per annullare";
  inp.maxLength = 100;
  inp.setAttribute("autocomplete", "off");
  inp.addEventListener("keydown", async (e) => {
    if (e.key === "Escape") { inp.remove(); return; }
    if (e.key !== "Enter") return;
    const nome = inp.value.trim();
    if (!nome) return;
    if (typeof GoogleDrive === "undefined" || !GoogleDrive.connesso) {
      toast("Google Drive", "Collega Google Drive per creare cartelle.", "⚠️");
      return;
    }
    inp.disabled = true;
    try {
      await GoogleDrive.creaCartella(nome, Drive.cartellaAttuale());
      inp.remove();
      toast("Drive",
        "Cartella “" + nome + "” creata" +
        (Drive.cartellaNome() ? " in “" + Drive.cartellaNome() + "”" : ""), "📁");
      await renderFile();
    } catch (err) {
      toast("Google Drive", err.message, "⚠️");
      inp.disabled = false;
      inp.focus();
    }
  });
  elemento("riga-percorso").appendChild(inp);
  inp.focus();
});
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


/* ============================================================
   ACCESSO GOOGLE OBBLIGATORIO (nexiquar@gmail.com)
   ============================================================ */
async function avviaAccessoGoogleObbligatorio(account) {
  mostraErrore("Collegamento a Google in corso…");
  try {
    if (typeof GoogleDrive === "undefined" || !GoogleDrive.configurato) {
      mostraErrore("Google Drive non configurato. Contatta l'amministratore.");
      return;
    }
    if (!GoogleDrive.online) {
      mostraErrore("Apri il sito online (https://…) per accedere. Da file:// non è possibile.");
      return;
    }
    await GoogleDrive.apri(false);
    const email = (GoogleDrive.email || "").toLowerCase().trim();
    if (email !== GOOGLE_OBBLIGATORIO) {
      GoogleDrive.disconnetti();
      mostraErrore(
        "Serve l'account Google " + GOOGLE_OBBLIGATORIO +
        ". Hai usato: " + (email || "sconosciuto") + ". Riprova."
      );
      return;
    }
    pulisciErrore();
    entra(account);
    aggiornaStatoCloud();
  } catch (e) {
    const msg = (e && e.message) ? e.message : "Accesso Google non riuscito";
    mostraErrore(msg);
  }
}

/* precarica la libreria di accesso Google: la richiesta "Accedi con Google"
   parte così istantaneamente appena si inserisce la password */
if (typeof GoogleDrive !== "undefined" && GoogleDrive.disponibile)
  GoogleDrive.scriptGis().catch(() => {});

/* ============================================================
   CAMBIA PASSWORD (Impostazioni → Account)
   ============================================================ */
elemento("form-cambia-password")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = elemento("msg-pwd");
  const mostra = (testo, ok) => {
    msg.textContent = testo;
    msg.classList.remove("nascosto", "ok");
    if (ok) msg.classList.add("ok");
  };
  if (!utenteCorrente) {
    mostra("Nessun utente connesso.", false);
    return;
  }
  const attuale = elemento("pwd-attuale").value;
  const nuova = elemento("pwd-nuova").value;
  const conferma = elemento("pwd-conferma").value;

  const lista = credenziali();
  const acc = lista.find((a) => a.nome === utenteCorrente.nome);
  const hashAttuale = await sha256Hex(attuale);
  if (!acc || !acc.passwordHash || acc.passwordHash !== hashAttuale) {
    mostra("Password attuale non corretta.", false);
    return;
  }
  if (!nuova || nuova.length < 4) {
    mostra("La nuova password deve avere almeno 4 caratteri.", false);
    return;
  }
  if (nuova !== conferma) {
    mostra("Le due nuove password non coincidono.", false);
    return;
  }
  if (nuova === attuale) {
    mostra("La nuova password è uguale a quella attuale.", false);
    return;
  }
  const nuovoHash = await sha256Hex(nuova);
  salvaPasswordOverride(utenteCorrente.nome, nuovoHash);
  utenteCorrente.passwordHash = nuovoHash;
  elemento("pwd-attuale").value = "";
  elemento("pwd-nuova").value = "";
  elemento("pwd-conferma").value = "";
  mostra("Password aggiornata correttamente.", true);
  toast("Sicurezza", "Password cambiata con successo", "🔒");
});

/* ============================================================
   CHAT · gruppo + privati (file JSON sul TUO Google Drive,
   nella cartella "Nexiquar" – nessun servizio esterno)
   ============================================================ */
function slugNome(nomeCompleto) {
  return (nomeCompleto || "").trim().split(/\s+/)[0].toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function primoNome(nomeCompleto) {
  return (nomeCompleto || "").trim().split(/\s+/)[0] || "";
}

/* file della conversazione: group.json · Ahmed-mattia.json ·
   Ahmed-silvio.json · Mattia-silvio.json */
function nomeFileChat(a, b) {
  if (!b || b === "gruppo") return "group.json";
  const coppia = [primoNome(a), primoNome(b)]
    .sort((x, y) => x.toLowerCase().localeCompare(y.toLowerCase()));
  const base = coppia.join("-").toLowerCase();
  return base.charAt(0).toUpperCase() + base.slice(1) + ".json";
}

/* nome del vecchio file .txt: serve solo a migrare lo storico */
function vecchioNomeFileChat(a, b) {
  if (!b || b === "gruppo") return "gruppo.txt";
  const x = slugNome(a);
  const y = slugNome(b);
  return [x, y].sort().join("_") + ".txt";
}

let chatAttiva = "gruppo";          // "gruppo" oppure nome completo del destinatario
let chatCacheTesto = "";
let chatPollTimer = null;
let chatInCaricamento = false;

function membriChat() {
  const dati = credenziali() || [];
  return dati.map((a) => a.nome);
}

function renderListaChatPrivate() {
  const box = elemento("lista-chat-private");
  if (!box || !utenteCorrente) return;
  box.innerHTML = "";
  membriChat()
    .filter((n) => n !== utenteCorrente.nome)
    .forEach((nome) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-voce" + (chatAttiva === nome ? " attiva" : "");
      btn.dataset.chat = nome;
      const iniz = nome.trim().charAt(0).toUpperCase();
      btn.innerHTML = `
        <span class="chat-ico">${iniz}</span>
        <span class="chat-voce-testo">
          <strong>${nome}</strong>
          <span>Messaggio diretto</span>
        </span>`;
      applicaColori($(".chat-ico", btn), nome);
      btn.addEventListener("click", () => selezionaChat(nome));
      box.appendChild(btn);
    });
}

function selezionaChat(id) {
  chatAttiva = id;
  $$(".chat-voce").forEach((v) => {
    v.classList.toggle("attiva", v.dataset.chat === id);
  });
  const isGruppo = id === "gruppo";
  elemento("chat-header-ico").textContent = isGruppo ? "👥" : id.trim().charAt(0).toUpperCase();
  elemento("chat-header-titolo").textContent = isGruppo ? "Chat di gruppo" : id;
  elemento("chat-header-sotto").textContent = isGruppo
    ? "Tutti i membri · sincronizzata su Google Drive"
    : "Privata · file " + nomeFileChat(utenteCorrente.nome, id);
  if (!isGruppo) applicaColori(elemento("chat-header-ico"), id);
  caricaMessaggiChat(true);
}

async function firmaMessaggio(ora, nome, testo) {
  const chiave = await chiaveFirmaPer(nome);
  if (!chiave) return null;
  // payload immutabile: se qualcuno cambia testo/ora/nome la firma non torna
  return hmacHex(chiave, ora + "|" + nome + "|" + testo);
}

async function verificaFirma(msg) {
  if (!msg.sig || !msg.nome) return false;
  const attesa = await firmaMessaggio(msg.ora, msg.nome, msg.testo);
  if (!attesa) return false;
  // confronto a tempo costante-ish
  if (attesa.length !== msg.sig.length) return false;
  let diff = 0;
  for (let i = 0; i < attesa.length; i++) {
    diff |= attesa.charCodeAt(i) ^ msg.sig.charCodeAt(i);
  }
  return diff === 0;
}

/* legge la conversazione in formato JSON:
   [{ "ora": ..., "nome": ..., "testo": ..., "visti": [...], "sig": ... }, …] */
async function parseMessaggi(testo) {
  if (!testo || !testo.trim()) return [];
  let dati;
  try { dati = JSON.parse(testo); } catch (e) { return []; }
  if (!Array.isArray(dati)) return [];
  const out = [];
  for (const m of dati) {
    if (!m || typeof m !== "object") continue;
    const msg = {
      ora: String(m.ora || ""),
      nome: String(m.nome || ""),
      testo: String(m.testo || ""),
      visti: Array.isArray(m.visti) ? m.visti.map(String) : [],
      sig: String(m.sig || ""),
    };
    if (!msg.ora || !msg.nome) continue;
    // rifiuta messaggi senza firma valida (file modificati a mano)
    if (!(await verificaFirma(msg))) continue;
    out.push(msg);
  }
  return out;
}

/* vecchio formato .txt (solo per migrare lo storico nel nuovo .json) */
async function parseMessaggiLegacy(testo) {
  const righe = (testo || "").split(/\r?\n/);
  const out = [];
  const re = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\]\s+(.+?):\s*(.*)$/;
  for (const r of righe) {
    if (!r.trim()) continue;
    const m = r.match(re);
    if (!m) continue;
    let corpo = m[3];
    let visti = [];
    let sig = "";
    const parti = corpo.split(" |§|");
    corpo = parti[0];
    for (let i = 1; i < parti.length; i++) {
      const p = parti[i];
      if (p.startsWith("seen:")) {
        visti = p.slice(5).split(";").map((s) => s.trim()).filter(Boolean);
      } else if (p.startsWith("sig:")) {
        sig = p.slice(4).trim();
      }
    }
    const msg = { ora: m[1], nome: m[2], testo: corpo, visti, sig };
    if (!(await verificaFirma(msg))) continue;
    out.push(msg);
  }
  return out;
}

/* crea un messaggio firmato {ora, nome, testo, visti, sig} */
async function oggettoMessaggio(nome, testo, visti) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp =
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  const msg = {
    ora: stamp,
    nome: nome,
    testo: testo.replace(/\r?\n/g, " "),
    visti: (visti || []).filter(Boolean),
  };
  const sig = await firmaMessaggio(stamp, nome, msg.testo);
  if (sig) msg.sig = sig;
  return msg;
}

/* serializza in JSON leggibile (2 spazi), firma inclusa */
async function serializzaMessaggi(lista) {
  const out = [];
  for (const m of lista) {
    const msg = {
      ora: m.ora,
      nome: m.nome,
      testo: m.testo,
      visti: (m.visti || []).filter(Boolean),
    };
    // ricalcola sempre la firma sul contenuto attuale (dopo update "visti")
    const sig = await firmaMessaggio(m.ora, m.nome, m.testo);
    if (sig) msg.sig = sig;
    out.push(msg);
  }
  return JSON.stringify(out, null, 2);
}

function avatarVisto(nome) {
  const el = document.createElement("span");
  el.className = "visto-avatar";
  el.title = nome + " ha visto";
  el.textContent = (nome || "?").trim().charAt(0).toUpperCase();
  el.setAttribute("aria-label", nome + " ha visto il messaggio");
  applicaColori(el, nome);
  return el;
}

function renderMessaggiChat(lista) {
  const box = elemento("chat-messaggi");
  const vuoto = elemento("chat-vuoto");
  if (!box) return;
  $$(".msg-chat", box).forEach((el) => el.remove());
  if (!lista.length) {
    if (vuoto) vuoto.classList.remove("nascosto");
    return;
  }
  if (vuoto) vuoto.classList.add("nascosto");
  const me = utenteCorrente ? utenteCorrente.nome : "";
  lista.forEach((m) => {
    const div = document.createElement("div");
    div.className = "msg-chat" + (m.nome === me ? " mio" : "");
    div.innerHTML =
      '<span class="msg-nome"></span>' +
      '<span class="msg-testo"></span>' +
      '<div class="msg-meta">' +
        '<span class="msg-ora"></span>' +
        '<span class="msg-visti"></span>' +
      '</div>';
    $(".msg-nome", div).textContent = m.nome;
    $(".msg-testo", div).textContent = m.testo;
    $(".msg-ora", div).textContent = m.ora;

    const boxVisti = $(".msg-visti", div);
    const vistiUnici = [...new Set((m.visti || []).filter((n) => n && n !== m.nome))];
    if (vistiUnici.length) {
      vistiUnici.forEach((n) => boxVisti.appendChild(avatarVisto(n)));
    }
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

/** Segna come letti i messaggi altrui e salva su Drive se qualcosa cambia */
async function marcaMessaggiComeVisti(file, testo) {
  if (!utenteCorrente) return testo;
  const me = utenteCorrente.nome;
  const lista = await parseMessaggi(testo);
  let cambiato = false;
  lista.forEach((m) => {
    if (m.nome === me) return;
    if (!(m.visti || []).includes(me)) {
      m.visti = [...(m.visti || []), me];
      cambiato = true;
    }
  });
  if (!cambiato) return testo;
  // Nota: "seen" non entra nella firma (solo ora|nome|testo), quindi ok aggiornare
  const nuovo = await serializzaMessaggi(lista);
  try {
    await GoogleDrive.scriviTesto(file, nuovo);
  } catch (e) {
    if (window.console) console.warn("Visti chat:", e.message);
    return testo;
  }
  return nuovo;
}

/* legge la chat .json; se non esiste ancora prova a migrare lo storico
   del vecchio formato .txt (il vecchio file resta lì, si può cancellare) */
async function leggiChatCorrente(file, vecchioFile) {
  const testo = await GoogleDrive.leggiTesto(file);
  if (testo) return testo;
  try {
    const t = await GoogleDrive.leggiTesto(vecchioFile);
    if (!t) return "";
    const lista = await parseMessaggiLegacy(t);
    if (!lista.length) return "";
    const j = await serializzaMessaggi(lista);
    await GoogleDrive.scriviTesto(file, j);
    toast("Chat", "Storico spostato nel nuovo file " + file, "📦");
    return j;
  } catch (e) {
    return "";
  }
}

async function caricaMessaggiChat(forza) {
  if (chatInCaricamento && !forza) return;
  if (!utenteCorrente) return;
  if (typeof GoogleDrive === "undefined" || !GoogleDrive.connesso) {
    renderMessaggiChat([]);
    const vuoto = elemento("chat-vuoto");
    if (vuoto) {
      vuoto.classList.remove("nascosto");
      vuoto.querySelector("p").textContent = "Google Drive non collegato";
      vuoto.querySelector("span:last-child").textContent =
        "Le chat richiedono l'account " + GOOGLE_OBBLIGATORIO + ".";
    }
    return;
  }
  chatInCaricamento = true;
  try {
    const file = nomeFileChat(
      utenteCorrente.nome,
      chatAttiva === "gruppo" ? "gruppo" : chatAttiva
    );
    const vecchio = vecchioNomeFileChat(
      utenteCorrente.nome,
      chatAttiva === "gruppo" ? "gruppo" : chatAttiva
    );
    let testo = await leggiChatCorrente(file, vecchio);
    testo = await marcaMessaggiComeVisti(file, testo);
    if (testo !== chatCacheTesto || forza) {
      chatCacheTesto = testo;
      renderMessaggiChat(await parseMessaggi(testo));
    }
  } catch (e) {
    if (window.console) console.warn("Chat:", e.message);
  } finally {
    chatInCaricamento = false;
  }
}

async function inviaMessaggioChat(testo) {
  if (!utenteCorrente || !testo.trim()) return;
  if (typeof GoogleDrive === "undefined" || !GoogleDrive.connesso) {
    toast("Chat", "Collega Google Drive (" + GOOGLE_OBBLIGATORIO + ") per inviare.", "⚠️");
    return;
  }
  const file = nomeFileChat(
    utenteCorrente.nome,
    chatAttiva === "gruppo" ? "gruppo" : chatAttiva
  );
  const vecchio = vecchioNomeFileChat(
    utenteCorrente.nome,
    chatAttiva === "gruppo" ? "gruppo" : chatAttiva
  );
  try {
    let lista = [];
    try { lista = await parseMessaggi(await leggiChatCorrente(file, vecchio)); }
    catch (e) {}
    lista.push(await oggettoMessaggio(
      utenteCorrente.nome,
      testo.trim(),
      [utenteCorrente.nome]
    ));
    const nuovo = await serializzaMessaggi(lista);
    await GoogleDrive.scriviTesto(file, nuovo);
    chatCacheTesto = nuovo;
    renderMessaggiChat(lista);
  } catch (e) {
    toast("Chat", e.message || "Invio non riuscito", "⚠️");
  }
}

function avviaPollChat() {
  fermaPollChat();
  chatPollTimer = setInterval(() => {
    if (APP.chat && !APP.chat.classList.contains("nascosto")) {
      caricaMessaggiChat(false);
    }
  }, 4000);
}

function fermaPollChat() {
  if (chatPollTimer) {
    clearInterval(chatPollTimer);
    chatPollTimer = null;
  }
}

function apriChat() {
  renderListaChatPrivate();
  // evidenzia gruppo
  $$(".chat-voce").forEach((v) =>
    v.classList.toggle("attiva", v.dataset.chat === chatAttiva)
  );
  selezionaChat(chatAttiva || "gruppo");
  avviaPollChat();
  setTimeout(() => elemento("input-chat")?.focus(), 150);
}

elemento("btn-chat-gruppo")?.addEventListener("click", () => selezionaChat("gruppo"));

elemento("form-chat")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = elemento("input-chat");
  const t = (input.value || "").trim();
  if (!t) return;
  input.value = "";
  inviaMessaggioChat(t);
});

/* ============================================================
   PERFORMANCE · riduci carico GPU/CPU all'avvio (MacBook 2015)
   ============================================================ */
(function ottimizzaAvvio() {
  let attiva = false;
  try {
    if (localStorage.getItem("nexiquar_riduci_mov") === "1") attiva = true;
  } catch (e) {}
  try {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    if (cores <= 4 || mem <= 4) attiva = true;
  } catch (e) {}
  if (attiva) {
    document.body.classList.add("riduci-movimento");
    $$(".interruttore[data-effetto=\"movimento\"]").forEach((el) => {
      el.classList.add("attivo");
      el.setAttribute("aria-checked", "true");
    });
  }
})();

// collega interruttore movimento a localStorage
$$(".interruttore").forEach((interruttore) => {
  if (interruttore.dataset.effetto === "movimento") {
    interruttore.addEventListener("click", () => {
      const attivo = interruttore.classList.contains("attivo");
      try { localStorage.setItem("nexiquar_riduci_mov", attivo ? "1" : "0"); } catch (e) {}
    });
  }
});


/* ---------------- avvio ---------------- */
initCalendario();
renderCalendario();
mostraAccount();
aggiornaStatoCloud();
