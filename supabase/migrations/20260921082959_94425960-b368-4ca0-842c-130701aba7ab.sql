-- Serve approved public comments from a deliberately narrow, read-only surface.
DROP POLICY IF EXISTS "Public can read approved comment content" ON public.blog_comments;
REVOKE SELECT ON TABLE public.blog_comments FROM anon;

CREATE OR REPLACE VIEW public.public_blog_comments
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  id,
  post_id,
  parent_id,
  author_name,
  content,
  is_author_reply,
  created_at
FROM public.blog_comments
WHERE status = 'approved'::public.blog_comment_status;

REVOKE ALL ON TABLE public.public_blog_comments FROM PUBLIC;
GRANT SELECT ON TABLE public.public_blog_comments TO anon, authenticated;
GRANT ALL ON TABLE public.public_blog_comments TO service_role;

-- Anonymous subscription rows are write-only from the public form.
DROP POLICY IF EXISTS "Enable select for owners" ON public.legal_subscriptions;
CREATE POLICY "Signed in users can view own legal subscriptions"
ON public.legal_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for owners" ON public.legal_subscriptions;
CREATE POLICY "Signed in users can update own legal subscriptions"
ON public.legal_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);