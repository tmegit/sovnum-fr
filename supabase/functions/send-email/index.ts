import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL     = "SovNum <rapport@sovnum.fr>";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ───────────── Composants email réutilisables ───────────── */

function emailHeader(subtitle: string): string {
  return `
        <!-- Liseret tricolore -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#002395 33%,#fff 33% 66%,#ED2939 66%);"></td></tr>

        <!-- En-tête avec cocarde -->
        <tr><td style="background:#002395;padding:28px 40px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;padding-right:14px;">
              <table cellpadding="0" cellspacing="0" border="0" width="36" height="36">
                <tr><td width="36" height="36" style="border-radius:50%;background:#ED2939;text-align:center;vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0" border="0" width="28" height="28" align="center">
                    <tr><td width="28" height="28" style="border-radius:50%;background:#FFFFFF;text-align:center;vertical-align:middle;">
                      <table cellpadding="0" cellspacing="0" border="0" width="16" height="16" align="center">
                        <tr><td width="16" height="16" style="border-radius:50%;background:#002395;"></td></tr>
                      </table>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </td>
            <td style="vertical-align:middle;">
              <div style="color:#fff;font-size:20px;font-weight:700;letter-spacing:0.04em;line-height:1;">SovNum</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;margin-top:4px;line-height:1;">Diagnostic de Souveraineté Numérique</div>
              <div style="color:rgba(255,255,255,0.35);font-size:9px;letter-spacing:0.06em;margin-top:4px;line-height:1;"><span style="font-weight:400;">The Sov</span> <span style="font-weight:700;">Company</span></div>
            </td>
          </tr></table>
          <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:20px;">${subtitle}</div>
        </td></tr>`;
}

