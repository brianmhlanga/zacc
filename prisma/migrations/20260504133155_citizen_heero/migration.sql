-- No-op (replaces invalid migration).
-- The previous script ran ALTER on `citizen_hero_panels` before that table existed, breaking shadow DB (P3018).
-- Tables are created in migration `20260505140000_citizen_hero`.

SELECT 1;
