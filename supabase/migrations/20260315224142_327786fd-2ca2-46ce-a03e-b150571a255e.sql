
-- Drop overly permissive insert policy and replace with one that forces pending status
DROP POLICY "Anyone can submit a link" ON public.links;

CREATE POLICY "Anyone can submit a pending link"
  ON public.links FOR INSERT
  WITH CHECK (status = 'pending');