function emailFooter(line1: string, line2: string): string {
  return `
          <p style="font-size:12px;color:#9CA3AF;margin:32px 0 0;text-align:center;">
            ${line1}<br>
            ${line2}
          </p>
          <p style="font-size:10px;color:#C9CDD3;margin:12px 0 0;text-align:center;">
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

  const CONTACT_URL = "https://sovnum.fr/contact";

  return {
    to: data.email,
    subject: `Votre rapport SovNum · Niveau ${niveauLabel}`,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport SovNum</title></head>
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        ${emailHeader(`Bonjour ${data.prenom},<div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:8px;line-height:1.6;">Voici votre rapport de souveraineté numérique pour <strong>${data.entreprise}</strong>.<br>Ce diagnostic évalue votre exposition aux risques juridiques, opérationnels et stratégiques liés à vos dépendances numériques.</div>`)}

        <!-- Score global -->
        <tr><td style="background:#fff;padding:32px 40px;border-bottom:1px solid #E5E7EB;">
          <div style="font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Score global</div>
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="font-size:48px;font-weight:700;color:#002395;line-height:1;">${data.score_total}</td>
            <td style="font-size:18px;color:#9CA3AF;padding-left:6px;vertical-align:baseline;">/ ${data.score_max}</td>
            <td style="font-size:20px;font-weight:600;color:#002395;padding-left:12px;vertical-align:baseline;">${pct}%</td>
          </tr></table>
          <div style="margin-top:16px;background:#EEF1FA;border-radius:4px;height:10px;">
            <div style="width:${pct}%;background:#002395;height:10px;border-radius:4px;"></div>
          </div>
          <div style="margin-top:16px;display:inline-block;padding:6px 16px;border-radius:20px;font-size:14px;font-weight:700;
            background:${data.niveau_maturite === 'souverain' ? '#F0FDF4' : data.niveau_maturite === 'resiliant' ? '#FFFBEB' : data.niveau_maturite === 'vulnerable' ? '#FFF7ED' : '#FEF2F2'};
            color:${data.niveau_maturite === 'souverain' ? '#15803D' : data.niveau_maturite === 'resiliant' ? '#B45309' : data.niveau_maturite === 'vulnerable' ? '#C2410C' : '#B91C1C'};">
            Niveau : ${niveauLabel}
          </div>
          <p style="font-size:13px;color:#6B7280;line-height:1.7;margin:16px 0 0;">
            ${interpText}
          </p>
        </td></tr>

        <!-- 3 dimensions -->
        <tr><td style="background:#fff;padding:24px 40px 32px;border-bottom:1px solid #E5E7EB;">
          <div style="font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:20px;">Détail par dimension</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:8px;text-align:center;">
                <div style="font-size:20px;">⚖️</div>
                <div style="font-size:13px;font-weight:700;color:#1C2B4A;margin-top:4px;">Juridique</div>
                <div style="font-size:22px;font-weight:700;color:#002395;margin-top:4px;">${pctJ}%</div>
                <div style="font-size:11px;color:#6B7280;">${data.score_juridique}/${data.score_max_juridique}</div>
              </td>
              <td width="12"></td>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:8px;text-align:center;">
                <div style="font-size:20px;">⚙️</div>
                <div style="font-size:13px;font-weight:700;color:#1C2B4A;margin-top:4px;">Opérationnel</div>
                <div style="font-size:22px;font-weight:700;color:#002395;margin-top:4px;">${pctO}%</div>
                <div style="font-size:11px;color:#6B7280;">${data.score_operationnel}/${data.score_max_operationnel}</div>
              </td>
              <td width="12"></td>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:8px;text-align:center;">
                <div style="font-size:20px;">🎯</div>
                <div style="font-size:13px;font-weight:700;color:#1C2B4A;margin-top:4px;">Stratégique</div>
                <div style="font-size:22px;font-weight:700;color:#002395;margin-top:4px;">${pctS}%</div>
                <div style="font-size:11px;color:#6B7280;">${data.score_strategique}/${data.score_max_strategique}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Point d'attention -->
        <tr><td style="background:#fff;padding:24px 40px 32px;border-bottom:1px solid #E5E7EB;">
          <div style="background:#FEF2F2;border-left:4px solid #ED2939;border-radius:4px;padding:16px 20px;">
            <div style="font-size:12px;font-weight:700;color:#B91C1C;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Axe prioritaire</div>
            <div style="font-size:14px;font-weight:700;color:#1C2B4A;">Dimension ${weakest.nom} · ${weakest.pct}%</div>
            <div style="font-size:13px;color:#6B7280;margin-top:6px;line-height:1.6;">
              C'est votre dimension la plus exposée. Nous vous enverrons dans 3 jours une analyse détaillée de ce risque avec des recommandations d'actions immédiates.
            </div>
          </div>
        </td></tr>

        <!-- Prochaines étapes -->
        <tr><td style="background:#fff;padding:24px 40px 32px;border-bottom:1px solid #E5E7EB;">
          <div style="font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Ce qui vous attend</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;">J+3 · Analyse de risque</div>
                <div style="font-size:12px;color:#6B7280;margin-top:2px;">Votre risque prioritaire décrypté avec des actions concrètes</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:10px 12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;">J+7 · Obligations réglementaires</div>
                <div style="font-size:12px;color:#6B7280;margin-top:2px;">Checklist NIS2 & DORA adaptée à votre secteur</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:10px 12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;">J+14 · Feuille de route</div>
                <div style="font-size:12px;color:#6B7280;margin-top:2px;">Proposition d'accompagnement personnalisé</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#fff;padding:32px 40px;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;color:#1C2B4A;line-height:1.7;margin:0 0 24px;font-weight:600;">
            Vous souhaitez aller plus vite ? Échangeons dès maintenant sur vos résultats.
          </p>
          <div style="text-align:center;">
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:#002395;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.03em;">
              Prendre rendez-vous
            </a>
          </div>
          ${emailFooter("SovNum · Diagnostic de Souveraineté Numérique", "Cet email a été généré automatiquement suite à votre diagnostic.")}
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
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;">

        ${emailHeader("Analyse de risque · J+3")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:#1C2B4A;margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 8px;">
            Suite à votre diagnostic SovNum pour <strong>${data.entreprise}</strong>, votre dimension la plus exposée est <strong>${weakest.nom}</strong> avec un score de <strong>${weakest.pct}%</strong>.
          </p>
          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
            Voici une analyse approfondie de ce risque et des actions concrètes à engager.
          </p>

          <!-- Risque prioritaire -->
          <div style="background:#FEF2F2;border-left:4px solid #ED2939;border-radius:4px;padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:12px;font-weight:700;color:#B91C1C;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Risque prioritaire · ${weakest.nom} ${weakest.pct}%</div>
            <div style="font-size:16px;font-weight:700;color:#1C2B4A;margin-bottom:8px;">${risk.titre}</div>
            <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0;">
              ${risk.desc}
            </p>
          </div>

          <!-- Actions -->
          <h3 style="font-size:15px;color:#1C2B4A;margin:0 0 16px;">Actions immédiates recommandées</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:4px;">1. ${risk.actions[0].titre}</div>
                <div style="font-size:12px;color:#6B7280;">${risk.actions[0].desc}</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:4px;">2. ${risk.actions[1].titre}</div>
                <div style="font-size:12px;color:#6B7280;">${risk.actions[1].desc}</div>
              </td>
            </tr>
            <tr><td height="8"></td></tr>
            <tr>
              <td style="padding:12px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;">
                <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:4px;">3. ${risk.actions[2].titre}</div>
                <div style="font-size:12px;color:#6B7280;">${risk.actions[2].desc}</div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="margin-top:32px;padding:24px;background:#EEF1FA;border-radius:8px;text-align:center;">
            <p style="font-size:14px;color:#1C2B4A;font-weight:600;margin:0 0 16px;">
              Besoin d'aide pour prioriser ces actions ?
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:#002395;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.03em;">
              Prendre rendez-vous
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
          <div style="background:#FFFBEB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">Hébergement de Données de Santé (HDS)</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
              <li>Certification HDS <strong>obligatoire</strong> pour tout hébergeur de données de santé</li>
              <li>Audit de conformité tous les <strong>3 ans</strong></li>
              <li>Traçabilité complète des accès aux données patients</li>
              <li>Plan de continuité spécifique pour les systèmes cliniques</li>
            </ul>
          </div>`,
    finance: `
          <div style="background:#FFFBEB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">Règlement DORA (applicable au secteur financier)</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
              <li>Tests de résilience opérationnelle annuels (TLPT)</li>
              <li>Registre des contrats avec les prestataires ICT tiers</li>
              <li>Plan de continuité d'activité documenté et testé</li>
              <li>Notification à l'ACPR sous <strong>4h</strong> pour incidents majeurs</li>
            </ul>
          </div>`,
    defense: `
          <div style="background:#FFFBEB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">IGI 1300 & Loi de Programmation Militaire</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
              <li>Habilitation et classification des systèmes d'information</li>
              <li>Utilisation exclusive de solutions <strong>qualifiées ANSSI</strong></li>
              <li>Obligations OIV : notification ANSSI sous <strong>4h</strong> en cas d'incident</li>
              <li>Audits de sécurité réguliers par des prestataires PASSI</li>
            </ul>
          </div>`,
    industrie: `
          <div style="background:#FFFBEB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">Obligations OIV / OSE (Industrie)</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
              <li>Séparation stricte des réseaux IT / OT (systèmes industriels)</li>
              <li>Homologation des systèmes d'information d'importance vitale</li>
              <li>Notification des incidents à l'ANSSI dans les délais prescrits</li>
              <li>Contrôle renforcé de la chaîne d'approvisionnement numérique</li>
            </ul>
          </div>`,
    public: `
          <div style="background:#FFFBEB;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">Obligations secteur public</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
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
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;">

        ${emailHeader("Réglementation · J+7")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:#1C2B4A;margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 8px;">
            Secteur identifié : <strong>${secteurLabel[data.secteur] ?? "Services"}</strong>.
          </p>
          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
            Le cadre réglementaire européen s'est considérablement renforcé. Voici les obligations qui concernent directement <strong>${data.entreprise}</strong> et les échéances à respecter.
          </p>

          <!-- NIS2 -->
          <div style="background:#EEF1FA;border-radius:8px;padding:20px 24px;margin-bottom:20px;">
            <div style="font-size:13px;font-weight:700;color:#002395;margin-bottom:12px;">Directive NIS2 (en vigueur)</div>
            <ul style="font-size:13px;color:#1C2B4A;line-height:1.8;margin:0;padding-left:20px;">
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
          <div style="background:#F0FDF4;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:8px;">Votre position actuelle</div>
            <p style="font-size:13px;color:#1C2B4A;margin:0;line-height:1.6;">
              Avec un score de <strong>${data.score_total}/${data.score_max} (${pct}%)</strong> et un niveau <strong>${niveauLabel[data.niveau_maturite] ?? "Exposé"}</strong>, des écarts significatifs existent entre votre posture actuelle et les exigences réglementaires. Un plan d'action structuré permettra de combler ces écarts de manière progressive et réaliste.
            </p>
          </div>

          <!-- CTA -->
          <div style="margin-top:4px;padding:24px;background:#EEF1FA;border-radius:8px;text-align:center;">
            <p style="font-size:14px;color:#1C2B4A;font-weight:600;margin:0 0 16px;">
              Vous souhaitez un accompagnement pour votre mise en conformité ?
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:#002395;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.03em;">
              Prendre rendez-vous
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
<body style="margin:0;padding:0;background:#F8F9FC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:8px;overflow:hidden;">

        ${emailHeader("Feuille de route · J+14")}

        <!-- Contenu -->
        <tr><td style="padding:32px 40px;">
          <h2 style="font-size:20px;color:#1C2B4A;margin:0 0 16px;">Bonjour ${data.prenom},</h2>
          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
            Il y a deux semaines, votre diagnostic SovNum a révélé un score de <strong>${data.score_total}/${data.score_max} (${pct}%)</strong> pour <strong>${data.entreprise}</strong>, soit un niveau <strong>${niveauLabel[data.niveau_maturite] ?? "Exposé"}</strong>.
          </p>

          <!-- Rappel scores -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:10px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;text-align:center;">
                <div style="font-size:11px;color:#6B7280;">Juridique</div>
                <div style="font-size:18px;font-weight:700;color:#002395;">${pctJ}%</div>
              </td>
              <td width="8"></td>
              <td style="padding:10px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;text-align:center;">
                <div style="font-size:11px;color:#6B7280;">Opérationnel</div>
                <div style="font-size:18px;font-weight:700;color:#002395;">${pctO}%</div>
              </td>
              <td width="8"></td>
              <td style="padding:10px;background:#F8F9FC;border:1px solid #E5E7EB;border-radius:6px;text-align:center;">
                <div style="font-size:11px;color:#6B7280;">Stratégique</div>
                <div style="font-size:18px;font-weight:700;color:#002395;">${pctS}%</div>
              </td>
            </tr>
          </table>

          <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 28px;">
            La souveraineté numérique ne s'improvise pas. Elle se construit avec une feuille de route adaptée à votre secteur, votre taille et vos contraintes. C'est exactement ce que nous proposons de construire ensemble.
          </p>

          <!-- Accompagnement -->
          <div style="background:#EEF1FA;border-radius:8px;padding:24px;margin-bottom:28px;">
            <div style="font-size:14px;font-weight:700;color:#002395;margin-bottom:16px;">Ce que couvre notre accompagnement</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 12px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;">
                  <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:2px;">Semaine 1-2 · Audit</div>
                  <div style="font-size:12px;color:#6B7280;">Cartographie complète de votre architecture numérique et de vos flux de données sensibles</div>
                </td>
              </tr>
              <tr><td height="8"></td></tr>
              <tr>
                <td style="padding:10px 12px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;">
                  <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:2px;">Mois 1-2 · Feuille de route</div>
                  <div style="font-size:12px;color:#6B7280;">Plan de migration vers des solutions souveraines qualifiées, priorisé par impact et faisabilité</div>
                </td>
              </tr>
              <tr><td height="8"></td></tr>
              <tr>
                <td style="padding:10px 12px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;">
                  <div style="font-size:12px;font-weight:700;color:#002395;margin-bottom:2px;">Mois 3-6 · Mise en conformité</div>
                  <div style="font-size:12px;color:#6B7280;">Accompagnement NIS2/DORA, sélection de prestataires ANSSI, déploiement des solutions retenues</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA principal -->
          <div style="padding:28px;background:#002395;border-radius:8px;text-align:center;">
            <p style="font-size:16px;color:#fff;font-weight:700;margin:0 0 8px;">
              30 minutes pour changer votre posture numérique
            </p>
            <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 20px;">
              Échangeons sur vos résultats et définissons ensemble vos premières actions.
            </p>
            <a href="${CONTACT_URL}"
               style="display:inline-block;background:#fff;color:#002395;font-size:14px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.03em;">
              Réserver un créneau
            </a>
          </div>

          ${emailFooter("SovNum · Diagnostic de Souveraineté Numérique", "Répondez à cet email ou écrivez à contact@sovnum.fr")}
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
    const { diagnostic_id, email_type } = await req.json() as {
      diagnostic_id: string;
      email_type: "j0" | "j3" | "j7" | "j14";
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
