-- 1) blog_comments: hide personal data from anonymous visitors via column-level grants
REVOKE SELECT ON public.blog_comments FROM anon;
GRANT SELECT (id, post_id, parent_id, author_name, content, is_author_reply, status, created_at, updated_at)
  ON public.blog_comments TO anon;

-- 2) system_settings: drop blanket public read policy, allow only the signup-time key
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;

CREATE POLICY "Public can read signup settings"
ON public.system_settings FOR SELECT
USING (key = 'auto_approve_org_users');