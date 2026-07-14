
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  plan text NOT NULL DEFAULT 'free',
  activated_at timestamptz,
  expires_at timestamptz,
  generations_used integer NOT NULL DEFAULT 0,
  generations_remaining integer NOT NULL DEFAULT 3,
  payment_status text NOT NULL DEFAULT 'none',
  transaction_id text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs own read" ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs admin update" ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs self insert" ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create free sub + user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_subscriptions(user_id, email, plan, generations_remaining)
  VALUES (NEW.id, NEW.email, 'free', 3) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id,'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Consume generation
CREATE OR REPLACE FUNCTION public.consume_generation() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.user_subscriptions;
BEGIN
  SELECT * INTO s FROM public.user_subscriptions WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.user_subscriptions(user_id,email,plan,generations_remaining)
    VALUES (auth.uid(),(SELECT email FROM auth.users WHERE id = auth.uid()),'free',3)
    RETURNING * INTO s;
  END IF;
  IF s.expires_at IS NOT NULL AND s.expires_at < now() THEN
    UPDATE public.user_subscriptions SET plan='free',generations_remaining=3,payment_status='expired'
      WHERE id = s.id RETURNING * INTO s;
  END IF;
  IF s.generations_remaining <= 0 THEN
    RETURN jsonb_build_object('ok',false,'reason','no_generations','plan',s.plan);
  END IF;
  UPDATE public.user_subscriptions
    SET generations_remaining = generations_remaining - 1,
        generations_used = generations_used + 1
    WHERE id = s.id RETURNING * INTO s;
  RETURN jsonb_build_object('ok',true,'remaining',s.generations_remaining,'plan',s.plan);
END $$;

-- Admin activate plan
CREATE OR REPLACE FUNCTION public.admin_activate_plan(
  _user_id uuid, _plan text, _generations integer, _days integer, _tx text
) RETURNS public.user_subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.user_subscriptions;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  UPDATE public.user_subscriptions SET
    plan = _plan,
    activated_at = now(),
    expires_at = now() + (_days || ' days')::interval,
    generations_remaining = _generations,
    generations_used = 0,
    payment_status = 'active',
    transaction_id = _tx,
    history = history || jsonb_build_array(jsonb_build_object(
      'plan',_plan,'activated_at',now(),'days',_days,'gens',_generations,'tx',_tx))
  WHERE user_id = _user_id RETURNING * INTO s;
  IF NOT FOUND THEN
    INSERT INTO public.user_subscriptions(user_id,email,plan,activated_at,expires_at,
      generations_remaining,payment_status,transaction_id,history)
    VALUES (_user_id,(SELECT email FROM auth.users WHERE id=_user_id),_plan,now(),
      now() + (_days||' days')::interval,_generations,'active',_tx,
      jsonb_build_array(jsonb_build_object('plan',_plan,'activated_at',now(),'days',_days,'gens',_generations,'tx',_tx)))
    RETURNING * INTO s;
  END IF;
  RETURN s;
END $$;
