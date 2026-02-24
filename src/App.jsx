import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";

/* ─────────────────────────────────────────────
   TOKENS — Identité visuelle République française
   ───────────────────────────────────────────── */
const T = {
  bleu:      "#002395",   // Bleu officiel drapeau FR
  bleuMid:   "#1A3A8F",
  bleuLight: "#3F5FBD",
  bleuPale:  "#EEF1FA",
  blanc:     "#FFFFFF",
  rouge:     "#ED2939",   // Rouge officiel drapeau FR
  rougePale: "#FDF0F1",
  ardoise:   "#1C2B4A",   // Fond sombre institutionnel
  gris:      "#6B7280",
  grisClair: "#9CA3AF",
  grisLine:  "#E5E7EB",
  grisbg:    "#F8F9FC",
  encre:     "#0D1B2A",
  // Niveaux de maturité
  niveauExpose:     { fg: "#B91C1C", bg: "#FEF2F2", border: "#FCA5A5" },
  niveauVulnerable: { fg: "#C2410C", bg: "#FFF7ED", border: "#FDBA74" },
  niveauResiliant:  { fg: "#B45309", bg: "#FFFBEB", border: "#FCD34D" },
  niveauSouverain:  { fg: "#15803D", bg: "#F0FDF4", border: "#86EFAC" },
};

/* ─────────────────────────────────────────────
   LISERET TRICOLORE — composant signature
   ───────────────────────────────────────────── */
