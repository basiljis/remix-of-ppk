-- 1. Update all posts in 'product' category to 'news'
UPDATE public.blog_posts 
SET category = 'news' 
WHERE category::text = 'product';

-- 2. Remove 'product' from the enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
        WHERE pg_type.typname = 'blog_category' AND pg_enum.enumlabel = 'product'
    ) THEN
        -- Drop default before type change
        ALTER TABLE public.blog_posts ALTER COLUMN category DROP DEFAULT;
        
        -- Change column type to text temporarily
        ALTER TABLE public.blog_posts ALTER COLUMN category TYPE text;
        
        -- Recreate enum
        DROP TYPE public.blog_category;
        CREATE TYPE public.blog_category AS ENUM ('specialists', 'admins', 'parents', 'news');
        
        -- Cast column back to enum
        ALTER TABLE public.blog_posts ALTER COLUMN category TYPE public.blog_category USING category::public.blog_category;
        
        -- Restore default
        ALTER TABLE public.blog_posts ALTER COLUMN category SET DEFAULT 'news'::public.blog_category;
    END IF;
END
$$;