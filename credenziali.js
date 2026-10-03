// ============================================================
//  FILE CREDENZIALI - unico file da modificare per gli utenti
//  (non modificare gli altri file: basta questo)
// ============================================================
//
//  Le password NON sono in chiaro: solo hash SHA-256 (64 caratteri hex).
//  Per generare un nuovo hash (Node.js):
//    node -e "console.log(require('crypto').createHash('sha256').update('TUA_PASSWORD','utf8').digest('hex'))"
//  oppure dal browser (console):
//    crypto.subtle.digest('SHA-256', new TextEncoder().encode('TUA_PASSWORD'))
//      .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
//

const CREDENZIALI = [
  {
    nome: "Ahmed Osmanovic",
    utente: "Ahmed Osmanovic",
    passwordHash: "c8229ca29693e26bb8b70e4d490e050394806680005015a8ce9618aef5f3823a",
    ruolo: "Fondatore (CEO)"
  },
  {
    nome: "Mattia Berce",
    utente: "Mattia Berce",
    passwordHash: "0ef2c4aecc5297e444d8c2cafe26e9d4b4080db77feef6a8a429eb9bd0369ecf",
    ruolo: "Fondatore"
  },
  {
    nome: "Silvio Chen",
    utente: "Silvio Chen",
    passwordHash: "dfb09656f8931eb39e62334cb47b904dee3daa0471f8c973f207e934ae4231ee",
    ruolo: "Dipendente"
  }
];
