import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL     = "SovNum <rapport@sovnum.fr>";
const NOTIFY_EMAIL   = "tmeneret@pm.me";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ───────────── Design tokens (alignés sur App.jsx) ───────────── */

const C = {
  bleu:     "#2563EB",
  bleuMid:  "#1D4ED8",
  ardoise:  "#0F172A",
  gris:     "#64748B",
  grisClair:"#94A3B8",
  grisLine: "#E2E8F0",
  grisbg:   "#F8FAFC",
  blanc:    "#FFFFFF",
  rouge:    "#EF4444",
  rougePale:"#FEF2F2",
  vertPale: "#F0FDF4",
  vert:     "#16A34A",
  vertFonce:"#166534",
  orange:   "#EA580C",
  orangePale:"#FFF7ED",
  ambrePale:"#FFFBEB",
  ambre:    "#B45309",
};

/* ───────────── Composants email réutilisables ───────────── */

function emailHeader(subtitle: string): string {
  return `
        <!-- Accent bar -->
        <tr><td style="height:4px;background:${C.bleu};"></td></tr>

        <!-- En-tête -->
        <tr><td style="background:${C.blanc};padding:28px 40px;border-bottom:1px solid ${C.grisLine};">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:14px;">
              <img src="https://sovnum.fr/logo-email.png" width="32" height="32" alt="S" style="display:block;border-radius:50%;" />
            </td>
            <td style="vertical-align:middle;">
              <div style="color:${C.ardoise};font-size:20px;font-weight:700;letter-spacing:0.04em;line-height:1;">SovNum</div>
              <div style="color:${C.gris};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;margin-top:3px;line-height:1;">Souveraineté Numérique</div>
              <div style="color:${C.grisClair};font-size:8px;letter-spacing:0.06em;margin-top:4px;line-height:1;"><span style="font-weight:400;">The Sov</span> <span style="font-weight:700;">Company</span></div>
            </td>
          </tr></table>
          <div style="color:${C.ardoise};font-size:14px;margin-top:20px;line-height:1.6;">${subtitle}</div>
        </td></tr>`;
}

function emailFooter(line1: string, line2: string): string {
  return `
          <p style="font-size:12px;color:${C.grisClair};margin:32px 0 0;text-align:center;">
            ${line1}<br>
            ${line2}
          </p>
          <p style="font-size:10px;color:${C.grisLine};margin:12px 0 0;text-align:center;">
            SovNum est une marque de <span style="font-weight:400;">The Sov</span> <span style="font-weight:700;">Company</span>
          </p>`;
}

/* ───────────── Templates email ───────────── */

