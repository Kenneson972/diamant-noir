-- P0 audit préprod 2026-07-11 (Critique 1) : filet anti-double-booking au niveau base.
-- Le check applicatif de app/api/booking/route.ts est un check-then-act non atomique :
-- deux requêtes concurrentes sur les mêmes dates peuvent toutes deux passer le SELECT
-- de conflit puis INSERT. Cette contrainte d'exclusion est le seul verrou fiable en
-- environnement serverless multi-instance.
--
-- Sémantique daterange par défaut '[)' (fin exclusive) : alignée sur le check applicatif
-- (.lt("start_date", endDate).gt("end_date", startDate)) — un départ le jour d'une
-- arrivée ne compte pas comme chevauchement.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    villa_id WITH =,
    daterange(start_date, end_date) WITH &&
  )
  WHERE (status IN ('pending', 'confirmed', 'paid'));
