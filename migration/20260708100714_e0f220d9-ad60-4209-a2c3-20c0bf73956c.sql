
-- Lock down SECURITY DEFINER functions: revoke default PUBLIC execute, then grant narrowly.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_generation() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_activate_plan(uuid, text, integer, integer, text) FROM PUBLIC, anon;

-- Keep role checks callable inside RLS for signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_generation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activate_plan(uuid, text, integer, integer, text) TO authenticated;

-- Add admin-only DELETE policy on user_subscriptions
CREATE POLICY "subs admin delete" ON public.user_subscriptions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
