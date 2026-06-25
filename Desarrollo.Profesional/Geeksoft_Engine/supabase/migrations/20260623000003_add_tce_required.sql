ALTER TABLE vessels ADD COLUMN IF NOT EXISTS tce_required NUMERIC DEFAULT 0;

UPDATE vessels SET tce_required = 15000 WHERE vessel_id = 'TABLONES';
UPDATE vessels SET tce_required = 13000 WHERE vessel_id = 'MOQUEGUA';
UPDATE vessels SET tce_required = 20000 WHERE vessel_id = 'CONCON_TRADER';
