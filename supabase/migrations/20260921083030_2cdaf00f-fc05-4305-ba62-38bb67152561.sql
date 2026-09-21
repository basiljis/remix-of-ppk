DROP VIEW IF EXISTS public.public_blog_comments;

CREATE OR REPLACE FUNCTION public.get_approved_blog_comments(p_post_id uuid)
RETURNS TABLE (
  id uuid,
  post_id uuid,
  parent_id uuid,
  author_name text,
  content text,
  is_author_reply boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.post_id,
    c.parent_id,
    c.author_name,
    c.content,
    c.is_author_reply,
    c.created_at
  FROM public.blog_comments AS c
  WHERE c.post_id = p_post_id
    AND c.status = 'approved'::public.blog_comment_status
  ORDER BY c.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_approved_blog_comments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_approved_blog_comments(uuid) TO anon, authenticated, service_role;