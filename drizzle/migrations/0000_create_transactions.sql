CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  amount bigint NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL CHECK (length(category) BETWEEN 1 AND 40),
  date date NOT NULL,
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transactions_user_date_idx ON public.transactions (user_id, date DESC, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add their own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());