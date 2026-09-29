CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.site_owners (
    user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    compatibility VARCHAR(500),
    price NUMERIC(12, 2) CHECK (price IS NULL OR price >= 0),
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160),
    phone VARCHAR(40) NOT NULL,
    vehicle VARCHAR(160),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_active_category_idx
    ON public.products (category, name)
    WHERE active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS products_name_unique_idx
    ON public.products (LOWER(name));

INSERT INTO public.products (name, category, description, compatibility, active)
SELECT seed.name, seed.category, seed.description, seed.compatibility, TRUE
FROM (
    VALUES
        ('Pinças Dianteiras e Traseiras', 'Freios', 'Pinças de freio dianteiras e traseiras para diversas aplicações.', 'Consultar por modelo, ano e motorização.'),
        ('Caixa de Direção Elétrica', 'Direção', 'Caixas de direção elétrica com procedência e aplicação correta.', 'Consulte pelo modelo, ano e versão do veículo.'),
        ('Caixa de Direção Mecânica', 'Direção', 'Caixas de direção mecânica para reposição automotiva.', 'Consulte disponibilidade pelo veículo.'),
        ('Caixa de Direção Hidráulica', 'Direção', 'Caixas de direção hidráulica para linha leve e utilitários.', 'Consulte por modelo, ano e motorização.'),
        ('Terminais de Direção', 'Direção', 'Terminais de direção para reposição com encaixe correto.', 'Aplicação sob consulta.'),
        ('Hidrovácuos', 'Freios', 'Hidrovácuos para sistemas de freio de diversas aplicações.', 'Consulte disponibilidade pelo chassi ou modelo.'),
        ('Bandejas de Suspensão', 'Suspensão', 'Bandejas de suspensão para reposição automotiva.', 'Modelos nacionais e importados sob consulta.'),
        ('Buchas e Pivôs', 'Suspensão', 'Buchas e pivôs para suspensão, estabilidade e segurança.', 'Consulte pelo modelo do veículo.'),
        ('Amortecedores', 'Suspensão', 'Amortecedores para reposição em diferentes modelos.', 'Disponibilidade sob consulta.'),
        ('Kit de Embreagem', 'Embreagem', 'Kit de embreagem para reposição conforme aplicação do veículo.', 'Consulte por modelo, ano e motor.')
) AS seed(name, category, description, compatibility)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.products
    WHERE LOWER(public.products.name) = LOWER(seed.name)
);

ALTER TABLE public.site_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_site_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.site_owners
        WHERE user_id = (SELECT auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_site_owner() TO anon, authenticated;
GRANT SELECT ON public.site_owners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT ON public.leads TO authenticated;

DROP POLICY IF EXISTS "Owners can read own owner record" ON public.site_owners;
CREATE POLICY "Owners can read own owner record"
    ON public.site_owners FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT TO anon, authenticated
    USING (active = TRUE OR (SELECT public.is_site_owner()));

DROP POLICY IF EXISTS "Only owners can add products" ON public.products;
CREATE POLICY "Only owners can add products"
    ON public.products FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_site_owner()));

DROP POLICY IF EXISTS "Only owners can edit products" ON public.products;
CREATE POLICY "Only owners can edit products"
    ON public.products FOR UPDATE TO authenticated
    USING ((SELECT public.is_site_owner()))
    WITH CHECK ((SELECT public.is_site_owner()));

DROP POLICY IF EXISTS "Only owners can remove products" ON public.products;
CREATE POLICY "Only owners can remove products"
    ON public.products FOR DELETE TO authenticated
    USING ((SELECT public.is_site_owner()));

DROP POLICY IF EXISTS "Visitors can send contact requests" ON public.leads;
CREATE POLICY "Visitors can send contact requests"
    ON public.leads FOR INSERT TO anon, authenticated
    WITH CHECK (
        LENGTH(TRIM(name)) > 0
        AND LENGTH(TRIM(phone)) > 0
        AND LENGTH(TRIM(message)) > 0
    );

DROP POLICY IF EXISTS "Only owners can read contact requests" ON public.leads;
CREATE POLICY "Only owners can read contact requests"
    ON public.leads FOR SELECT TO authenticated
    USING ((SELECT public.is_site_owner()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view product photos" ON storage.objects;
CREATE POLICY "Anyone can view product photos"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Only owners can upload product photos" ON storage.objects;
CREATE POLICY "Only owners can upload product photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'product-images'
        AND (SELECT public.is_site_owner())
    );

DROP POLICY IF EXISTS "Only owners can update product photos" ON storage.objects;
CREATE POLICY "Only owners can update product photos"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'product-images'
        AND (SELECT public.is_site_owner())
    )
    WITH CHECK (
        bucket_id = 'product-images'
        AND (SELECT public.is_site_owner())
    );

DROP POLICY IF EXISTS "Only owners can delete product photos" ON storage.objects;
CREATE POLICY "Only owners can delete product photos"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'product-images'
        AND (SELECT public.is_site_owner())
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    END IF;
END;
$$;
