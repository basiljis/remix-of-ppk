-- Public readers need only the presentation-safe columns of approved comments.
REVOKE SELECT ON TABLE public.blog_comments FROM anon;
GRANT SELECT (id, post_id, parent_id, author_name, content, status, is_author_reply, created_at, updated_at) ON TABLE public.blog_comments TO anon;

-- Keep the existing approved-comments row filter, but scope it explicitly to guests and signed-in users.
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.blog_comments;
CREATE POLICY "Public can read approved comment content"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (status = 'approved'::public.blog_comment_status);

-- Internal instruction metadata and embedded document data require a signed-in account.
DROP POLICY IF EXISTS "Instruction files are viewable by everyone" ON public.instruction_files;
CREATE POLICY "Authenticated users can view instruction files"
ON public.instruction_files
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- The private storage bucket follows the same authenticated-only read rule.
DROP POLICY IF EXISTS "Users can view instruction documents" ON storage.objects;
CREATE POLICY "Authenticated users can view instruction documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'instruction-documents'
  AND auth.uid() IS NOT NULL
);