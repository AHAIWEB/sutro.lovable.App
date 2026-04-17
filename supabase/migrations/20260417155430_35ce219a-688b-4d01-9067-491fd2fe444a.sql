-- Move Bangladesh to top
UPDATE public.countries SET sort_order = 1 WHERE id = 'bd';
-- Push other 0-sorted countries down
UPDATE public.countries SET sort_order = 999 WHERE sort_order = 0 AND id != 'bd';