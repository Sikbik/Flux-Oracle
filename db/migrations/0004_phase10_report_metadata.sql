ALTER TABLE hour_reports ADD COLUMN available_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hour_reports ADD COLUMN degraded INTEGER NOT NULL DEFAULT 0;
ALTER TABLE hour_reports ADD COLUMN reporter_set_id TEXT;

ALTER TABLE anchors ADD COLUMN reporter_set_id TEXT;