function Liseret({ height = 4 }) {
  return (
    <div style={{ display: "flex", height }}>
      <div style={{ flex: 1, background: T.bleu }} />
      <div style={{ flex: 1, background: T.blanc, borderTop: `1px solid ${T.grisLine}`, borderBottom: `1px solid ${T.grisLine}` }} />
      <div style={{ flex: 1, background: T.rouge }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOGO
   ───────────────────────────────────────────── */
function Logo({ light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Cocarde */}
      <div style={{ position: "relative", width: 36, height: 36 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: T.rouge,
        }} />
        <div style={{
          position: "absolute", inset: 4, borderRadius: "50%",
          background: T.blanc,
        }} />
        <div style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          background: T.bleu,
        }} />
      </div>
      <div>
        <div style={{
          fontSize: 20,
          fontFamily: "'Marianne', 'Helvetica Neue', Helvetica, sans-serif",
          fontWeight: 700,
          color: light ? T.blanc : T.bleu,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}>
          SovNum
        </div>
        <div style={{
          fontSize: 10,
          fontFamily: "'Marianne', 'Helvetica Neue', Helvetica, sans-serif",
          fontWeight: 400,
          color: light ? "rgba(255,255,255,0.6)" : T.gris,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          marginTop: 3,
        }}>
          Souveraineté Numérique
        </div>
        <div style={{
          fontSize: 8,
          fontFamily: "'Marianne', 'Helvetica Neue', Helvetica, sans-serif",
          color: light ? "rgba(255,255,255,0.4)" : T.grisClair,
          letterSpacing: "0.06em",
          lineHeight: 1,
          marginTop: 4,
        }}>
          <span style={{ fontWeight: 400 }}>The Sov</span>{" "}<span style={{ fontWeight: 700 }}>Company</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO FORM — formulaire landing page
   ───────────────────────────────────────────── */
function HeroForm({ onStart }) {
  const [entreprise, setEntreprise] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=6`);
      const d = await r.json();
      setResults(d.results || []);
      setOpen(true);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  const handleEntrepriseChange = (val) => {
    setEntreprise(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(val), 350);
  };

  const pick = (r) => {
    setEntreprise(r.nom_complet || r.nom_raison_sociale || entreprise);
    setOpen(false);
    setResults([]);
  };

  const submit = () => {
    const e = {};
    if (!entreprise.trim()) e.entreprise = "Requis";
    if (!email.trim() || !email.includes("@")) e.email = "Email invalide";
    setErrors(e);
    if (Object.keys(e).length === 0) onStart({ entreprise, email });
  };

  const fieldStyle = (field) => ({
    width: "100%", padding: "11px 14px",
    border: `1.5px solid ${errors[field] ? T.rouge : T.grisLine}`,
    borderRadius: 6, fontSize: 14,
    fontFamily: "inherit", color: T.encre,
    outline: "none", boxSizing: "border-box",
    background: T.blanc,
  });

  return (
    <div className="hero-form" style={{
      background: T.blanc,
      border: `1px solid ${T.grisLine}`,
      borderRadius: 12,
      padding: "32px 36px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.09)",
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.encre, marginBottom: 8 }}>
        Lancez votre diagnostic
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{
          background: "#D1FAE5", color: "#065F46",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          padding: "3px 8px", borderRadius: 4, textTransform: "uppercase",
        }}>
          + Gratuit
        </span>
        <span style={{ fontSize: 12, color: T.gris }}>Résultats instantanés · Aucun engagement</span>
      </div>

      <div style={{ marginBottom: 20, position: "relative" }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.gris, marginBottom: 6 }}>
          Entreprise (Nom ou SIREN)
        </label>
        <div style={{ position: "relative" }}>
          <input
            value={entreprise}
            onChange={e => handleEntrepriseChange(e.target.value)}
            placeholder="Ex : Airbus ou 383474814"
            style={fieldStyle("entreprise")}
            onFocus={e => { e.target.style.borderColor = T.bleu; if (results.length > 0) setOpen(true); }}
            onBlur={e => { e.target.style.borderColor = errors.entreprise ? T.rouge : T.grisLine; setTimeout(() => setOpen(false), 200); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoComplete="off"
          />
          {loading && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.grisClair }}>↻</div>}
        </div>
        {open && results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: T.blanc, border: `1px solid ${T.grisLine}`,
            borderTop: "none", zIndex: 200, maxHeight: 220, overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}>
            {results.map((r, i) => (
              <div key={i} onMouseDown={() => pick(r)} style={{
                padding: "10px 14px", cursor: "pointer",
                borderBottom: i < results.length - 1 ? `1px solid ${T.grisLine}` : "none",
              }}
                onMouseOver={e => e.currentTarget.style.background = T.grisbg}
                onMouseOut={e => e.currentTarget.style.background = T.blanc}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: T.encre }}>{r.nom_complet || r.nom_raison_sociale}</div>
                <div style={{ fontSize: 11, color: T.gris, marginTop: 2 }}>SIREN {r.siren} · {r.siege?.code_postal} {r.siege?.libelle_commune}</div>
              </div>
            ))}
          </div>
        )}
        {errors.entreprise && <div style={{ fontSize: 11, color: T.rouge, marginTop: 4 }}>{errors.entreprise}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.gris, marginBottom: 6 }}>
          Email · Recevez votre rapport
        </label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="vous@entreprise.fr"
          style={fieldStyle("email")}
          onFocus={e => e.target.style.borderColor = T.bleu}
          onBlur={e => { e.target.style.borderColor = errors.email ? T.rouge : T.grisLine; }}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {errors.email && <div style={{ fontSize: 11, color: T.rouge, marginTop: 4 }}>{errors.email}</div>}
      </div>

      <div style={{ fontSize: 12, color: T.gris, marginBottom: 20 }}>
        🔒 Confidentiel · Jamais revendu · Vous pouvez vous désabonner à tout moment
      </div>

      <button
        onClick={submit}
        style={{
          width: "100%", padding: "14px 0",
          background: T.rouge, color: T.blanc,
          border: "none", borderRadius: 6,
          fontSize: 15, fontWeight: 700,
          letterSpacing: "0.02em",
          transition: "background 0.2s",
        }}
        onMouseOver={e => { e.currentTarget.style.background = "#C41D2B"; }}
        onMouseOut={e => { e.currentTarget.style.background = T.rouge; }}
      >
        Démarrer le diagnostic →
      </button>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: T.grisClair }}>
        Diagnostic 100 % gratuit · Basé sur NIS2, DORA &amp; ANSSI
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DONNÉES : SECTEURS
   ───────────────────────────────────────────── */
const SECTOR_LABELS = [
  { value: "sante",       label: "Santé & Hôpitaux",            icon: "🏥" },
  { value: "finance",     label: "Finance & Assurance",          icon: "🏦" },
  { value: "industrie",   label: "Industrie / OIV / OES",        icon: "🏭" },
  { value: "collectivite",label: "Collectivité territoriale",     icon: "🏛️" },
  { value: "bitd",        label: "Défense / Aéro / Spatial",      icon: "✈️" },
  { value: "autre",       label: "Autre secteur",                 icon: "🏢" },
];

const SECTOR_MAP = {
  "86": "sante","87": "sante",
  "64": "finance","65": "finance","66": "finance",
  "84": "collectivite",
  "24": "industrie","25": "industrie","26": "industrie","28": "industrie","29": "industrie","33": "industrie",
  "30": "bitd","72": "bitd",
};

const BENCHMARKS = {
  sante: 22, finance: 27, industrie: 24,
  collectivite: 19, bitd: 30, autre: 23,
};

const REGLEMENTAIRE = {
  sante:        { badge: "NIS2 + HDS",       color: T.rouge,    text: "Votre secteur est soumis à NIS2 (entités essentielles) et à l'obligation d'hébergement certifié HDS pour toute donnée de santé. La PGSSI-S impose des exigences strictes de disponibilité et traçabilité." },
  finance:      { badge: "DORA",             color: T.bleu,     text: "Le règlement DORA s'applique à votre secteur depuis janvier 2025. Il impose des tests de résilience opérationnelle numérique, une gestion contractuelle stricte des prestataires IT critiques et des plans de continuité formalisés." },
  industrie:    { badge: "NIS2 + LPM",       color: T.rouge,    text: "Les Opérateurs d'Importance Vitale (OIV) et de Services Essentiels (OSE) sont soumis à la LPM et à NIS2. La séparation physique IT/OT est une exigence critique pour vos systèmes industriels." },
  collectivite: { badge: "NIS2",             color: T.bleu,     text: "Les collectivités entrent progressivement dans le scope NIS2. L'ANSSI accompagne via des programmes dédiés (MonServiceSécurisé, DIAG EN CYBER). La désignation d'un référent cyber est recommandée." },
  bitd:         { badge: "IGI 1300 / LPM",   color: T.ardoise,  text: "Les acteurs de la BITD sont soumis aux instructions interministérielles de classification (IGI 1300, MC 0900). La qualification ANSSI est souvent requise contractuellement pour les marchés défense." },
  autre:        { badge: "NIS2",             color: T.bleu,     text: "La directive NIS2, transposée en droit français, élargit considérablement le périmètre des entités régulées. Vérifiez votre éligibilité : les sanctions peuvent atteindre 10 M€ ou 2 % du CA mondial." },
};

/* ─────────────────────────────────────────────
   QUESTIONS BASE (16)
   Score : 3 = souverain / 1 = partiel ou "je ne sais pas" / 0 = exposé
   "Je ne sais pas" est traité comme un signal de risque (score 0 mais libellé distinct)
   ───────────────────────────────────────────── */
const BASE_Q = [
  // ── INFRASTRUCTURE (3)
  {
    id:"q1", module:"Infrastructure & Cloud", icon:"☁️",
    text:"Où sont hébergées vos données d'entreprise ?",
    why:"La localisation physique détermine la loi applicable. Les données hébergées aux États-Unis sont accessibles par les autorités américaines via le CLOUD Act, sans recours possible.",
    options:[
      { label:"Serveurs propres en France ou cloud certifié SecNumCloud",          score:3, dim:"juridique" },
      { label:"Cloud européen sans certification (Azure EU, AWS Frankfurt…)",      score:1, dim:"juridique" },
      { label:"Mélange : certaines données en France/EU, d'autres chez des hébergeurs étrangers", score:1, dim:"juridique" },
      { label:"Cloud américain par défaut (AWS us-east, GCP us…)",                score:0, dim:"juridique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"juridique", nsp:true },
    ]
  },
  {
    id:"q2", module:"Infrastructure & Cloud", icon:"☁️",
    text:"Votre fournisseur cloud principal est-il soumis à des lois extraterritoriales ?",
    why:"Microsoft, Google et AWS sont soumis au CLOUD Act américain. Une filiale européenne n'y échappe pas si la maison-mère est américaine. Le transfert de données peut être ordonné par un tribunal américain.",
    options:[
      { label:"Acteur européen indépendant (OVHcloud, Outscale, Scaleway…)",       score:3, dim:"juridique" },
      { label:"Filiale EU d'un acteur US avec contrat EU Data Boundary",            score:1, dim:"juridique" },
      { label:"Mélange de providers (souverains et non-souverains)",               score:1, dim:"juridique" },
      { label:"Acteur américain ou asiatique sans garantie particulière",           score:0, dim:"juridique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"juridique", nsp:true },
    ]
  },
  {
    id:"q3", module:"Infrastructure & Cloud", icon:"☁️",
    text:"En cas de panne ou disparition de votre hébergeur principal, que se passe-t-il ?",
    why:"La stratégie SGDSN 2026-2030 place la résilience opérationnelle au cœur du pilier 2. Une dépendance unique est un point de défaillance critique. En moyenne, 43 jours d'arrêt après un ransomware.",
    options:[
      { label:"Plan de continuité formalisé + hébergeur de secours identifié",     score:3, dim:"operationnel" },
      { label:"On pourrait migrer mais ce serait long (plusieurs semaines)",        score:1, dim:"operationnel" },
      { label:"Nos activités seraient complètement bloquées",                      score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                    score:0, dim:"operationnel", nsp:true },
    ]
  },
  // ── IDENTITÉ (3)
  {
    id:"q4", module:"Identité & Accès", icon:"🔐",
    text:"Votre annuaire d'entreprise (identités, mots de passe, droits) est géré par…",
    why:"L'annuaire est la brique la plus critique de votre SI. Microsoft Entra ID et Google Workspace Admin créent une dépendance totale à un acteur non-européen sur votre brique d'authentification centrale.",
    options:[
      { label:"Solution interne ou éditeur européen souverain",                    score:3, dim:"strategique" },
      { label:"Microsoft Entra ID / Azure AD",                                     score:1, dim:"strategique" },
      { label:"Google Workspace Admin ou autre acteur non-européen",               score:0, dim:"strategique" },
      { label:"Je n'ai pas de solution d'annuaire d'entreprise ou de gestion de mots de passe", score:0, dim:"strategique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"strategique", nsp:true },
    ]
  },
  {
    id:"q5", module:"Identité & Accès", icon:"🔐",
    text:"L'authentification multi-facteurs (MFA) est-elle déployée dans votre organisation ?",
    why:"80 % des compromissions de comptes auraient pu être évitées avec le MFA. C'est la mesure la plus rentable en cybersécurité selon l'ANSSI, recommandée en priorité absolue.",
    options:[
      { label:"Oui, sur tous les accès critiques (VPN, messagerie, outils métier)", score:3, dim:"operationnel" },
      { label:"Partiellement, sur quelques outils seulement",                      score:1, dim:"operationnel" },
      { label:"Non",                                                                 score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                     score:0, dim:"operationnel", nsp:true },
    ]
  },
  {
    id:"q6", module:"Identité & Accès", icon:"🔐",
    text:"Les accès distants de vos prestataires et sous-traitants sont-ils contrôlés ?",
    why:"L'attaque SolarWinds (2020) a compromis 18 000 organisations via un seul prestataire de confiance. La chaîne de sous-traitance est le vecteur d'attaque le plus sous-estimé.",
    options:[
      { label:"Accès nominatifs, tracés, durée limitée, révocation possible",       score:3, dim:"operationnel" },
      { label:"Quelques prestataires ont accès, pas vraiment formalisé",            score:1, dim:"operationnel" },
      { label:"On ne sait pas exactement qui a accès à quoi",                       score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                     score:0, dim:"operationnel", nsp:true },
    ]
  },
  // ── BUREAUTIQUE & IA (4)
  {
    id:"q7", module:"Bureautique & IA", icon:"💬",
    text:"Votre suite bureautique principale (email, documents, agenda) est…",
    why:"Microsoft 365 et Google Workspace traitent l'essentiel de votre information sensible quotidienne. Ils sont soumis au CLOUD Act sans exception, même avec le contrat EU Data Boundary.",
    options:[
      { label:"Solution open source ou éditeur européen (Nextcloud, OnlyOffice…)", score:3, dim:"juridique" },
      { label:"Microsoft 365 avec contrat EU Data Boundary activé",                score:1, dim:"juridique" },
      { label:"Microsoft 365 ou Google Workspace standard",                        score:0, dim:"juridique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"juridique", nsp:true },
    ]
  },
  {
    id:"q8", module:"Bureautique & IA", icon:"💬",
    text:"Vos outils de visioconférence et messagerie instantanée sont hébergés…",
    why:"Zoom, Teams, Slack captent vos échanges stratégiques en temps réel. La localisation des données et la politique de chiffrement end-to-end sont déterminantes pour votre confidentialité.",
    options:[
      { label:"Chez un acteur européen souverain (Tixeo, Wire, Oodrive…)",         score:3, dim:"juridique" },
      { label:"Acteur US avec données déclarées hébergées en Europe",              score:1, dim:"juridique" },
      { label:"Acteur US sans garantie de localisation (Zoom standard, Slack…)",   score:0, dim:"juridique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"juridique", nsp:true },
    ]
  },
  {
    id:"q9", module:"Bureautique & IA", icon:"💬",
    text:"Vos collaborateurs utilisent-ils des outils d'IA générative dans leur travail ?",
    why:"ChatGPT, Copilot, Gemini : chaque requête peut entraîner l'envoi de données sensibles vers des serveurs hors UE. La stratégie SGDSN 2026-2030 identifie l'IA comme vecteur de risque prioritaire.",
    options:[
      { label:"Pas d'usage, ou encadré par une politique écrite et signée",        score:3, dim:"strategique" },
      { label:"Usage libre avec sensibilisation orale réalisée",                   score:1, dim:"strategique" },
      { label:"Usage libre sans aucun encadrement",                                score:0, dim:"strategique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"strategique", nsp:true },
    ]
  },
  {
    id:"q10", module:"Bureautique & IA", icon:"💬",
    text:"Des données sensibles (contrats, RH, R&D, clients) transitent-elles par ces outils IA ?",
    why:"OpenAI, Google et Microsoft peuvent utiliser les prompts pour améliorer leurs modèles selon leurs CGU. Une fuite stratégique via IA peut être invisible, irréversible et non détectable.",
    options:[
      { label:"Jamais : politique claire, contrôlée techniquement (DLP)",          score:3, dim:"strategique" },
      { label:"Rarement, mais on ne peut pas le garantir formellement",            score:1, dim:"strategique" },
      { label:"Probablement oui, régulièrement",                                   score:0, dim:"strategique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"strategique", nsp:true },
    ]
  },
  // ── SÉCURITÉ (3)
  {
    id:"q11", module:"Sécurité & Détection", icon:"🛡️",
    text:"Votre solution de sécurité des postes de travail (antivirus / EDR) est fournie par…",
    why:"Kaspersky a été banni par plusieurs gouvernements. CrowdStrike a causé une panne mondiale en juillet 2024. L'origine de votre outil de sécurité est lui-même un risque souverain.",
    options:[
      { label:"Éditeur européen qualifié ANSSI (HarfangLab, Tehtris…)",            score:3, dim:"operationnel" },
      { label:"Éditeur américain reconnu (CrowdStrike, SentinelOne, Defender…)",   score:1, dim:"operationnel" },
      { label:"Solution ancienne non maintenue ou aucune solution dédiée",          score:0, dim:"operationnel" },
      { label:"Je n'en dispose pas",                                                score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                    score:0, dim:"operationnel", nsp:true },
    ]
  },
  {
    id:"q12", module:"Sécurité & Détection", icon:"🛡️",
    text:"En cas de cyberattaque majeure, votre organisation dispose de…",
    why:"Sans plan testé, le temps moyen de récupération après un ransomware dépasse 3 semaines. Le pilier 2 de la stratégie SGDSN impose la préparation aux crises comme exigence fondamentale.",
    options:[
      { label:"Plan de réponse à incident testé + prestataire PRIS qualifié ANSSI", score:3, dim:"operationnel" },
      { label:"Un plan existe mais n'a jamais été testé ni exercé",                 score:1, dim:"operationnel" },
      { label:"Aucun plan formalisé",                                               score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                    score:0, dim:"operationnel", nsp:true },
    ]
  },
  {
    id:"q13", module:"Sécurité & Détection", icon:"🛡️",
    text:"Vos sauvegardes sont-elles protégées contre un ransomware ?",
    why:"Les ransomwares ciblent en priorité les sauvegardes connectées. La règle 3-2-1 (3 copies, 2 supports, 1 hors ligne) est le minimum recommandé par l'ANSSI pour toute organisation.",
    options:[
      { label:"Sauvegardes hors ligne, en France, testées régulièrement (3-2-1)",  score:3, dim:"operationnel" },
      { label:"Sauvegardes automatiques connectées au même réseau / cloud",        score:1, dim:"operationnel" },
      { label:"Pas de politique de sauvegarde formalisée",                         score:0, dim:"operationnel" },
      { label:"Je ne sais pas",                                                    score:0, dim:"operationnel", nsp:true },
    ]
  },
  // ── GOUVERNANCE (3)
  {
    id:"q14", module:"Gouvernance & Conformité", icon:"📋",
    text:"Avez-vous cartographié vos données sensibles et leur localisation exacte ?",
    why:"On ne peut protéger que ce qu'on connaît. La cartographie des données est le prérequis de toute démarche de souveraineté et l'obligation n°1 du RGPD.",
    options:[
      { label:"Oui, cartographie à jour avec responsables identifiés par asset",   score:3, dim:"strategique" },
      { label:"Partiellement, certains périmètres documentés seulement",          score:1, dim:"strategique" },
      { label:"Non, aucune cartographie formalisée",                               score:0, dim:"strategique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"strategique", nsp:true },
    ]
  },
  {
    id:"q15", module:"Gouvernance & Conformité", icon:"📋",
    text:"Êtes-vous concerné par NIS2 ou DORA, et avez-vous engagé la mise en conformité ?",
    why:"NIS2 élargit considérablement le périmètre des entités régulées en France. Les sanctions peuvent atteindre 10 M€ ou 2 % du CA mondial. L'ignorance de l'obligation n'est pas une défense.",
    options:[
      { label:"Oui, concerné : mise en conformité en cours ou finalisée",          score:3, dim:"strategique" },
      { label:"Probablement concerné mais aucune action encore engagée",           score:1, dim:"strategique" },
      { label:"Non concerné ou non éligible",                                      score:0, dim:"strategique" },
      { label:"Je ne sais pas si nous sommes concernés",                           score:0, dim:"strategique", nsp:true },
    ]
  },
  {
    id:"q16", module:"Gouvernance & Conformité", icon:"📋",
    text:"Vos fournisseurs et sous-traitants numériques sont-ils évalués sur leur niveau de sécurité ?",
    why:"NIS2 impose la gestion du risque de la chaîne d'approvisionnement. 60 % des cyberattaques impliquent un tiers. Votre niveau de sécurité est celui de votre maillon le plus faible.",
    options:[
      { label:"Oui : clause contractuelle de sécurité + évaluation régulière",    score:3, dim:"strategique" },
      { label:"On y pense mais pas encore formalisé dans les contrats",            score:1, dim:"strategique" },
      { label:"Non, aucune exigence de sécurité envers nos fournisseurs",          score:0, dim:"strategique" },
      { label:"Je ne sais pas",                                                    score:0, dim:"strategique", nsp:true },
    ]
  },
];

/* ─────────────────────────────────────────────
   QUESTIONS SECTORIELLES (2 par secteur)
   ───────────────────────────────────────────── */
const SECTOR_Q = {
  sante: [
    {
      id:"qs1", module:"Spécifique Santé", icon:"🏥",
      text:"Vos données de santé sont-elles hébergées chez un acteur certifié HDS ?",
      why:"L'hébergement de données de santé (HDS) est une obligation légale en France depuis 2018. Tout acteur traitant des données de santé à caractère personnel doit être certifié HDS.",
      options:[
        { label:"Oui : hébergeur certifié HDS vérifié contractuellement",          score:3, dim:"juridique" },
        { label:"En cours de démarche / pas encore vérifié",                       score:1, dim:"juridique" },
        { label:"Non",                                                              score:0, dim:"juridique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"juridique", nsp:true },
      ]
    },
    {
      id:"qs2", module:"Spécifique Santé", icon:"🏥",
      text:"Votre Plan de Reprise d'Activité couvre-t-il explicitement un scénario cyberattaque sur vos SI cliniques ?",
      why:"Les attaques sur les hôpitaux (Corbeil-Essonnes, Versailles) montrent que sans PRA testé, le retour à la normale prend des mois avec des conséquences vitales pour les patients.",
      options:[
        { label:"PRA formalisé, testé, avec scénario cyberattaque sur SI clinique", score:3, dim:"operationnel" },
        { label:"PRA existe mais ne couvre pas spécifiquement le scénario cyber",  score:1, dim:"operationnel" },
        { label:"Pas de PRA formalisé",                                            score:0, dim:"operationnel" },
        { label:"Je ne sais pas",                                                  score:0, dim:"operationnel", nsp:true },
      ]
    },
  ],
  finance: [
    {
      id:"qf1", module:"Spécifique DORA", icon:"🏦",
      text:"Avez-vous réalisé une cartographie de votre résilience opérationnelle numérique (DORA art. 6) ?",
      why:"DORA impose depuis janvier 2025 un cadre de gestion du risque informatique. La cartographie des actifs critiques et des dépendances IT est la première obligation formelle.",
      options:[
        { label:"Oui : cartographie formalisée et validée par la direction",       score:3, dim:"strategique" },
        { label:"Partiellement réalisée, en cours de complétion",                  score:1, dim:"strategique" },
        { label:"Non, pas encore engagé",                                          score:0, dim:"strategique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"strategique", nsp:true },
      ]
    },
    {
      id:"qf2", module:"Spécifique DORA", icon:"🏦",
      text:"Vos contrats avec prestataires IT critiques incluent-ils les clauses DORA (art. 30) ?",
      why:"DORA impose des clauses contractuelles spécifiques : droit d'audit, localisation des données, plan de sortie, niveaux de service minimaux. La non-conformité expose à des sanctions BCE.",
      options:[
        { label:"Oui : contrats mis à jour avec toutes les clauses DORA art. 30",  score:3, dim:"juridique" },
        { label:"En cours de renégociation avec les principaux fournisseurs",      score:1, dim:"juridique" },
        { label:"Non, contrats non mis à jour",                                    score:0, dim:"juridique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"juridique", nsp:true },
      ]
    },
  ],
  industrie: [
    {
      id:"qi1", module:"Spécifique OT / SCADA", icon:"🏭",
      text:"Vos systèmes industriels (automates, SCADA) sont-ils isolés de votre réseau bureautique IT ?",
      why:"La convergence IT/OT est le principal vecteur d'attaque sur les installations industrielles. Une segmentation physique stricte est l'exigence fondamentale de la LPM pour les OIV.",
      options:[
        { label:"Séparation physique ou DMZ stricte entre IT et OT",              score:3, dim:"operationnel" },
        { label:"Segmentation logique mais des connexions existent",               score:1, dim:"operationnel" },
        { label:"Pas de séparation : réseaux IT et OT interconnectés",             score:0, dim:"operationnel" },
        { label:"Je ne sais pas",                                                  score:0, dim:"operationnel", nsp:true },
      ]
    },
    {
      id:"qi2", module:"Spécifique OIV / OES", icon:"🏭",
      text:"Êtes-vous désigné Opérateur d'Importance Vitale (OIV) ou de Services Essentiels (OSE) ?",
      why:"Les OIV sont soumis à des obligations renforcées sous la LPM avec des contrôles ANSSI réguliers. Les OSE relèvent de NIS2. La non-conformité expose à des sanctions et à une responsabilité pénale.",
      options:[
        { label:"Oui : désigné et en conformité avec toutes les obligations",      score:3, dim:"strategique" },
        { label:"Oui : désigné mais conformité partielle en cours",                score:1, dim:"strategique" },
        { label:"Non / Nous ne sommes pas concernés",                              score:0, dim:"strategique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"strategique", nsp:true },
      ]
    },
  ],
  collectivite: [
    {
      id:"qc1", module:"Spécifique Collectivités", icon:"🏛️",
      text:"Disposez-vous d'un référent cybersécurité identifié au sein de la collectivité ?",
      why:"L'ANSSI recommande que chaque collectivité dispose d'un référent cyber. Sans responsable identifié avec budget et autorité, la mise en conformité NIS2 est structurellement impossible.",
      options:[
        { label:"Oui : référent cyber dédié avec budget et autorité formelle",     score:3, dim:"strategique" },
        { label:"DSI ou responsable IT avec mission cyber partielle",              score:1, dim:"strategique" },
        { label:"Personne de désigné sur ce sujet",                                score:0, dim:"strategique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"strategique", nsp:true },
      ]
    },
    {
      id:"qc2", module:"Spécifique Collectivités", icon:"🏛️",
      text:"Utilisez-vous les marchés publics mutualisés pour vos achats cyber (UGAP, CAIH…) ?",
      why:"Les marchés mutualisés garantissent des solutions conformes aux référentiels ANSSI à des tarifs négociés. Ils réduisent le risque d'achat de solutions non qualifiées ou mal configurées.",
      options:[
        { label:"Oui : achats cyber systématiquement via marchés mutualisés",      score:3, dim:"operationnel" },
        { label:"Partiellement selon les besoins",                                 score:1, dim:"operationnel" },
        { label:"Non : achats directs sans référence à ces marchés",               score:0, dim:"operationnel" },
        { label:"Je ne sais pas",                                                  score:0, dim:"operationnel", nsp:true },
      ]
    },
  ],
  bitd: [
    {
      id:"qb1", module:"Spécifique BITD / Défense", icon:"✈️",
      text:"Vos informations sensibles sont-elles traitées conformément aux exigences IGI 1300 / MC 0900 ?",
      why:"Les acteurs BITD sont soumis aux instructions de classification interministérielles. Tout traitement d'information classifiée hors système homologué est pénalement sanctionnable.",
      options:[
        { label:"Oui : SI homologués et personnel habilité pour les niveaux requis", score:3, dim:"juridique" },
        { label:"En cours d'homologation / habilitation partielle",                score:1, dim:"juridique" },
        { label:"Non formalisé",                                                   score:0, dim:"juridique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"juridique", nsp:true },
      ]
    },
    {
      id:"qb2", module:"Spécifique BITD / Défense", icon:"✈️",
      text:"Vos systèmes d'information sensibles ont-ils fait l'objet d'une qualification ANSSI ou homologation DGA ?",
      why:"La qualification ANSSI est le signe de reconnaissance de la sécurité d'un produit ou service. Pour les marchés défense, elle est souvent requise contractuellement et condition d'accès aux appels d'offres.",
      options:[
        { label:"Oui : qualification ou homologation obtenue sur les SI critiques", score:3, dim:"strategique" },
        { label:"Démarche engagée, en attente de qualification",                   score:1, dim:"strategique" },
        { label:"Non : pas de démarche de qualification",                          score:0, dim:"strategique" },
        { label:"Je ne sais pas",                                                  score:0, dim:"strategique", nsp:true },
      ]
    },
  ],
  autre: [],
};

/* ─────────────────────────────────────────────
   OFFRES COMMERCIALES
   ───────────────────────────────────────────── */
const OFFRES = {
  expose: [
    { tag:"NIS2 / DORA",        titre:"Mise en conformité : Programme Urgence",        desc:"Audit express, plan d'action priorisé et accompagnement sur 90 jours. Résultat garanti.", cta:"Demander un audit d'urgence" },
    { tag:"Souveraineté",       titre:"Diagnostic Souveraineté Approfondi",            desc:"Cartographie complète de vos dépendances numériques et feuille de route priorisée par risque.", cta:"Planifier un diagnostic" },
  ],
  vulnerable: [
    { tag:"NIS2 / DORA",        titre:"Gap Analysis Réglementaire",                    desc:"Identification précise de vos écarts et plan de conformité réaliste adapté à votre structure.", cta:"Demander une analyse des écarts" },
    { tag:"Souveraineté",       titre:"Plan de Souveraineté Numérique",                desc:"Stratégie de migration vers des solutions souveraines, priorisée par risque et budget.", cta:"Construire mon plan" },
  ],
  resiliant: [
    { tag:"NIS2 / DORA",        titre:"Audit de Maturité Réglementaire",               desc:"Validation de votre conformité, identification des derniers angles morts, optimisation de la posture.", cta:"Valider ma conformité" },
    { tag:"Souveraineté",       titre:"Certification & Qualification ANSSI",           desc:"Accompagnement vers les qualifications ANSSI, le label SecNumCloud et la valorisation auprès de vos clients.", cta:"Viser la certification" },
  ],
  souverain: [
    { tag:"Excellence",         titre:"Partenariat Stratégique & Référencement",       desc:"Vous êtes un acteur de référence. Rejoignez notre réseau d'experts et nos groupes de travail ANSSI.", cta:"Devenir partenaire référent" },
    { tag:"Benchmark sectoriel",titre:"Programme d'Excellence Cyber",                  desc:"Positionnez-vous comme organisation souveraine de référence dans votre secteur et valorisez-le auprès de vos partenaires.", cta:"Rejoindre le programme" },
  ],
};

/* ─────────────────────────────────────────────
   UTILS
   ───────────────────────────────────────────── */
function getMaturity(score, max) {
  const p = score / max;
  if (p <= 0.25) return { label:"Exposé",    key:"expose",    ...T.niveauExpose,    progress: p };
  if (p <= 0.50) return { label:"Vulnérable", key:"vulnerable", ...T.niveauVulnerable, progress: p };
  if (p <= 0.75) return { label:"Résilient", key:"resiliant", ...T.niveauResiliant,  progress: p };
  return               { label:"Souverain",  key:"souverain", ...T.niveauSouverain,  progress: p };
}

function computeScores(answers, questions) {
  let total=0,max=0, j=0,o=0,s=0, mj=0,mo=0,ms=0;
  questions.forEach(q => {
    const best = Math.max(...q.options.map(x=>x.score));
    max += best;
    const dim = q.options[0].dim;
    if(dim==="juridique") mj+=best;
    else if(dim==="operationnel") mo+=best;
    else ms+=best;
    const ans = answers[q.id];
    if(ans !== undefined){
      const sc = q.options[ans].score;
      total += sc;
      if(dim==="juridique") j+=sc;
      else if(dim==="operationnel") o+=sc;
      else s+=sc;
    }
  });
  return {total,max,j,o,s,mj,mo,ms};
}

/* ─────────────────────────────────────────────
   RADAR SVG
   ───────────────────────────────────────────── */
function Radar({j,o,s,mj,mo,ms}) {
  const sz=200, cx=sz/2, cy=sz/2, r=72;
  const axes=[
    {label:"Juridique",     val:mj?j/mj:0, angle:-Math.PI/2},
    {label:"Stratégique",   val:ms?s/ms:0, angle:-Math.PI/2 + 2*Math.PI/3},
    {label:"Opérationnel",  val:mo?o/mo:0, angle:-Math.PI/2 + 4*Math.PI/3},
  ];
  const pt=(a,rad)=>({x:cx+rad*Math.cos(a.angle), y:cy+rad*Math.sin(a.angle)});
  const poly=pts=>pts.map(p=>`${p.x},${p.y}`).join(" ");
  const dataPts=axes.map(a=>pt(a, r*Math.max(0.12,a.val)));
  const gridLevels=[0.33,0.66,1];
  return (
    <svg viewBox={`0 0 ${sz} ${sz}`} style={{width:"100%",maxWidth:200,display:"block",margin:"0 auto"}}>
      {gridLevels.map((l,i)=>(
        <polygon key={i} points={poly(axes.map(a=>pt(a,r*l)))}
          fill="none" stroke={i===2?"rgba(0,35,149,0.15)":"rgba(0,35,149,0.07)"} strokeWidth={i===2?1.5:1}/>
      ))}
      {axes.map((a,i)=>{
        const end=pt(a,r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(0,35,149,0.15)" strokeWidth={1}/>;
      })}
      <polygon points={poly(dataPts)} fill="rgba(0,35,149,0.12)" stroke={T.bleu} strokeWidth={2} strokeLinejoin="round"/>
      {dataPts.map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r={5} fill={T.bleu} stroke={T.blanc} strokeWidth={2}/>
      ))}
      {axes.map((a,i)=>{
        const lp=pt(a,r+22);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill={T.ardoise} fontFamily="'Marianne','Helvetica Neue',sans-serif" fontWeight="600">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 — LANDING
   ───────────────────────────────────────────── */
function Landing({onStart}) {
  const args=[
    {n:"87%", t:"des entreprises françaises ont subi une cyberattaque en 2024"},
    {n:"10M€", t:"amende maximale NIS2 pour non-conformité réglementaire"},
    {n:"43j",  t:"durée moyenne d'interruption après une attaque ransomware"},
  ];
  return (
    <div style={{minHeight:"100vh",background:T.blanc,fontFamily:"'Marianne','Helvetica Neue',Helvetica,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&display=swap');
        @font-face {
          font-family: 'Marianne';
          src: url('https://www.systeme-de-design.gouv.fr/fonts/Marianne-Bold.woff2') format('woff2');
          font-weight: 700; font-style: normal;
        }
        @font-face {
          font-family: 'Marianne';
          src: url('https://www.systeme-de-design.gouv.fr/fonts/Marianne-Regular.woff2') format('woff2');
          font-weight: 400; font-style: normal;
        }
        @font-face {
          font-family: 'Marianne';
          src: url('https://www.systeme-de-design.gouv.fr/fonts/Marianne-Medium.woff2') format('woff2');
          font-weight: 500; font-style: normal;
        }
        * { box-sizing: border-box; margin:0; padding:0; }
        button { cursor:pointer; font-family:inherit; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.6s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.45s ease both; }
        @media print { nav,button { display:none!important; } }
      `}</style>

      {/* Liseret en haut */}
      <Liseret height={5} />

      {/* NAV */}
      <nav className="nav-main" style={{
        padding:"0 48px", height:64,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:`1px solid ${T.grisLine}`,
        position:"sticky",top:5,background:"rgba(255,255,255,0.97)",
        backdropFilter:"blur(8px)", zIndex:100,
      }}>
        <Logo />
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div className="hide-mobile" style={{
            padding:"4px 12px",
            border:`1px solid ${T.bleu}30`,
            fontSize:11, color:T.bleu,
            fontWeight:500, letterSpacing:"0.06em",
          }}>
            Stratégie SGDSN 2026–2030
          </div>
          <a href="/contact" style={{
            fontFamily:"'Marianne','Helvetica Neue',Helvetica,sans-serif",
            fontSize:13, fontWeight:600, color:T.blanc, textDecoration:"none",
            padding:"8px 20px", background:T.bleu, borderRadius:4,
            letterSpacing:"0.02em",
          }}>Parler à un expert</a>
        </div>
      </nav>

      {/* HERO — fond blanc, deux colonnes */}
      <div style={{ background: T.blanc, borderBottom: `1px solid ${T.grisLine}` }}>
        <div className="hero-grid" style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "72px 48px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
        }}>
          {/* Gauche — pitch */}
          <div>
            <div className="fade-up" style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              color: T.gris, textTransform: "uppercase", marginBottom: 28,
            }}>
              DIAGNOSTIC DE SOUVERAINETÉ NUMÉRIQUE
            </div>

            <h1 className="fade-up-2" style={{
              fontSize: "clamp(32px, 3.5vw, 50px)",
              fontWeight: 700, color: T.encre,
              lineHeight: 1.1, letterSpacing: "-0.02em",
              marginBottom: 24,
            }}>
              Votre entreprise ignore l'étendue de son exposition{" "}
              <span style={{ color: T.rouge }}>numérique.</span>
            </h1>

            <p className="fade-up-3" style={{
              fontSize: 16, color: T.gris, lineHeight: 1.7,
              maxWidth: 460, marginBottom: 36,
              fontFamily: "'Source Serif 4',Georgia,serif",
            }}>
              Chaque outil cloud, chaque prestataire, chaque donnée hébergée à l'étranger crée une dépendance invisible : juridique, opérationnelle, stratégique. Mesurez-la en 15 minutes.
            </p>

            <div className="fade-up-4">
              {[
                "Impact juridique, opérationnel et stratégique calculé",
                "Comparaison sectorielle et obligations réglementaires",
                "Rapport personnalisé envoyé gratuitement par email",
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  marginBottom: 14, fontSize: 14, color: T.ardoise,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: T.bleuPale,
                    border: `1px solid ${T.bleuLight}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <span style={{ color: T.bleu, fontSize: 10, fontWeight: 700 }}>✓</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Droite — formulaire */}
          <HeroForm onStart={onStart} />
        </div>
      </div>

      {/* BANDE SOURCES */}
      <div className="source-band" style={{
        background: T.grisbg,
        borderBottom: `1px solid ${T.grisLine}`,
        padding: "16px 48px",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", gap: 0, justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {[
            { label: "SGDSN", detail: "Stratégie nationale 2026–2030" },
            { label: "ANSSI", detail: "Référentiels & guides sectoriels" },
            { label: "NIS2", detail: "Directive UE 2022/2555" },
            { label: "DORA", detail: "Règlement UE 2022/2554" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px" }}>
              {i > 0 && <span style={{ color: T.grisLine, marginRight: 20, fontSize: 16 }}>·</span>}
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ardoise }}>{s.label}</span>
              <span style={{ fontSize: 12, color: T.gris, marginLeft: 4 }}>{s.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid" style={{
        display:"grid",gridTemplateColumns:"repeat(3,1fr)",
        borderBottom:`1px solid ${T.grisLine}`,
        background:T.grisbg,
      }}>
        {args.map((a,i)=>(
          <div key={i} style={{
            padding:"28px 32px",
            borderRight: i<2 ? `1px solid ${T.grisLine}` : "none",
            textAlign:"center",
          }}>
            <div style={{fontSize:40,fontWeight:700,color:T.bleu,letterSpacing:"-0.02em",lineHeight:1}}>{a.n}</div>
            <div style={{fontSize:13,color:T.gris,marginTop:8,lineHeight:1.45,fontStyle:"normal"}}>{a.t}</div>
          </div>
        ))}
      </div>

      {/* 3 PILIERS */}
      <div className="section-pad" style={{padding:"72px 48px",maxWidth:960,margin:"0 auto"}}>
        <div style={{
          fontSize:11,fontWeight:700,letterSpacing:"0.12em",
          color:T.bleu,textTransform:"uppercase",marginBottom:12,
        }}>Ce que mesure le diagnostic</div>
        <h2 style={{
          fontSize:30,fontWeight:700,color:T.ardoise,
          letterSpacing:"-0.02em",marginBottom:48,lineHeight:1.15,
        }}>
          Trois dimensions de souveraineté numérique
        </h2>

        <div className="grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:T.grisLine}}>
          {[
            {icon:"⚖️",dim:"Juridique",desc:"Vos données sont-elles soumises au CLOUD Act américain ? L'hébergement, le fournisseur cloud et la suite bureautique déterminent la loi applicable."},
            {icon:"⚙️",dim:"Opérationnelle",desc:"Si votre hébergeur disparaît demain, combien de temps avant le retour à la normale ? La résilience, les sauvegardes et le plan de crise comptent."},
            {icon:"🎯",dim:"Stratégique",desc:"Vos données R&D et commerciales transitent-elles par des outils dont vous ne maîtrisez pas le fonctionnement ? L'IA et la chaîne fournisseurs sont des angles morts."},
          ].map((p,i)=>(
            <div key={i} style={{
              background:T.blanc,padding:"36px 28px",
              borderTop:`4px solid ${i===0?T.bleu:i===1?T.ardoise:T.rouge}`,
            }}>
              <div style={{fontSize:32,marginBottom:16}}>{p.icon}</div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.bleu,textTransform:"uppercase",marginBottom:10}}>
                Dimension {p.dim}
              </div>
              <div style={{
                fontSize:14,color:T.gris,lineHeight:1.65,
                fontFamily:"inherit",
              }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SGDSN */}
      <div className="section-pad" style={{
        borderTop:`1px solid ${T.grisLine}`,
        borderBottom:`1px solid ${T.grisLine}`,
        background:T.bleuPale,
        padding:"40px 48px",
      }}>
        <div className="sgdsn-flex" style={{maxWidth:860,margin:"0 auto",display:"flex",gap:32,alignItems:"center"}}>
          <div style={{fontSize:36,flexShrink:0}}>🛡️</div>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.bleu,textTransform:"uppercase",marginBottom:8}}>
              Ancrage réglementaire
            </div>
            <p style={{fontSize:14,color:T.ardoise,lineHeight:1.7,fontFamily:"inherit"}}>
              Ce diagnostic est structuré autour des <strong>5 piliers de la Stratégie nationale de cybersécurité 2026–2030</strong> du SGDSN. Il intègre les exigences de <strong>NIS2</strong>, du règlement <strong>DORA</strong> (secteur financier), des référentiels <strong>ANSSI</strong>, et des obligations sectorielles <strong>HDS, LPM et IGI 1300</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* CTA BAS */}
      <div className="section-pad" style={{padding:"72px 48px",textAlign:"center"}}>
        <h2 style={{fontSize:28,fontWeight:700,color:T.ardoise,marginBottom:12,letterSpacing:"-0.02em"}}>
          Prêt à évaluer votre exposition ?
        </h2>
        <p style={{fontSize:15,color:T.gris,marginBottom:36,fontFamily:"inherit"}}>
          Résultats immédiats. Rapport personnalisé selon votre secteur. Recommandations actionnables.
        </p>
        <button onClick={()=>onStart({})} style={{
          background:T.ardoise,color:T.blanc,border:"none",
          padding:"15px 40px",fontSize:15,fontWeight:700,
          letterSpacing:"0.03em",transition:"background 0.2s",
        }}
          onMouseOver={e=>e.currentTarget.style.background=T.bleuMid}
          onMouseOut={e=>e.currentTarget.style.background=T.ardoise}
        >
          Commencer le diagnostic →
        </button>
        <div style={{marginTop:16,fontSize:12,color:T.grisClair}}>
          Gratuit · Confidentiel · Sans engagement · Conformité RGPD
        </div>
      </div>

      {/* Footer landing */}
      <div className="section-pad footer-flex" style={{borderTop:`1px solid ${T.grisLine}`,padding:"24px 48px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:10,color:T.grisClair,letterSpacing:"0.06em"}}>
          <span style={{fontWeight:400}}>The Sov</span>{" "}<span style={{fontWeight:700}}>Company</span> · © {new Date().getFullYear()} SovNum
        </div>
        <a href="/mentions-legales" style={{fontSize:11,color:T.grisClair,textDecoration:"none"}}>Mentions légales</a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 — IDENTIFICATION
   ───────────────────────────────────────────── */
function Identification({onComplete, initialData}) {
  const [f,setF]=useState({prenom:"",nom:"",poste:"",email:initialData?.email||"",entreprise:initialData?.entreprise||"",siren:"",secteur:""});
  const [results,setResults]=useState([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [errors,setErrors]=useState({});
  const timer=useRef(null);

  const search=useCallback(async(q)=>{
    if(q.length<3){setResults([]);return;}
    setLoading(true);
    try{
      const r=await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=6`);
      const d=await r.json();
      setResults(d.results||[]);
      setOpen(true);
    }catch{setResults([]);}
    setLoading(false);
  },[]);

  const onChange=(val)=>{
    setF(x=>({...x,entreprise:val,siren:"",secteur:""}));
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>search(val),350);
  };

  const pick=(r)=>{
    const naf=r.activite_principale?.slice(0,2)||"";
    setF(x=>({
      ...x,
      entreprise:r.nom_complet||r.nom_raison_sociale||x.entreprise,
      siren:r.siren||"",
      secteur:SECTOR_MAP[naf]||"",
    }));
    setOpen(false);setResults([]);
  };

  const validate=()=>{
    const e={};
    if(!f.prenom.trim())e.prenom="Requis";
    if(!f.nom.trim())e.nom="Requis";
    if(!f.poste.trim())e.poste="Requis";
    if(!f.email.trim()||!f.email.includes("@"))e.email="Email invalide";
    if(!f.entreprise.trim())e.entreprise="Requis";
    if(!f.secteur)e.secteur="Sélectionnez un secteur";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const inp=(field,extra={})=>({
    width:"100%",padding:"11px 14px",
    border:`1.5px solid ${errors[field]?T.rouge:T.grisLine}`,
    fontSize:14,fontFamily:"inherit",color:T.encre,
    outline:"none",background:T.blanc,
    transition:"border-color 0.15s",
    boxSizing:"border-box",
    ...extra,
  });

  const lbl={display:"block",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:T.gris,marginBottom:6};

  return (
    <div style={{minHeight:"100vh",background:T.grisbg,fontFamily:"'Marianne','Helvetica Neue',Helvetica,sans-serif"}}>
      <Liseret height={5}/>
      <nav className="nav-main" style={{
        padding:"0 48px",height:64,display:"flex",alignItems:"center",
        justifyContent:"space-between",borderBottom:`1px solid ${T.grisLine}`,
        background:T.blanc,
      }}>
        <Logo/>
        <div style={{fontSize:13,color:T.gris,fontStyle:"normal"}}>
          Étape 1 sur 3 · Identification
        </div>
      </nav>

      <div style={{maxWidth:600,margin:"0 auto",padding:"60px 24px"}}>
        <div style={{marginBottom:40}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:T.bleu,textTransform:"uppercase",marginBottom:12}}>
            Avant de commencer
          </div>
          <h1 style={{fontSize:34,fontWeight:700,color:T.ardoise,letterSpacing:"-0.02em",lineHeight:1.1,marginBottom:12}}>
            Présentez-vous
          </h1>
          <p style={{fontSize:14,color:T.gris,lineHeight:1.65,fontFamily:"inherit"}}>
            Ces informations personnalisent votre rapport et l'adaptent aux réglementations spécifiques à votre secteur. Vos données restent strictement confidentielles.
          </p>
        </div>

        <div className="id-form" style={{background:T.blanc,border:`1px solid ${T.grisLine}`,padding:"40px"}}>
          {/* Prénom / Nom */}
          <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            {[["prenom","Prénom","Marie"],["nom","Nom","Dupont"]].map(([k,l,ph])=>(
              <div key={k}>
                <label style={lbl}>{l} *</label>
                <input style={inp(k)} value={f[k]} onChange={e=>setF(x=>({...x,[k]:e.target.value}))}
                  placeholder={ph}
                  onFocus={e=>e.target.style.borderColor=T.bleu}
                  onBlur={e=>e.target.style.borderColor=errors[k]?T.rouge:T.grisLine}
                />
                {errors[k]&&<div style={{fontSize:11,color:T.rouge,marginTop:4}}>{errors[k]}</div>}
              </div>
            ))}
          </div>
          {/* Poste */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>Poste *</label>
            <input style={inp("poste")} value={f.poste} onChange={e=>setF(x=>({...x,poste:e.target.value}))}
              placeholder="DSI, RSSI, PDG, Directeur IT…"
              onFocus={e=>e.target.style.borderColor=T.bleu}
              onBlur={e=>e.target.style.borderColor=errors.poste?T.rouge:T.grisLine}
            />
            {errors.poste&&<div style={{fontSize:11,color:T.rouge,marginTop:4}}>{errors.poste}</div>}
          </div>
          {/* Email */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>Email professionnel *</label>
            <input style={inp("email")} type="email" value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))}
              placeholder="m.dupont@entreprise.fr"
              onFocus={e=>e.target.style.borderColor=T.bleu}
              onBlur={e=>e.target.style.borderColor=errors.email?T.rouge:T.grisLine}
            />
            {errors.email&&<div style={{fontSize:11,color:T.rouge,marginTop:4}}>{errors.email}</div>}
          </div>
          {/* Entreprise autocomplete */}
          <div style={{marginBottom:20,position:"relative"}}>
            <label style={lbl}>Raison sociale ou SIREN *</label>
            <div style={{position:"relative"}}>
              <input style={inp("entreprise")} value={f.entreprise}
                onChange={e=>onChange(e.target.value)}
                onFocus={e=>{e.target.style.borderColor=T.bleu;if(results.length>0)setOpen(true);}}
                onBlur={()=>setTimeout(()=>setOpen(false),200)}
                placeholder="Rechercher par nom ou numéro SIREN…"
                autoComplete="off"
              />
              {loading&&<div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.grisClair,animation:"spin 1s linear infinite"}}>↻</div>}
            </div>
            {open&&results.length>0&&(
              <div style={{
                position:"absolute",top:"100%",left:0,right:0,
                background:T.blanc,border:`1px solid ${T.grisLine}`,
                borderTop:"none",zIndex:200,maxHeight:220,overflowY:"auto",
                boxShadow:"0 8px 32px rgba(0,0,0,0.1)",
              }}>
                {results.map((r,i)=>(
                  <div key={i} onMouseDown={()=>pick(r)} style={{
                    padding:"10px 14px",cursor:"pointer",
                    borderBottom:i<results.length-1?`1px solid ${T.grisLine}`:"none",
                  }}
                    onMouseOver={e=>e.currentTarget.style.background=T.grisbg}
                    onMouseOut={e=>e.currentTarget.style.background=T.blanc}
                  >
                    <div style={{fontSize:13,fontWeight:600,color:T.encre}}>{r.nom_complet||r.nom_raison_sociale}</div>
                    <div style={{fontSize:11,color:T.gris,marginTop:2}}>SIREN {r.siren} · {r.siege?.code_postal} {r.siege?.libelle_commune}</div>
                  </div>
                ))}
              </div>
            )}
            {f.siren&&<div style={{marginTop:6,fontSize:11,color:"#15803D",fontWeight:500}}>✓ SIREN {f.siren} vérifié</div>}
            {errors.entreprise&&<div style={{fontSize:11,color:T.rouge,marginTop:4}}>{errors.entreprise}</div>}
          </div>
          {/* Secteur */}
          <div style={{marginBottom:36}}>
            <label style={lbl}>Secteur d'activité *</label>
            <div className="grid-2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {SECTOR_LABELS.map(s=>(
                <div key={s.value} onClick={()=>setF(x=>({...x,secteur:s.value}))} style={{
                  padding:"10px 14px",
                  border:`1.5px solid ${f.secteur===s.value?T.bleu:T.grisLine}`,
                  cursor:"pointer",fontSize:13,
                  background:f.secteur===s.value?T.bleuPale:T.blanc,
                  color:f.secteur===s.value?T.bleu:T.encre,
                  fontWeight:f.secteur===s.value?700:400,
                  transition:"all 0.15s",
                  display:"flex",alignItems:"center",gap:8,
                }}>
                  <span>{s.icon}</span> {s.label}
                </div>
              ))}
            </div>
            {errors.secteur&&<div style={{fontSize:11,color:T.rouge,marginTop:6}}>{errors.secteur}</div>}
          </div>

          <button onClick={()=>{if(validate())onComplete(f);}} style={{
            width:"100%",background:T.bleu,color:T.blanc,border:"none",
            padding:"14px",fontSize:15,fontWeight:700,letterSpacing:"0.03em",
            transition:"background 0.2s",
          }}
            onMouseOver={e=>e.currentTarget.style.background=T.bleuMid}
            onMouseOut={e=>e.currentTarget.style.background=T.bleu}
          >
            Démarrer le diagnostic →
          </button>
          <div style={{marginTop:16,fontSize:11,color:T.grisClair,textAlign:"center",lineHeight:1.6}}>
            🔒 Données strictement confidentielles · Conformité RGPD · Non revendues
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 — DIAGNOSTIC
   ───────────────────────────────────────────── */