function emailJ0(data: DiagnosticData): EmailPayload {
  const niveauLabel = {
    expose: "Exposé 🔴", vulnerable: "Vulnérable 🟠",
    resiliant: "Résilient 🟡", souverain: "Souverain 🟢",
  }[data.niveau_maturite] ?? "Exposé";

  const pct = Math.round((data.score_total / data.score_max) * 100);
  const pctJ = data.score_max_juridique   ? Math.round((data.score_juridique   / data.score_max_juridique)   * 100) : 0;
  const pctO = data.score_max_operationnel ? Math.round((data.score_operationnel / data.score_max_operationnel) * 100) : 0;
  const pctS = data.score_max_strategique  ? Math.round((data.score_strategique  / data.score_max_strategique)  * 100) : 0;

  // Texte d'interprétation selon le niveau
  const interpretation: Record<string, string> = {
    expose: "Votre organisation présente une exposition significative aux risques numériques. Des données critiques sont potentiellement accessibles à des juridictions étrangères, et les mécanismes de résilience sont insuffisants face aux menaces actuelles.",
    vulnerable: "Votre organisation a initié certaines démarches, mais des vulnérabilités importantes subsistent. Des actions correctives ciblées permettraient de réduire rapidement votre surface d'exposition.",
    resiliant: "Votre organisation dispose de fondations solides. Quelques axes d'amélioration restent à adresser pour atteindre une souveraineté numérique complète, notamment sur le plan réglementaire.",
    souverain: "Félicitations. Votre organisation maîtrise ses dépendances numériques et dispose d'une posture de souveraineté avancée. Maintenez cette vigilance face à l'évolution des menaces.",
  };
  const interpText = interpretation[data.niveau_maturite] ?? interpretation.expose;

  // Dimension la plus faible
  const dims = [
    { nom: "Juridique", pct: pctJ },
    { nom: "Opérationnel", pct: pctO },
    { nom: "Stratégique", pct: pctS },
  ].sort((a, b) => a.pct - b.pct);
  const weakest = dims[0];

  const niveauColors: Record<string, { fg: string; bg: string }> = {
    expose:     { fg: "#DC2626", bg: C.rougePale },
    vulnerable: { fg: C.orange,  bg: C.orangePale },
    resiliant:  { fg: C.vert,    bg: C.vertPale },
    souverain:  { fg: C.vertFonce, bg: "#ECFDF5" },
  };
  const nc = niveauColors[data.niveau_maturite] ?? niveauColors.expose;

  const CONTACT_URL = "https://sovnum.fr/contact";

  return {
    to: data.email,
    subject: `Votre rapport SovNum · Niveau ${niveauLabel}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport SovNum</title></head>
<body style="margin:0;padding:0;background:${C.grisbg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.grisbg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border-radius:8px;overflow:hidden;">

        ${emailHeader(`Bonjour ${data.prenom},<div style="color:${C.gris};font-size:14px;margin-top:8px;line-height:1.6;">Voici votre rapport de souveraineté numérique pour <strong>${data.entreprise}</strong>.<br>Ce diagnostic évalue votre exposition aux risques juridiques, opérationnels et stratégiques liés à vos dépendances numériques.</div>`)}

        <!-- Score global -->
        <tr><td style="background:${C.blanc};padding:32px 40px;border-bottom:1px solid ${C.grisLine};">
          <div style="font-size:10px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px;">Score global</div>
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-size:48px;font-weight:700;color:${C.ardoise};line-height:1;">${data.score_total}</td>
            <td style="font-size:18px;color:${C.grisClair};padding-left:6px;vertical-align:baseline;">/ ${data.score_max}</td>
            <td style="font-size:20px;font-weight:600;color:${C.bleu};padding-left:12px;vertical-align:baseline;">${pct}%</td>
          </tr></table>
          <div style="margin-top:16px;background:${C.grisLine};height:6px;border-radius:3px;">
            <div style="width:${pct}%;background:${C.bleu};height:6px;border-radius:3px;"></div>
          </div>
          <div style="margin-top:16px;display:inline-block;padding:6px 16px;background:${nc.bg};border:1px solid ${nc.fg}40;font-size:13px;font-weight:700;color:${nc.fg};">
            Niveau : ${niveauLabel}
          </div>
          <p style="font-size:13px;color:${C.gris};line-height:1.7;margin:16px 0 0;">
            ${interpText}
          </p>
        </td></tr>

        <!-- 3 dimensions -->
        <tr><td style="background:${C.blanc};padding:24px 40px 32px;border-bottom:1px solid ${C.grisLine};">
          <div style="font-size:10px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:20px;">Détail par dimension</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:20px;">⚖️</div>
                <div style="font-size:11px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Juridique</div>
                <div style="font-size:22px;font-weight:700;color:${C.ardoise};margin-top:4px;">${pctJ}%</div>
                <div style="font-size:11px;color:${C.grisClair};">${data.score_juridique}/${data.score_max_juridique}</div>
              </td>
              <td width="12"></td>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:20px;">⚙️</div>
                <div style="font-size:11px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Opérationnel</div>
                <div style="font-size:22px;font-weight:700;color:${C.ardoise};margin-top:4px;">${pctO}%</div>
                <div style="font-size:11px;color:${C.grisClair};">${data.score_operationnel}/${data.score_max_operationnel}</div>
              </td>
              <td width="12"></td>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:20px;">🎯</div>
                <div style="font-size:11px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;">Stratégique</div>
                <div style="font-size:22px;font-weight:700;color:${C.ardoise};margin-top:4px;">${pctS}%</div>
                <div style="font-size:11px;color:${C.grisClair};">${data.score_strategique}/${data.score_max_strategique}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Point d'attention -->
        <tr><td style="background:${C.blanc};padding:24px 40px 32px;border-bottom:1px solid ${C.grisLine};">
          <div style="background:${C.rougePale};border-left:4px solid ${C.rouge};padding:16px 20px;">
            <div style="font-size:10px;font-weight:700;color:${C.rouge};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Axe prioritaire</div>
            <div style="font-size:14px;font-weight:700;color:${C.ardoise};">Dimension ${weakest.nom} · ${weakest.pct}%</div>
            <div style="font-size:13px;color:${C.gris};margin-top:6px;line-height:1.6;">
              C'est votre dimension la plus exposée. Nous vous enverrons dans 3 jours une analyse détaillée de ce risque avec des recommandations d'actions immédiates.
            </div>
          </div>
        </td></tr>

        <!-- Prochaines étapes -->
        <tr><td style="background:${C.blanc};padding:24px 40px 32px;border-bottom:1px solid ${C.grisLine};">
          <div style="font-size:10px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px;">Ce qui vous attend</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};">J+3 · Analyse de risque</div>
                <div style="font-size:12px;color:${C.gris};margin-top:2px;">Votre risque prioritaire décrypté avec des actions concrètes</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:10px 12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};">J+7 · Obligations réglementaires</div>
                <div style="font-size:12px;color:${C.gris};margin-top:2px;">Checklist NIS2 & DORA adaptée à votre secteur</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:10px 12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};">J+14 · Feuille de route</div>
                <div style="font-size:12px;color:${C.gris};margin-top:2px;">Proposition d'accompagnement personnalisé</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:${C.blanc};padding:32px 40px;">
          <p style="font-size:14px;color:${C.ardoise};line-height:1.7;margin:0 0 24px;font-weight:600;">
            Vous souhaitez aller plus vite ? Échangeons dès maintenant sur vos résultats.
          </p>
          <div style="text-align:center;">
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:${C.bleu};color:${C.blanc};font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
              Parler à un expert →
            </a>
          </div>
          ${emailFooter("SovNum · Souveraineté Numérique", "Cet email a été généré automatiquement suite à votre diagnostic.")}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function emailJ3(data: DiagnosticData): EmailPayload {
  const pctJ = data.score_max_juridique   ? Math.round((data.score_juridique   / data.score_max_juridique)   * 100) : 0;
  const pctO = data.score_max_operationnel ? Math.round((data.score_operationnel / data.score_max_operationnel) * 100) : 0;
  const pctS = data.score_max_strategique  ? Math.round((data.score_strategique  / data.score_max_strategique)  * 100) : 0;

  const dims = [
    { key: "juridique",     nom: "Juridique",     pct: pctJ },
    { key: "operationnel",  nom: "Opérationnel",  pct: pctO },
    { key: "strategique",   nom: "Stratégique",   pct: pctS },
  ].sort((a, b) => a.pct - b.pct);
  const weakest = dims[0];

  const riskContent: Record<string, { titre: string; desc: string; actions: { titre: string; desc: string }[] }> = {
    juridique: {
      titre: "Exposition aux lois extraterritoriales",
      desc: "Vos données hébergées ou traitées par des prestataires soumis au CLOUD Act américain (AWS, Azure, Google Cloud, Microsoft 365) peuvent être accédées par les autorités américaines sans notification. Pour une organisation française, cela représente un risque juridique direct et un risque de confidentialité stratégique.",
      actions: [
        { titre: "Cartographier vos données critiques", desc: "Identifiez quelles données (RH, financières, R&D, clients) sont hébergées par des fournisseurs soumis à des juridictions étrangères." },
        { titre: "Évaluer les alternatives qualifiées SecNumCloud", desc: "OVHcloud, Outscale (Dassault), Scaleway et Thales proposent des offres qualifiées par l'ANSSI, non soumises aux lois américaines." },
        { titre: "Auditer vos contrats fournisseurs", desc: "Vérifiez les clauses de localisation des données, de sous-traitance et de transfert hors UE dans vos contrats actuels." },
      ],
    },
    operationnel: {
      titre: "Résilience opérationnelle insuffisante",
      desc: "Votre capacité à maintenir la continuité d'activité en cas d'incident est fragile. Sans plan de reprise testé, sans sauvegardes vérifiées et sans redondance, un incident majeur (cyberattaque, panne fournisseur, catastrophe) pourrait paralyser votre organisation pendant des semaines.",
      actions: [
        { titre: "Tester votre plan de reprise d'activité", desc: "Un PRA non testé est un PRA qui ne fonctionne pas. Planifiez un exercice de simulation dans les 30 prochains jours." },
        { titre: "Appliquer la règle de sauvegarde 3-2-1", desc: "3 copies de vos données, sur 2 supports différents, dont 1 hors site. Vérifiez que vos sauvegardes sont restaurables." },
        { titre: "Identifier vos dépendances critiques", desc: "Listez les services sans lesquels votre activité s'arrête et évaluez le temps de rétablissement pour chacun." },
      ],
    },
    strategique: {
      titre: "Gouvernance numérique à structurer",
      desc: "Votre organisation manque de visibilité sur ses flux de données, ses dépendances stratégiques et ses obligations réglementaires. Sans cartographie claire et sans politique de gouvernance, les décisions numériques sont prises sans mesurer leur impact sur la souveraineté et la conformité.",
      actions: [
        { titre: "Réaliser une cartographie des flux de données", desc: "Identifiez où transitent vos données sensibles : quels outils, quels pays, quels sous-traitants. C'est le prérequis à toute démarche de conformité." },
        { titre: "Encadrer l'usage de l'IA générative", desc: "Définissez une politique claire : quels outils sont autorisés, quelles données peuvent y être soumises, quels usages sont interdits." },
        { titre: "Évaluer la sécurité de votre chaîne fournisseurs", desc: "Vos fournisseurs IT ont-ils des certifications ? Leurs pratiques de sécurité sont-elles auditées ? NIS2 rend cette évaluation obligatoire." },
      ],
    },
  };

  const risk = riskContent[weakest.key] ?? riskContent.juridique;
  const CONTACT_URL = "https://sovnum.fr/contact";

  return {
    to: data.email,
    subject: `${data.prenom}, votre risque prioritaire · SovNum`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Risque prioritaire · SovNum</title></head>
<body style="margin:0;padding:0;background:${C.grisbg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.grisbg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border-radius:8px;overflow:hidden;">

        ${emailHeader("Analyse de risque · J+3")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:${C.ardoise};margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 8px;">
            Suite à votre diagnostic SovNum pour <strong>${data.entreprise}</strong>, votre dimension la plus exposée est <strong>${weakest.nom}</strong> avec un score de <strong>${weakest.pct}%</strong>.
          </p>
          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 24px;">
            Voici une analyse approfondie de ce risque et des actions concrètes à engager.
          </p>

          <!-- Risque prioritaire -->
          <div style="background:${C.rougePale};border-left:4px solid ${C.rouge};padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:700;color:${C.rouge};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Risque prioritaire · ${weakest.nom} ${weakest.pct}%</div>
            <div style="font-size:16px;font-weight:700;color:${C.ardoise};margin-bottom:8px;">${risk.titre}</div>
            <p style="font-size:13px;color:${C.gris};line-height:1.6;margin:0;">
              ${risk.desc}
            </p>
          </div>

          <!-- Actions -->
          <div style="font-size:10px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 16px;">Actions immédiates recommandées</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:4px;">1. ${risk.actions[0].titre}</div>
                <div style="font-size:12px;color:${C.gris};">${risk.actions[0].desc}</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:4px;">2. ${risk.actions[1].titre}</div>
                <div style="font-size:12px;color:${C.gris};">${risk.actions[1].desc}</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:12px;background:${C.grisbg};border:1px solid ${C.grisLine};">
                <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:4px;">3. ${risk.actions[2].titre}</div>
                <div style="font-size:12px;color:${C.gris};">${risk.actions[2].desc}</div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="margin-top:32px;padding:24px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
            <p style="font-size:14px;color:${C.ardoise};font-weight:600;margin:0 0 16px;">
              Besoin d'aide pour prioriser ces actions ?
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:${C.bleu};color:${C.blanc};font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
              Parler à un expert →
            </a>
          </div>

          ${emailFooter("SovNum · J+3 · Analyse Risque Prioritaire", "Vous recevrez dans 4 jours une analyse de vos obligations NIS2 et DORA.")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function emailJ7(data: DiagnosticData): EmailPayload {
  const secteurLabel: Record<string, string> = {
    finance:   "Finance / Banque / Assurance",
    sante:     "Santé",
    industrie: "Industrie",
    public:    "Secteur public",
    defense:   "Défense / Aérospatial",
    autre:     "Services / Autres",
  };

  const pct = Math.round((data.score_total / data.score_max) * 100);

  const niveauLabel: Record<string, string> = {
    expose: "Exposé", vulnerable: "Vulnérable",
    resiliant: "Résilient", souverain: "Souverain",
  };

  // Réglementations sectorielles supplémentaires
  const secteurRegulations: Record<string, string> = {
    sante: `
          <div style="background:${C.ambrePale};border-left:4px solid ${C.ambre};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.ambre};margin-bottom:12px;">Hébergement de Données de Santé (HDS)</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Certification HDS <strong>obligatoire</strong> pour tout hébergeur de données de santé</li>
              <li>Audit de conformité tous les <strong>3 ans</strong></li>
              <li>Traçabilité complète des accès aux données patients</li>
              <li>Plan de continuité spécifique pour les systèmes cliniques</li>
            </ul>
          </div>`,
    finance: `
          <div style="background:${C.ambrePale};border-left:4px solid ${C.ambre};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.ambre};margin-bottom:12px;">Règlement DORA (applicable au secteur financier)</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Tests de résilience opérationnelle annuels (TLPT)</li>
              <li>Registre des contrats avec les prestataires ICT tiers</li>
              <li>Plan de continuité d'activité documenté et testé</li>
              <li>Notification à l'ACPR sous <strong>4h</strong> pour incidents majeurs</li>
            </ul>
          </div>`,
    defense: `
          <div style="background:${C.ambrePale};border-left:4px solid ${C.ambre};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.ambre};margin-bottom:12px;">IGI 1300 & Loi de Programmation Militaire</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Habilitation et classification des systèmes d'information</li>
              <li>Utilisation exclusive de solutions <strong>qualifiées ANSSI</strong></li>
              <li>Obligations OIV : notification ANSSI sous <strong>4h</strong> en cas d'incident</li>
              <li>Audits de sécurité réguliers par des prestataires PASSI</li>
            </ul>
          </div>`,
    industrie: `
          <div style="background:${C.ambrePale};border-left:4px solid ${C.ambre};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.ambre};margin-bottom:12px;">Obligations OIV / OSE (Industrie)</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Séparation stricte des réseaux IT / OT (systèmes industriels)</li>
              <li>Homologation des systèmes d'information d'importance vitale</li>
              <li>Notification des incidents à l'ANSSI dans les délais prescrits</li>
              <li>Contrôle renforcé de la chaîne d'approvisionnement numérique</li>
            </ul>
          </div>`,
    public: `
          <div style="background:${C.ambrePale};border-left:4px solid ${C.ambre};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.ambre};margin-bottom:12px;">Obligations secteur public</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Doctrine <strong>Cloud au centre</strong> : privilégier les offres qualifiées SecNumCloud</li>
              <li>Désignation d'un référent cybersécurité obligatoire</li>
              <li>Recours aux marchés centralisés UGAP pour les solutions numériques</li>
              <li>Conformité RGPD renforcée pour les données citoyens</li>
            </ul>
          </div>`,
  };

  const CONTACT_URL = "https://sovnum.fr/contact";

  return {
    to: data.email,
    subject: `NIS2 & DORA : ce que cela change pour ${data.entreprise}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>NIS2 & DORA · SovNum</title></head>
<body style="margin:0;padding:0;background:${C.grisbg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.grisbg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border-radius:8px;overflow:hidden;">

        ${emailHeader("Réglementation · J+7")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:${C.ardoise};margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 8px;">
            Secteur identifié : <strong>${secteurLabel[data.secteur] ?? "Services"}</strong>.
          </p>
          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 24px;">
            Le cadre réglementaire européen s'est considérablement renforcé. Voici les obligations qui concernent directement <strong>${data.entreprise}</strong> et les échéances à respecter.
          </p>

          <!-- NIS2 -->
          <div style="background:${C.grisbg};border-left:4px solid ${C.bleu};padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:${C.bleu};margin-bottom:12px;">Directive NIS2 (en vigueur)</div>
            <ul style="font-size:13px;color:${C.ardoise};line-height:1.8;margin:0;padding-left:20px;">
              <li>Notification des incidents significatifs sous <strong>24h</strong> à l'ANSSI</li>
              <li>Rapport complet sous <strong>72h</strong></li>
              <li>Gestion des risques de la chaîne d'approvisionnement numérique</li>
              <li>Politique de sécurité documentée et mise à jour annuellement</li>
              <li>Sanctions : jusqu'à <strong>10M€ ou 2% du CA mondial</strong></li>
            </ul>
          </div>

          <!-- Réglementation sectorielle -->
          ${secteurRegulations[data.secteur] ?? ''}

          <!-- Niveau actuel -->
          <div style="background:${C.vertPale};border-left:4px solid ${C.vert};padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:${C.vert};margin-bottom:8px;">Votre position actuelle</div>
            <p style="font-size:13px;color:${C.ardoise};margin:0;line-height:1.6;">
              Avec un score de <strong>${data.score_total}/${data.score_max} (${pct}%)</strong> et un niveau <strong>${niveauLabel[data.niveau_maturite] ?? "Exposé"}</strong>, des écarts significatifs existent entre votre posture actuelle et les exigences réglementaires. Un plan d'action structuré permettra de combler ces écarts de manière progressive et réaliste.
            </p>
          </div>

          <!-- CTA -->
          <div style="margin-top:4px;padding:24px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
            <p style="font-size:14px;color:${C.ardoise};font-weight:600;margin:0 0 16px;">
              Vous souhaitez un accompagnement pour votre mise en conformité ?
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:${C.bleu};color:${C.blanc};font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
              Parler à un expert →
            </a>
          </div>

          ${emailFooter("SovNum · J+7 · Obligations réglementaires", "Vous recevrez dans 7 jours une invitation à construire votre feuille de route.")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function emailJ14(data: DiagnosticData): EmailPayload {
  const pct = Math.round((data.score_total / data.score_max) * 100);
  const pctJ = data.score_max_juridique   ? Math.round((data.score_juridique   / data.score_max_juridique)   * 100) : 0;
  const pctO = data.score_max_operationnel ? Math.round((data.score_operationnel / data.score_max_operationnel) * 100) : 0;
  const pctS = data.score_max_strategique  ? Math.round((data.score_strategique  / data.score_max_strategique)  * 100) : 0;

  const niveauLabel: Record<string, string> = {
    expose: "Exposé", vulnerable: "Vulnérable",
    resiliant: "Résilient", souverain: "Souverain",
  };

  const CONTACT_URL = "https://sovnum.fr/contact";

  return {
    to: data.email,
    subject: `${data.prenom}, construisons votre feuille de route souveraine`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Feuille de route · SovNum</title></head>
<body style="margin:0;padding:0;background:${C.grisbg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.grisbg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border-radius:8px;overflow:hidden;">

        ${emailHeader("Feuille de route · J+14")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:${C.ardoise};margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 24px;">
            Il y a deux semaines, votre diagnostic SovNum a révélé un score de <strong>${data.score_total}/${data.score_max} (${pct}%)</strong> pour <strong>${data.entreprise}</strong>, soit un niveau <strong>${niveauLabel[data.niveau_maturite] ?? "Exposé"}</strong>.
          </p>

          <!-- Rappel scores -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:10px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:11px;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;">Juridique</div>
                <div style="font-size:18px;font-weight:700;color:${C.ardoise};">${pctJ}%</div>
              </td>
              <td width="8"></td>
              <td style="padding:10px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:11px;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;">Opérationnel</div>
                <div style="font-size:18px;font-weight:700;color:${C.ardoise};">${pctO}%</div>
              </td>
              <td width="8"></td>
              <td style="padding:10px;background:${C.grisbg};border:1px solid ${C.grisLine};text-align:center;">
                <div style="font-size:11px;color:${C.gris};text-transform:uppercase;letter-spacing:0.1em;">Stratégique</div>
                <div style="font-size:18px;font-weight:700;color:${C.ardoise};">${pctS}%</div>
              </td>
            </tr>
          </table>

          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 28px;">
            La souveraineté numérique ne s'improvise pas. Elle se construit avec une feuille de route adaptée à votre secteur, votre taille et vos contraintes. C'est exactement ce que nous proposons de construire ensemble.
          </p>

          <!-- Accompagnement -->
          <div style="background:${C.grisbg};border:1px solid ${C.grisLine};padding:24px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:700;color:${C.gris};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px;">Ce que couvre notre accompagnement</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 12px;background:${C.blanc};border:1px solid ${C.grisLine};border-left:3px solid ${C.rouge};">
                  <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:2px;">Semaine 1-2 · Audit</div>
                  <div style="font-size:12px;color:${C.gris};">Cartographie complète de votre architecture numérique et de vos flux de données sensibles</div>
                </td>
              </tr>
              <tr><td height="8"></td></tr>
              <tr>
                <td style="padding:10px 12px;background:${C.blanc};border:1px solid ${C.grisLine};border-left:3px solid ${C.orange};">
                  <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:2px;">Mois 1-2 · Feuille de route</div>
                  <div style="font-size:12px;color:${C.gris};">Plan de migration vers des solutions souveraines qualifiées, priorisé par impact et faisabilité</div>
                </td>
              </tr>
              <tr><td height="8"></td></tr>
              <tr>
                <td style="padding:10px 12px;background:${C.blanc};border:1px solid ${C.grisLine};border-left:3px solid ${C.vert};">
                  <div style="font-size:12px;font-weight:700;color:${C.bleu};margin-bottom:2px;">Mois 3-6 · Mise en conformité</div>
                  <div style="font-size:12px;color:${C.gris};">Accompagnement NIS2/DORA, sélection de prestataires ANSSI, déploiement des solutions retenues</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA principal -->
          <div style="padding:28px;background:${C.ardoise};text-align:center;">
            <p style="font-size:16px;color:${C.blanc};font-weight:700;margin:0 0 8px;">
              30 minutes pour changer votre posture numérique
            </p>
            <p style="font-size:13px;color:${C.grisClair};margin:0 0 20px;">
              Échangeons sur vos résultats et définissons ensemble vos premières actions.
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:${C.bleu};color:${C.blanc};font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
              Parler à un expert →
            </a>
          </div>

          ${emailFooter("SovNum · Souveraineté Numérique", "Répondez à cet email ou écrivez à contact@sovnum.fr")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

/* ───────────── Template accompagnement ───────────── */

function emailAccompagnement(data: DiagnosticData, offreTag: string, offreTitre: string): EmailPayload {
  const niveauLabel: Record<string, string> = {
    expose: "Exposé", vulnerable: "Vulnérable",
    resiliant: "Résilient", souverain: "Souverain",
  };
  const pct = Math.round((data.score_total / data.score_max) * 100);
  const RDV_URL = "https://cal.meetergo.com/tmethesovcie/30-min-meeting-with-tristan";

  return {
    to: data.email,
    subject: `${data.prenom}, parlons de la souveraineté numérique de ${data.entreprise}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Accompagnement SovNum</title></head>
<body style="margin:0;padding:0;background:${C.grisbg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.grisbg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.blanc};border-radius:8px;overflow:hidden;">

        ${emailHeader(`Votre demande d'accompagnement`)}

        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:${C.ardoise};margin:0 0 16px;">Bonjour ${data.prenom},</h2>

          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 16px;">
            Je suis Tristan Méneret, fondateur de <strong>The Sov Company</strong>. Merci d'avoir réalisé le diagnostic SovNum pour <strong>${data.entreprise}</strong>.
          </p>

          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 24px;">
            Votre score de <strong>${data.score_total}/${data.score_max} (${pct}%)</strong> vous place au niveau <strong>${niveauLabel[data.niveau_maturite] ?? "Exposé"}</strong>. Vous avez exprimé votre intérêt pour l'offre suivante :
          </p>

          <!-- Offre sélectionnée -->
          <div style="background:${C.grisbg};border-left:4px solid ${C.bleu};padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:10px;font-weight:700;color:${C.bleu};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">${offreTag}</div>
            <div style="font-size:16px;font-weight:700;color:${C.ardoise};">${offreTitre}</div>
          </div>

          <p style="font-size:14px;color:${C.gris};line-height:1.7;margin:0 0 16px;">
            Je vous propose d'échanger directement sur vos résultats et de définir ensemble les prochaines étapes adaptées à votre contexte. Cet échange de 30 minutes est sans engagement.
          </p>

          <!-- CTA -->
          <div style="margin-top:8px;padding:24px;background:${C.ardoise};text-align:center;">
            <p style="font-size:15px;color:${C.blanc};font-weight:700;margin:0 0 16px;">
              Réservez votre créneau directement dans mon agenda
            </p>
            <a href="${RDV_URL}"
               style="display:inline-block;background:${C.bleu};color:${C.blanc};font-size:14px;font-weight:700;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.02em;">
              Prendre rendez-vous →
            </a>
          </div>

          <!-- Signature -->
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid ${C.grisLine};">
            <p style="font-size:14px;color:${C.ardoise};margin:0 0 4px;font-weight:700;">Tristan Méneret</p>
            <p style="font-size:13px;color:${C.gris};margin:0 0 2px;">Fondateur & CEO · The Sov Company</p>
            <p style="font-size:13px;color:${C.gris};margin:0 0 2px;">
              <a href="mailto:tme@thesovcompany.com" style="color:${C.bleu};text-decoration:none;">tme@thesovcompany.com</a> · +33 7 61 49 65 53
            </p>
          </div>

          ${emailFooter("SovNum · Souveraineté Numérique", "Cet email fait suite à votre demande d'accompagnement.")}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

/* ───────────── Types ───────────── */

interface DiagnosticData {
  id: string;
  prenom: string;
  nom: string;
  poste: string;
  email: string;
  entreprise: string;
  siren: string;
  secteur: string;
  score_total: number;
  score_max: number;
  score_juridique: number;
  score_max_juridique: number;
  score_operationnel: number;
  score_max_operationnel: number;
  score_strategique: number;
  score_max_strategique: number;
  niveau_maturite: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/* ───────────── Envoi via Resend ───────────── */

async function sendEmail(payload: EmailPayload): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

/* ───────────── Handler principal ───────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { diagnostic_id, email_type, offre_tag, offre_titre } = await req.json() as {
      diagnostic_id: string;
      email_type: "j0" | "j3" | "j7" | "j14" | "accompagnement";
      offre_tag?: string;
      offre_titre?: string;
    };

    if (!diagnostic_id || !email_type) {
      return new Response(JSON.stringify({ error: "diagnostic_id and email_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Récupérer les données du diagnostic
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("id", diagnostic_id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Diagnostic not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Générer et envoyer l'email
    if (email_type === "accompagnement") {
      if (!offre_tag || !offre_titre) {
        return new Response(JSON.stringify({ error: "offre_tag and offre_titre required for accompagnement" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await sendEmail(emailAccompagnement(data as DiagnosticData, offre_tag, offre_titre));
      console.log(`Accompagnement email sent to ${data.email} for diagnostic ${diagnostic_id}`);

      // Notification admin
      const d = data as DiagnosticData;
      sendEmail({
        to: NOTIFY_EMAIL,
        subject: `Demande d'accompagnement · ${d.prenom} ${d.nom} · ${d.entreprise}`,
        html: `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Demande d'accompagnement SovNum</div>
  <h2 style="font-size:20px;color:#1C2B4A;margin:0 0 4px;">${d.prenom} ${d.nom}</h2>
  <div style="font-size:14px;color:#6B7280;margin-bottom:16px;">${d.poste || "—"} · <strong>${d.entreprise}</strong></div>
  <div style="font-size:13px;color:#1C2B4A;margin-bottom:8px;"><strong>Email :</strong> <a href="mailto:${d.email}" style="color:#002395;">${d.email}</a></div>
  <div style="font-size:13px;color:#1C2B4A;margin-bottom:8px;"><strong>Score :</strong> ${d.score_total}/${d.score_max} (${Math.round((d.score_total / d.score_max) * 100)}%)</div>
  <div style="font-size:13px;color:#1C2B4A;margin-bottom:16px;"><strong>Offre :</strong> ${offre_tag} — ${offre_titre}</div>
  <div style="font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:12px;">Action requise : contacter le prospect.</div>
</div>`,
      }).catch(e => console.error("Admin accompagnement notification error:", e));

      return new Response(JSON.stringify({ success: true, email_type }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templates: Record<string, (d: DiagnosticData) => EmailPayload> = {
      j0: emailJ0, j3: emailJ3, j7: emailJ7, j14: emailJ14,
    };
    const template = templates[email_type];
    if (!template) {
      return new Response(JSON.stringify({ error: "Unknown email_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendEmail(template(data as DiagnosticData));

    // Notification admin sur nouveau diagnostic (J+0 uniquement)
    if (email_type === "j0") {
      const d = data as DiagnosticData;
      const pct = Math.round((d.score_total / d.score_max) * 100);
      const niv: Record<string, string> = { expose: "Exposé", vulnerable: "Vulnérable", resiliant: "Résilient", souverain: "Souverain" };
      const secteurs: Record<string, string> = { finance: "Finance", sante: "Santé", industrie: "Industrie", public: "Secteur public", defense: "Défense", autre: "Autre" };
      sendEmail({
        to: NOTIFY_EMAIL,
        subject: `Nouveau diagnostic · ${d.prenom} ${d.nom} · ${d.entreprise}`,
        html: `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;">Nouveau diagnostic SovNum</div>
  <h2 style="font-size:20px;color:#1C2B4A;margin:0 0 4px;">${d.prenom} ${d.nom}</h2>
  <div style="font-size:14px;color:#6B7280;margin-bottom:16px;">${d.poste || "—"} · <strong>${d.entreprise}</strong>${d.siren ? ` (SIREN ${d.siren})` : ""}</div>
  <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#6B7280;">Email</td>
      <td style="padding:8px 0;font-size:13px;color:#1C2B4A;font-weight:600;"><a href="mailto:${d.email}" style="color:#002395;">${d.email}</a></td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#6B7280;">Secteur</td>
      <td style="padding:8px 0;font-size:13px;color:#1C2B4A;font-weight:600;">${secteurs[d.secteur] ?? d.secteur ?? "—"}</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#6B7280;">Score</td>
      <td style="padding:8px 0;font-size:13px;color:#1C2B4A;font-weight:600;">${d.score_total}/${d.score_max} (${pct}%)</td>
    </tr>
    <tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#6B7280;">Niveau</td>
      <td style="padding:8px 0;font-size:13px;font-weight:700;color:${d.niveau_maturite === "souverain" ? "#15803D" : d.niveau_maturite === "resiliant" ? "#B45309" : d.niveau_maturite === "vulnerable" ? "#C2410C" : "#B91C1C"};">${niv[d.niveau_maturite] ?? "Exposé"}</td>
    </tr>
  </table>
  <div style="font-size:12px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:12px;">
    Juridique ${d.score_juridique}/${d.score_max_juridique} · Opérationnel ${d.score_operationnel}/${d.score_max_operationnel} · Stratégique ${d.score_strategique}/${d.score_max_strategique}
  </div>
</div>`,
      }).catch(e => console.error("Admin notification error:", e));
    }

    // Marquer l'email comme envoyé
    const sentField = `email_${email_type}_sent_at`;
    await supabase.from("diagnostics").update({ [sentField]: new Date().toISOString() }).eq("id", diagnostic_id);

    return new Response(JSON.stringify({ success: true, email_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
