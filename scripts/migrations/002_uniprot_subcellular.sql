-- Migration 002: cys_classification.uniprot_subcellular table
-- Source: DB_CONTRACT.md §4.2.
-- Backs Fig 3D (subcellular gradient panel). The table is created empty;
-- population is a separate ETL from data/uniprot_subcellular_location.tsv.
--
-- Compartment vocabulary must match the labels in src/lib/paperData.ts FIG_3D:
--   Extracellular | Plasma membrane | Endoplasmic ret. | Golgi |
--   Lysosome      | Cytoplasm       | Nucleus          | Mitochondrion
--
-- A UniProt accession may map to multiple compartments; the composite PK
-- enforces (acc, compartment) uniqueness rather than a single primary
-- localization.

\set ON_ERROR_STOP on

BEGIN;

CREATE TABLE IF NOT EXISTS cys_classification.uniprot_subcellular (
  uniprot_acc text NOT NULL,
  compartment text NOT NULL,
  PRIMARY KEY (uniprot_acc, compartment)
);

CREATE INDEX IF NOT EXISTS uniprot_subcellular_compartment_idx
  ON cys_classification.uniprot_subcellular (compartment);

COMMENT ON TABLE cys_classification.uniprot_subcellular IS
  'UniProt accession → subcellular compartment mapping for Fig 3D '
  '(DB_CONTRACT.md §4.2). Compartment vocabulary aligned with '
  'src/lib/paperData.ts FIG_3D labels.';

COMMIT;
