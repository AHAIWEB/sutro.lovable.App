
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS on user_roles: only admins can view
CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Allow admins to UPDATE links (approve/reject/edit)
CREATE POLICY "Admins can update links"
ON public.links FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Allow admins to DELETE links
CREATE POLICY "Admins can delete links"
ON public.links FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Allow admins to SELECT all links (including pending)
CREATE POLICY "Admins can view all links"
ON public.links FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Allow admins to INSERT categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Allow admins to UPDATE categories
CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. Allow admins to DELETE categories
CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Allow admins to INSERT links directly (approved)
CREATE POLICY "Admins can insert links"
ON public.links FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
