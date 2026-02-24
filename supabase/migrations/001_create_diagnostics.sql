-- Table diagnostics — résultats du diagnostic SovNum
create table if not exists diagnostics (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),

  -- Profil utilisateur
  prenom        text not null,
  nom           text not null,
  poste         text,
  email         text not null,
  entreprise    text not null,
  siren         text,
  secteur       text,

  -- Scores
  score_total   int,
  score_max     int,
  score_juridique       int,
  score_max_juridique   int,
  score_operationnel    int,
  score_max_operationnel int,
  score_strategique     int,
  score_max_strategique int,
  niveau_maturite text,   -- expose | vulnerable | resiliant | souverain

  -- Réponses brutes (jsonb pour flexibilité)
  answers       jsonb,

  -- Suivi emails
  email_j0_sent_at  timestamptz,
  email_j3_sent_at  timestamptz,
  email_j7_sent_at  timestamptz,
  email_j14_sent_at timestamptz
);

-- Index sur email pour retrouver facilement les contacts
create index if not exists diagnostics_email_idx on diagnostics(email);
create index if not exists diagnostics_created_at_idx on diagnostics(created_at desc);