function Diagnostic({profile,onComplete}) {
  const sectorQs = SECTOR_Q[profile.secteur]||[];
  const all = [...BASE_Q,...sectorQs];

  const [cur,setCur]=useState(0);
  const [answers,setAnswers]=useState({});
  const [sel,setSel]=useState(null);
  const [anim,setAnim]=useState(false);

  const q=all[cur];
  const pct=Math.round((cur/all.length)*100);

  const next=()=>{
    if(sel===null)return;
    const na={...answers,[q.id]:sel};
    setAnswers(na);
    setAnim(true);
    setTimeout(()=>{
      if(cur+1>=all.length){onComplete(na,all);}
      else{setCur(c=>c+1);setSel(null);setAnim(false);}
    },250);
  };

  const prev=()=>{
    if(cur===0)return;
    const prevQ=all[cur-1];
    setSel(answers[prevQ.id]??null);
    setCur(c=>c-1);
  };

  const moduleColors={
    "Infrastructure & Cloud":T.bleu,
    "Identité & Accès":"#7C3AED",
    "Bureautique & IA":"#BE185D",
    "Sécurité & Détection":T.rouge,
    "Gouvernance & Conformité":"#047857",
  };
  const mc=moduleColors[q.module]||T.bleu;

  return (
    <div style={{minHeight:"100vh",background:T.grisbg,fontFamily:"'Marianne','Helvetica Neue',Helvetica,sans-serif"}}>
      <Liseret height={5}/>
      {/* NAV */}
      <div style={{
        background:T.blanc,borderBottom:`1px solid ${T.grisLine}`,
        position:"sticky",top:5,zIndex:100,
      }}>
        <div className="nav-main" style={{
          padding:"0 48px",height:56,
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <Logo/>
          <div style={{
            fontSize:13,color:T.gris,
            fontStyle:"normal",
          }}>
            Question {cur+1} sur {all.length}
          </div>
        </div>
        <div style={{height:3,background:T.grisLine}}>
          <div style={{height:"100%",width:`${pct}%`,background:T.bleu,transition:"width 0.4s ease"}}/>
        </div>
      </div>

      <div style={{
        maxWidth:680,margin:"0 auto",padding:"56px 24px",
        opacity:anim?0:1,transform:anim?"translateY(-10px)":"translateY(0)",
        transition:"all 0.25s ease",
      }}>
        {/* Module badge */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <div style={{
            padding:"4px 12px",
            background:`${mc}12`,
            border:`1px solid ${mc}25`,
            fontSize:11,fontWeight:700,letterSpacing:"0.09em",
            color:mc,
          }}>
            {q.icon} {q.module.toUpperCase()}
          </div>
          <div style={{
            fontSize:12,color:T.grisClair,
            fontStyle:"normal",
          }}>
            {cur+1} / {all.length}
          </div>
        </div>

        {/* Question */}
        <h2 style={{
          fontSize:24,fontWeight:700,color:T.ardoise,
          lineHeight:1.35,marginBottom:16,letterSpacing:"-0.01em",
        }}>
          {q.text}
        </h2>

        {/* Contexte */}
        <div style={{
          fontSize:13,color:T.gris,lineHeight:1.65,marginBottom:32,
          fontStyle:"normal",
          paddingLeft:16,borderLeft:`3px solid ${T.bleu}30`,
        }}>
          {q.why}
        </div>

        {/* Options */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:40}}>
          {q.options.map((opt,i)=>{
            const isNsp=!!opt.nsp;
            const isSel=sel===i;
            return (
              <div key={i} onClick={()=>setSel(i)} style={{
                padding:isNsp?"12px 18px":"15px 20px",
                border:`1.5px solid ${isSel?T.bleu:isNsp?T.grisLine+"88":T.grisLine}`,
                background:isSel?T.bleuPale:T.blanc,
                cursor:"pointer",
                display:"flex",alignItems:"center",gap:14,
                transition:"all 0.15s",
                opacity:isNsp&&!isSel?0.7:1,
              }}
                onMouseOver={e=>{if(!isSel)e.currentTarget.style.borderColor=isNsp?T.grisClair:T.bleu;}}
                onMouseOut={e=>{if(!isSel)e.currentTarget.style.borderColor=isNsp?T.grisLine+"88":T.grisLine;}}
              >
                {/* Radio */}
                <div style={{
                  width:20,height:20,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${isSel?T.bleu:isNsp?T.grisClair:T.grisLine}`,
                  background:isSel?T.bleu:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.15s",
                }}>
                  {isSel&&<div style={{width:7,height:7,borderRadius:"50%",background:T.blanc}}/>}
                </div>
                <div style={{flex:1}}>
                  <div style={{
                    fontSize:isNsp?13:14,
                    color:isSel?T.bleu:isNsp?T.gris:T.encre,
                    fontWeight:isSel?600:isNsp?400:400,
                    fontStyle:isNsp?"italic":"normal",
                    lineHeight:1.4,
                  }}>
                    {opt.label}
                  </div>
                  {/* Alerte NSP */}
                  {isNsp&&isSel&&(
                    <div style={{
                      marginTop:6,fontSize:12,color:T.rouge,
                      fontStyle:"normal",fontWeight:500,
                    }}>
                      ⚠️ L'incertitude sur ce point est elle-même un signal de risque.
                    </div>
                  )}
                </div>
                {/* Score hint */}
                {!isNsp&&(
                  <div style={{
                    fontSize:10,fontWeight:700,letterSpacing:"0.06em",
                    color:opt.score===3?T.niveauSouverain.fg:opt.score===1?T.niveauResiliant.fg:T.niveauExpose.fg,
                    opacity:isSel?1:0.4,flexShrink:0,
                  }}>
                    {opt.score===3?"●●●":opt.score===1?"●●○":"●○○"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={prev} disabled={cur===0} style={{
            background:"none",border:`1px solid ${T.grisLine}`,
            padding:"10px 20px",fontSize:14,color:T.gris,
            opacity:cur===0?0.4:1,cursor:cur===0?"default":"pointer",
            transition:"all 0.15s",
          }}>
            ← Précédent
          </button>
          <button onClick={next} disabled={sel===null} style={{
            background:sel!==null?T.bleu:T.grisLine,
            border:"none",padding:"12px 32px",
            fontSize:14,fontWeight:700,color:T.blanc,
            cursor:sel!==null?"pointer":"default",
            letterSpacing:"0.03em",transition:"all 0.2s",
          }}
            onMouseOver={e=>{if(sel!==null)e.currentTarget.style.background=T.bleuMid;}}
            onMouseOut={e=>{if(sel!==null)e.currentTarget.style.background=T.bleu;}}
          >
            {cur+1===all.length?"Voir mes résultats →":"Question suivante →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 4 — RAPPORT (contemporain)
   ───────────────────────────────────────────── */
function Rapport({profile,answers,questions}) {
  const sc=computeScores(answers,questions);
  const mat=getMaturity(sc.total,sc.max);
  const bench=BENCHMARKS[profile.secteur]||23;
  const userPct=Math.round((sc.total/sc.max)*100);
  const benchPct=Math.round((bench/sc.max)*100);
  const regl=REGLEMENTAIRE[profile.secteur]||REGLEMENTAIRE.autre;
  const offres=OFFRES[mat.key]||OFFRES.expose;
  const [sent,setSent]=useState(false);

  const risks=questions
    .map(q=>{const a=answers[q.id];const opt=q.options[a??0];return{q,sc:opt?.score??0,max:Math.max(...q.options.map(o=>o.score))};})
    .filter(r=>r.sc<r.max)
    .sort((a,b)=>(a.sc/a.max)-(b.sc/b.max))
    .slice(0,3);

  const matScale=[
    {key:"expose",    label:"Exposé",     range:"0–25 %",  color:T.rouge,   bg:"#FEF2F2", from:0,    to:0.25},
    {key:"vulnerable",label:"Vulnérable", range:"25–50 %", color:"#C2410C", bg:"#FFF7ED", from:0.25, to:0.50},
    {key:"resiliant", label:"Résilient",  range:"50–75 %", color:"#B45309", bg:"#FFFBEB", from:0.50, to:0.75},
    {key:"souverain", label:"Souverain",  range:"75–100 %",color:"#15803D", bg:"#F0FDF4", from:0.75, to:1.00},
  ];
  const currentIdx=matScale.findIndex(l=>l.key===mat.key);

  const dimData=[
    {label:"Juridique",   icon:"⚖️", val:sc.j, max:sc.mj, pct:sc.mj?Math.round(sc.j/sc.mj*100):0,
      desc:"Localisation de vos données, fournisseurs cloud et suite bureautique. Détermine la loi applicable à vos données et votre exposition au CLOUD Act américain."},
    {label:"Opérationnel",icon:"⚙️", val:sc.o, max:sc.mo, pct:sc.mo?Math.round(sc.o/sc.mo*100):0,
      desc:"Continuité d'activité, sauvegardes hors ligne, contrôle des accès prestataires et plan de réponse aux incidents cyber."},
    {label:"Stratégique", icon:"🎯", val:sc.s, max:sc.ms, pct:sc.ms?Math.round(sc.s/sc.ms*100):0,
      desc:"Gouvernance de l'IA générative, cartographie des données sensibles et évaluation de la chaîne de sous-traitance numérique."},
  ].map(d=>({...d, mat:getMaturity(d.val,d.max)}));

  const synthTexts = {
    expose:     `Avec ${sc.total} points sur ${sc.max}, votre organisation présente un niveau d'exposition critique, significativement en dessous de la médiane de votre secteur (${bench}/${sc.max}). Vos systèmes comportent des vulnérabilités actives qui exposent vos données à des risques juridiques, opérationnels et stratégiques. Une intervention rapide est indispensable.`,
    vulnerable: `Avec ${sc.total} points sur ${sc.max}, votre organisation a engagé une démarche de protection mais des lacunes importantes subsistent. Plusieurs points de vulnérabilité restent à traiter en priorité pour réduire votre exposition et atteindre un niveau de résilience satisfaisant.`,
    resiliant:  `Avec ${sc.total} points sur ${sc.max}, votre organisation affiche un bon niveau de maturité, au-dessus de la médiane sectorielle. Votre posture de sécurité est solide sur l'essentiel, mais des angles morts demeurent. Un effort ciblé vous permettrait d'atteindre un niveau souverain.`,
    souverain:  `Avec ${sc.total} points sur ${sc.max}, votre organisation atteint un niveau de maturité numérique exemplaire. Votre démarche de souveraineté est structurée et cohérente. Maintenez cette avance en surveillant les évolutions réglementaires et en valorisant votre posture auprès de vos partenaires.`,
  };
  const synthText = synthTexts[mat.key] || synthTexts.expose;

  const timeline=[
    {delay:"Sem. 1", color:T.rouge,   titre:"Cartographier vos données sensibles",
      desc:"Inventaire des actifs numériques, désignation des responsables, classification par niveau de criticité. Socle de tout plan de souveraineté."},
    {delay:"Mois 1", color:"#C2410C", titre:"Identifier vos obligations réglementaires",
      desc:"Confirmer si votre entité est dans le scope NIS2 / DORA, identifier les échéances légales et désigner un référent conformité."},
    {delay:"Mois 3", color:"#B45309", titre:"Auditer votre chaîne IT & fournisseurs",
      desc:"Évaluer chaque fournisseur critique sur ses pratiques de sécurité, sa juridiction et les clauses contractuelles manquantes."},
    {delay:"Mois 6", color:"#15803D", titre:"Déployer les premières mesures souveraines",
      desc:"Remplacer les solutions les plus exposées, généraliser le MFA, mettre en place des sauvegardes hors ligne testées régulièrement."},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.grisbg,fontFamily:"'Marianne','Helvetica Neue',Helvetica,sans-serif"}}>
      <style>{`
        @media print {
          nav,button,.no-print{display:none!important;}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
        }
        @media (max-width:768px){
          .rg2{grid-template-columns:1fr!important;}
          .rg3{grid-template-columns:1fr!important;}
          .rghero{grid-template-columns:1fr!important;}
        }
      `}</style>
      <Liseret height={5}/>

      {/* NAV */}
      <nav className="nav-main" style={{padding:"0 48px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.blanc,borderBottom:`1px solid ${T.grisLine}`}}>
        <Logo/>
        <div style={{fontSize:11,color:T.gris,letterSpacing:"0.06em",fontWeight:500}}>
          RAPPORT CONFIDENTIEL · {new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
        </div>
      </nav>

      {/* ══ SECTION 1 : SCORE + ÉCHELLE DE MATURITÉ ══ */}
      <div style={{background:T.blanc,borderBottom:`1px solid ${T.grisLine}`,position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:T.rouge}}/>
        <div className="rapport-inner" style={{maxWidth:1060,margin:"0 auto",padding:"40px 52px"}}>
          <div style={{fontSize:12,color:T.gris,letterSpacing:"0.08em",marginBottom:28,fontWeight:500}}>
            {profile.prenom} {profile.nom} · {profile.poste} · {profile.entreprise}
          </div>
          <div className="rghero" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"center"}}>

            {/* Gauche — Score */}
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 18px",marginBottom:20,background:mat.bg,border:`1px solid ${mat.border}`}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:mat.fg}}/>
                <span style={{fontSize:13,fontWeight:700,color:mat.fg,letterSpacing:"0.06em"}}>NIVEAU {mat.label.toUpperCase()}</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:16}}>
                <span className="score-big" style={{fontSize:84,fontWeight:700,color:T.ardoise,lineHeight:1,letterSpacing:"-0.04em"}}>{sc.total}</span>
                <span style={{color:T.grisClair,fontSize:32,fontWeight:300}}>/ {sc.max}</span>
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:14,padding:"10px 18px",background:T.grisbg,border:`1px solid ${T.grisLine}`}}>
                <span style={{fontSize:12,color:T.gris}}>Médiane sectorielle</span>
                <span style={{fontSize:14,fontWeight:700,color:userPct>=benchPct?"#15803D":T.rouge}}>
                  {bench}/{sc.max} · {userPct>=benchPct?`+${userPct-benchPct} pts au-dessus`:`${benchPct-userPct} pts en dessous`}
                </span>
              </div>
            </div>

            {/* Droite — Échelle des 4 niveaux */}
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:T.gris,textTransform:"uppercase",marginBottom:14}}>
                Où vous vous situez
              </div>
              {/* Barre de progression */}
              <div style={{position:"relative",marginBottom:20}}>
                <div style={{height:12,display:"flex",borderRadius:6,overflow:"hidden",background:T.grisLine}}>
                  {matScale.map((l,i)=>(
                    <div key={i} style={{flex:1,background:i<=currentIdx?l.color:"transparent",opacity:i<=currentIdx?1:1,transition:"width 0.8s"}}/>
                  ))}
                </div>
                <div style={{
                  position:"absolute",left:`calc(${Math.min(userPct,98)}% - 10px)`,top:-4,
                  width:20,height:20,borderRadius:"50%",
                  background:mat.fg,border:`3px solid ${T.blanc}`,
                  boxShadow:`0 2px 8px rgba(0,0,0,0.18)`,
                }}/>
              </div>
              {/* 4 cases de niveau */}
              <div className="mat-scale" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {matScale.map((l,i)=>(
                  <div key={i} style={{
                    padding:"10px 8px",textAlign:"center",
                    background:mat.key===l.key?l.bg:T.grisbg,
                    border:`1.5px solid ${mat.key===l.key?l.color+"80":T.grisLine}`,
                  }}>
                    <div style={{fontSize:11,fontWeight:mat.key===l.key?700:400,color:mat.key===l.key?l.color:T.grisClair,lineHeight:1.3}}>
                      {l.label}
                    </div>
                    <div style={{fontSize:9,color:mat.key===l.key?l.color:T.grisClair,marginTop:3,opacity:0.75}}>{l.range}</div>
                    {mat.key===l.key&&(
                      <div style={{fontSize:9,fontWeight:700,color:l.color,marginTop:5,letterSpacing:"0.04em"}}>▲ VOUS</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Synthèse */}
          <div style={{
            marginTop:32,paddingTop:24,
            borderTop:`1px solid ${T.grisLine}`,
            background:T.blanc,
          }}>
            <p style={{fontSize:14,color:T.ardoise,lineHeight:1.75,margin:0,maxWidth:760}}>
              {synthText}
            </p>
          </div>
        </div>
      </div>

      {/* ══ SECTION 2 : 3 DIMENSIONS ENRICHIES ══ */}
      <div style={{borderBottom:`1px solid ${T.grisLine}`}}>
        <div style={{maxWidth:1060,margin:"0 auto",padding:"0 52px"}}>
        <div className="rg3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:T.grisLine}}>
        {dimData.map((d,i)=>(
          <div key={i} style={{background:T.blanc,padding:"28px 28px",borderTop:`4px solid ${d.mat.fg}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{d.icon}</span>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.gris,textTransform:"uppercase"}}>{d.label}</span>
              </div>
              <div style={{padding:"3px 10px",background:d.mat.bg,border:`1px solid ${d.mat.fg}40`,fontSize:10,fontWeight:700,color:d.mat.fg}}>
                {d.mat.label}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:10}}>
              <span className="score-dim" style={{fontSize:38,fontWeight:700,color:T.ardoise,letterSpacing:"-0.02em",lineHeight:1}}>{d.val}</span>
              <span style={{fontSize:16,color:T.grisClair}}>/{d.max}</span>
              <span style={{fontSize:13,color:d.mat.fg,fontWeight:700,marginLeft:6}}>{d.pct} %</span>
            </div>
            <div style={{height:6,background:T.grisLine,marginBottom:16,borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${d.pct}%`,background:d.mat.fg,transition:"width 1s ease",borderRadius:3}}/>
            </div>
            <p style={{fontSize:12,color:T.gris,lineHeight:1.7,fontFamily:"inherit",margin:0}}>{d.desc}</p>
          </div>
        ))}
      </div>
        </div>
      </div>

      {/* ══ SECTION 3 : ANALYSE + PLAN ══ */}
      <div className="rapport-inner" style={{maxWidth:1060,margin:"0 auto",padding:"40px 52px"}}>
        <div className="rg2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>

          {/* COL GAUCHE */}
          <div style={{display:"flex",flexDirection:"column",gap:24}}>

            {/* Cadre réglementaire */}
            <div style={{background:T.blanc,border:`1px solid ${T.grisLine}`,padding:"28px",borderLeft:`4px solid ${regl.color}`}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.gris,textTransform:"uppercase",marginBottom:14}}>Cadre réglementaire sectoriel</div>
              <div style={{display:"inline-block",padding:"4px 12px",background:regl.color,color:T.blanc,fontSize:12,fontWeight:700,letterSpacing:"0.06em",marginBottom:14}}>{regl.badge}</div>
              <p style={{fontSize:13,color:T.gris,lineHeight:1.7,fontFamily:"inherit",margin:0}}>{regl.text}</p>
            </div>

            {/* Risques prioritaires */}
            <div style={{background:T.blanc,border:`1px solid ${T.grisLine}`,padding:"28px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.gris,textTransform:"uppercase",marginBottom:20}}>Vos 3 risques prioritaires</div>
              {risks.map((r,i)=>(
                <div key={i} style={{display:"flex",gap:16,paddingBottom:i<2?22:0,marginBottom:i<2?22:0,borderBottom:i<2?`1px solid ${T.grisLine}`:"none"}}>
                  <div style={{width:28,height:28,flexShrink:0,background:i===0?T.rouge:i===1?"#EA580C":"#CA8A04",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:T.blanc}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",color:T.ardoise,opacity:0.5,marginBottom:4,textTransform:"uppercase"}}>{r.q.module}</div>
                    <div style={{fontSize:13,fontWeight:600,color:T.ardoise,marginBottom:6,lineHeight:1.4}}>{r.q.text}</div>
                    <div style={{fontSize:12,color:T.gris,lineHeight:1.6,fontStyle:"normal"}}>{r.q.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COL DROITE */}
          <div style={{display:"flex",flexDirection:"column",gap:24}}>

            {/* Accompagnement */}
            {!sent?(
              <div style={{background:T.blanc,border:`1px solid ${T.grisLine}`,padding:"28px"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.gris,textTransform:"uppercase",marginBottom:20}}>Accompagnement recommandé</div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {offres.map((o,i)=>(
                    <div key={i} style={{background:T.grisbg,border:`1px solid ${T.grisLine}`,padding:"18px 20px",borderLeft:`3px solid ${i===0?T.ardoise:T.rouge}`}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:i===0?T.ardoise:T.rouge,textTransform:"uppercase",marginBottom:6}}>{o.tag}</div>
                      <div style={{fontSize:14,fontWeight:700,color:T.ardoise,marginBottom:6,lineHeight:1.3}}>{o.titre}</div>
                      <div style={{fontSize:12,color:T.gris,marginBottom:14,lineHeight:1.6,fontFamily:"inherit"}}>{o.desc}</div>
                      <button onClick={()=>setSent(true)} style={{width:"100%",background:i===0?T.ardoise:T.rouge,color:T.blanc,border:"none",padding:"10px",fontSize:12,fontWeight:700,letterSpacing:"0.04em",cursor:"pointer",transition:"opacity 0.2s"}}
                        onMouseOver={e=>e.currentTarget.style.opacity="0.85"}
                        onMouseOut={e=>e.currentTarget.style.opacity="1"}
                      >{o.cta} →</button>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div style={{background:T.grisbg,border:`1px solid ${T.grisLine}`,padding:"40px 28px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"#D1FAE5",border:"2px solid #16A34A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:16}}>✓</div>
                <div style={{fontSize:16,fontWeight:700,color:T.ardoise,marginBottom:8}}>Demande envoyée</div>
                <div style={{fontSize:12,color:T.gris,lineHeight:1.7,fontFamily:"inherit"}}>Un conseiller vous contactera sous 24h à<br/><strong style={{color:T.ardoise}}>{profile.email}</strong></div>
              </div>
            )}

            {/* Timeline visuelle */}
            <div style={{background:T.blanc,border:`1px solid ${T.grisLine}`,padding:"28px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:T.gris,textTransform:"uppercase",marginBottom:28}}>Plan d'action recommandé</div>
              <div style={{position:"relative"}}>
                {/* Ligne verticale */}
                <div style={{position:"absolute",left:19,top:20,bottom:20,width:2,background:T.grisLine}}/>
                {timeline.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:20,marginBottom:i<timeline.length-1?24:0,position:"relative",alignItems:"flex-start"}}>
                    {/* Pastille */}
                    <div style={{
                      width:40,height:40,borderRadius:"50%",flexShrink:0,
                      background:s.color,border:`3px solid ${T.blanc}`,
                      boxShadow:`0 0 0 2px ${s.color}40`,
                      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                      zIndex:1,
                    }}>
                      <span style={{fontSize:8,fontWeight:800,color:T.blanc,letterSpacing:"0.03em",lineHeight:1.1,textAlign:"center",padding:"0 2px"}}>{s.delay}</span>
                    </div>
                    <div style={{paddingTop:6,flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.ardoise,marginBottom:4,lineHeight:1.3}}>{s.titre}</div>
                      <div style={{fontSize:12,color:T.gris,lineHeight:1.6,fontFamily:"inherit"}}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rapport-footer" style={{marginTop:40,paddingTop:24,borderTop:`1px solid ${T.grisLine}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div style={{fontSize:11,color:T.grisClair,lineHeight:1.6,fontStyle:"normal"}}>
            Diagnostic basé sur la Stratégie nationale de cybersécurité SGDSN 2026–2030.<br/>
            Les scores sont indicatifs et ne constituent pas un audit de conformité certifié.
          </div>
          <div className="no-print">
            <button onClick={()=>window.print()} style={{background:"none",border:`1px solid ${T.grisLine}`,padding:"9px 18px",fontSize:12,fontWeight:600,color:T.gris,cursor:"pointer",letterSpacing:"0.04em",transition:"border-color 0.15s"}}
              onMouseOver={e=>e.currentTarget.style.borderColor=T.ardoise}
              onMouseOut={e=>e.currentTarget.style.borderColor=T.grisLine}
            >Imprimer le rapport</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE CONTACT — Calendrier Meetergo
   ───────────────────────────────────────────── */
function Contact() {
  const meetergoRef = useRef(null);

  useEffect(() => { document.title = "Prendre rendez-vous · SovNum"; }, []);

  useEffect(() => {
    // Injecter le widget Meetergo via innerHTML pour respecter le format attendu par le script
    if (meetergoRef.current) {
      meetergoRef.current.innerHTML = '<div style="min-width:330px" class="meetergo-iframe" link="https://cal.meetergo.com/tmethesovcie/30-min-meeting-with-tristan"></div>';
    }
    // Charger (ou recharger) le script Meetergo
    const existing = document.querySelector('script[src*="meetergo"]');
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.src = "https://liv-showcase.s3.eu-central-1.amazonaws.com/browser-v3.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const F = "'Marianne', 'Helvetica Neue', Helvetica, sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: T.grisbg }}>
      <Liseret />
      {/* Header */}
      <header style={{ background: T.blanc, borderBottom: `1px solid ${T.grisLine}`, padding: "16px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}><Logo /></a>
          <a href="/" style={{
            fontFamily: F, fontSize: 13, fontWeight: 600, color: T.bleu, textDecoration: "none",
            padding: "8px 20px", border: `1px solid ${T.bleu}`, borderRadius: 4,
          }}>Retour au diagnostic</a>
        </div>
      </header>

      {/* Contenu */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: T.ardoise, margin: "0 0 16px",
            fontFamily: F,
          }}>
            Construisons votre feuille de route souveraine
          </h1>
          <p style={{ fontFamily: F, fontSize: 16, color: T.gris, lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
            Réservez un créneau de 30 minutes avec notre équipe pour analyser vos résultats et définir ensemble les premières actions concrètes.
          </p>
        </div>

        {/* Widget Meetergo */}
        <div style={{
          background: T.blanc, borderRadius: 8, border: `1px solid ${T.grisLine}`,
          padding: 24, minHeight: 500,
        }}>
          <div ref={meetergoRef} />
        </div>

        {/* Contact alternatif */}
        <div style={{ textAlign: "center", marginTop: 40, padding: "24px 0" }}>
          <p style={{ fontFamily: F, fontSize: 13, color: T.grisClair }}>
            Vous préférez nous écrire ? <a href="mailto:contact@sovnum.fr" style={{ color: T.bleu, fontWeight: 600 }}>contact@sovnum.fr</a>
          </p>
          <p style={{ fontFamily: F, fontSize: 10, color: T.grisClair, marginTop: 12, letterSpacing: "0.06em" }}>
            SovNum est une marque de <span style={{ fontWeight: 400 }}>The Sov</span>{" "}<span style={{ fontWeight: 700 }}>Company</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE MENTIONS LÉGALES
   ───────────────────────────────────────────── */
function MentionsLegales() {
  useEffect(() => { document.title = "Mentions légales · SovNum"; }, []);
  const F = "'Marianne', 'Helvetica Neue', Helvetica, sans-serif";
  const S = { h2: { fontFamily: F, fontSize: 18, fontWeight: 700, color: T.ardoise, margin: "32px 0 12px" }, p: { fontFamily: F, fontSize: 14, color: T.gris, lineHeight: 1.7, margin: "0 0 12px" } };

  return (
    <div style={{ minHeight: "100vh", background: T.grisbg }}>
      <Liseret />
      <header style={{ background: T.blanc, borderBottom: `1px solid ${T.grisLine}`, padding: "16px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}><Logo /></a>
          <a href="/" style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.bleu, textDecoration: "none", padding: "8px 20px", border: `1px solid ${T.bleu}`, borderRadius: 4 }}>Retour au diagnostic</a>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: T.ardoise, margin: "0 0 8px" }}>Mentions légales</h1>
        <p style={{ fontFamily: F, fontSize: 13, color: T.grisClair, margin: "0 0 40px" }}>Dernière mise à jour : février 2026</p>

        <h2 style={S.h2}>1. Éditeur du site</h2>
        <p style={S.p}>
          Le site sovnum.fr est édité par :<br />
          <strong>The Sov Company</strong> — Société par actions simplifiée unipersonnelle (SASU)<br />
          Capital social : 31 250 €<br />
          Siège social : 60 rue François Ier, 75008 Paris, France<br />
          RCS Paris : 999 541 931<br />
          Directeur de la publication : Tristan Méneret<br />
          Email : <a href="mailto:contact@thesovcie.com" style={{ color: T.bleu }}>contact@thesovcie.com</a>
        </p>

        <h2 style={S.h2}>2. Hébergement</h2>
        <p style={S.p}>
          Le site sovnum.fr est hébergé au sein de l'Union européenne. Pour toute question relative à l'hébergement, contactez-nous à <a href="mailto:contact@thesovcie.com" style={{ color: T.bleu }}>contact@thesovcie.com</a>.
        </p>

        <h2 style={S.h2}>3. Propriété intellectuelle</h2>
        <p style={S.p}>
          L'ensemble des contenus présents sur le site sovnum.fr (textes, graphismes, logos, icônes, images, données, questionnaires, algorithmes de scoring) est la propriété exclusive de The Sov Company ou fait l'objet d'une autorisation d'utilisation.
        </p>
        <p style={S.p}>
          Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de The Sov Company.
        </p>

        <h2 style={S.h2}>4. Protection des données personnelles (RGPD)</h2>
        <p style={S.p}>
          The Sov Company, en qualité de responsable de traitement, collecte des données personnelles dans le cadre du diagnostic SovNum : prénom, nom, poste, adresse email professionnelle, nom de l'entreprise, numéro SIREN et secteur d'activité.
        </p>
        <p style={S.p}>
          <strong>Finalités du traitement :</strong> réalisation du diagnostic de souveraineté numérique, envoi du rapport de résultats par email, et envoi de communications de suivi (analyses de risques, obligations réglementaires, propositions d'accompagnement).
        </p>
        <p style={S.p}>
          <strong>Base légale :</strong> intérêt légitime de The Sov Company à fournir le service de diagnostic demandé par l'utilisateur et à proposer un accompagnement adapté.
        </p>
        <p style={S.p}>
          <strong>Durée de conservation :</strong> les données sont conservées pendant une durée maximale de 24 mois à compter de la réalisation du diagnostic, sauf demande de suppression anticipée.
        </p>
        <p style={S.p}>
          <strong>Droits des utilisateurs :</strong> conformément au Règlement Général sur la Protection des Données (UE) 2016/679, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité et d'opposition. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@thesovcie.com" style={{ color: T.bleu }}>contact@thesovcie.com</a>.
        </p>
        <p style={S.p}>
          <strong>Sous-traitants :</strong> les données sont traitées par Supabase (hébergement base de données, UE) et Resend (envoi d'emails transactionnels).
        </p>

        <h2 style={S.h2}>5. Cookies</h2>
        <p style={S.p}>
          Le site sovnum.fr n'utilise aucun cookie publicitaire ni traceur tiers. Seuls des cookies strictement nécessaires au fonctionnement technique du site peuvent être utilisés. Aucun consentement n'est requis pour ces cookies conformément aux recommandations de la CNIL.
        </p>

        <h2 style={S.h2}>6. Limitation de responsabilité</h2>
        <p style={S.p}>
          Le diagnostic SovNum fournit une évaluation indicative de la posture de souveraineté numérique d'une organisation. Il ne constitue en aucun cas un audit de conformité certifié, un conseil juridique ou une expertise de sécurité informatique. The Sov Company ne saurait être tenue responsable des décisions prises sur la base des résultats du diagnostic.
        </p>

        <h2 style={S.h2}>7. Droit applicable</h2>
        <p style={S.p}>
          Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux de Paris seront seuls compétents.
        </p>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${T.grisLine}`, marginTop: 48, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: F, fontSize: 10, color: T.grisClair, letterSpacing: "0.06em" }}>
            <span style={{ fontWeight: 400 }}>The Sov</span>{" "}<span style={{ fontWeight: 700 }}>Company</span> · © {new Date().getFullYear()} SovNum
          </div>
          <a href="/" style={{ fontFamily: F, fontSize: 11, color: T.grisClair, textDecoration: "none" }}>Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP
   ───────────────────────────────────────────── */
export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [screen,setScreen]=useState("landing");
  const [prefill,setPrefill]=useState(null);
  const [profile,setProfile]=useState(null);
  const [answers,setAnswers]=useState({});
  const [questions,setQuestions]=useState([]);
  const [diagnosticId,setDiagnosticId]=useState(null);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Pages statiques
  if (route === "/contact") return <Contact />;
  if (route === "/mentions-legales") return <MentionsLegales />;

  async function saveDiagnostic(prof, ans, qs) {
    const sc = computeScores(ans, qs);
    const mat = getMaturity(sc.total, sc.max);
    try {
      const { data, error } = await supabase.from("diagnostics").insert({
        prenom: prof.prenom,
        nom: prof.nom,
        poste: prof.poste,
        email: prof.email,
        entreprise: prof.entreprise,
        siren: prof.siren,
        secteur: prof.secteur,
        score_total: sc.total,
        score_max: sc.max,
        score_juridique: sc.j,
        score_max_juridique: sc.mj,
        score_operationnel: sc.o,
        score_max_operationnel: sc.mo,
        score_strategique: sc.s,
        score_max_strategique: sc.ms,
        niveau_maturite: mat.key,
        answers: ans,
      }).select("id").single();

      if (error) { console.error("Supabase save error:", error); return null; }

      const id = data.id;
      setDiagnosticId(id);

      // Déclencher l'email J+0 immédiatement
      supabase.functions.invoke("send-email", {
        body: { diagnostic_id: id, email_type: "j0" },
      }).catch(e => console.error("Email J+0 error:", e));

      return id;
    } catch(e) {
      console.error("saveDiagnostic error:", e);
      return null;
    }
  }

  if(screen==="landing")  return <Landing onStart={(data)=>{setPrefill(data);setScreen("identification");}}/>;
  if(screen==="identification") return <Identification initialData={prefill} onComplete={p=>{setProfile(p);setScreen("diagnostic");}}/>;
  if(screen==="diagnostic"&&profile) return <Diagnostic profile={profile} onComplete={(a,q)=>{setAnswers(a);setQuestions(q);saveDiagnostic(profile,a,q);setScreen("rapport");}}/>;
  if(screen==="rapport"&&profile)    return <Rapport profile={profile} answers={answers} questions={questions} diagnosticId={diagnosticId}/>;
  return null;
}
