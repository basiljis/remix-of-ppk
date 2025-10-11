-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'regional_operator', 'user');

-- Create regions reference table
CREATE TABLE public.regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create positions reference table
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  position_id UUID REFERENCES public.positions(id) NOT NULL,
  region_id TEXT REFERENCES public.regions(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  is_blocked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Insert regions data
INSERT INTO public.regions (id, name) VALUES
('01', 'Республика Адыгея'),
('02', 'Республика Башкортостан'),
('03', 'Республика Бурятия'),
('04', 'Республика Алтай'),
('05', 'Республика Дагестан'),
('06', 'Республика Ингушетия'),
('07', 'Кабардино-Балкарская Республика'),
('08', 'Республика Калмыкия'),
('09', 'Карачаево-Черкесская Республика'),
('10', 'Республика Карелия'),
('11', 'Республика Коми'),
('12', 'Республика Марий Эл'),
('13', 'Республика Мордовия'),
('14', 'Республика Саха (Якутия)'),
('15', 'Республика Северная Осетия - Алания'),
('16', 'Республика Татарстан (Татарстан)'),
('17', 'Республика Тыва'),
('18', 'Удмуртская Республика'),
('19', 'Республика Хакасия'),
('20', 'Чеченская Республика'),
('21', 'Чувашская Республика - Чувашия'),
('22', 'Алтайский край'),
('23', 'Краснодарский край'),
('24', 'Красноярский край'),
('25', 'Приморский край'),
('26', 'Ставропольский край'),
('27', 'Хабаровский край'),
('28', 'Амурская область'),
('29', 'Архангельская область'),
('30', 'Астраханская область'),
('31', 'Белгородская область'),
('32', 'Брянская область'),
('33', 'Владимирская область'),
('34', 'Волгоградская область'),
('35', 'Вологодская область'),
('36', 'Воронежская область'),
('37', 'Ивановская область'),
('38', 'Иркутская область'),
('39', 'Калининградская область'),
('40', 'Калужская область'),
('41', 'Камчатский край'),
('42', 'Кемеровская область'),
('43', 'Кировская область'),
('44', 'Костромская область'),
('45', 'Курганская область'),
('46', 'Курская область'),
('47', 'Ленинградская область'),
('48', 'Липецкая область'),
('49', 'Магаданская область'),
('50', 'Московская область'),
('51', 'Мурманская область'),
('52', 'Нижегородская область'),
('53', 'Новгородская область'),
('54', 'Новосибирская область'),
('55', 'Омская область'),
('56', 'Оренбургская область'),
('57', 'Орловская область'),
('58', 'Пензенская область'),
('59', 'Пермский край'),
('60', 'Псковская область'),
('61', 'Ростовская область'),
('62', 'Рязанская область'),
('63', 'Самарская область'),
('64', 'Саратовская область'),
('65', 'Сахалинская область'),
('66', 'Свердловская область'),
('67', 'Смоленская область'),
('68', 'Тамбовская область'),
('69', 'Тверская область'),
('70', 'Томская область'),
('71', 'Тульская область'),
('72', 'Тюменская область'),
('73', 'Ульяновская область'),
('74', 'Челябинская область'),
('75', 'Забайкальский край'),
('76', 'Ярославская область'),
('77', 'г. Москва'),
('78', 'г. Санкт-Петербург'),
('79', 'Еврейская автономная область'),
('83', 'Ненецкий автономный округ'),
('86', 'Ханты-Мансийский АО - Югра'),
('87', 'Чукотский автономный округ'),
('89', 'Ямало-Ненецкий автономный округ'),
('90', 'Запорожская область'),
('91', 'Республика Крым'),
('92', 'г. Севастополь'),
('93', 'Донецкая Народная Республика'),
('94', 'Луганская Народная Республика'),
('95', 'Херсонская область');

-- Insert positions data
INSERT INTO public.positions (name) VALUES
('Председатель ППК'),
('Педагог-психолог'),
('Социальный педагог'),
('Учитель-логопед'),
('Педагогический работник (учителя-предметники)'),
('Медицинский работник'),
('Дефектолог/Тифлопедагог/Сурдопедагог'),
('Секретарь ППК');

-- Enable RLS on new tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create function to get user's region_id
CREATE OR REPLACE FUNCTION public.get_user_region(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT region_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Create function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for regions (public read)
CREATE POLICY "Regions are viewable by everyone"
ON public.regions FOR SELECT
USING (true);

-- RLS Policies for positions (public read, admin write)
CREATE POLICY "Positions are viewable by everyone"
ON public.positions FOR SELECT
USING (true);

CREATE POLICY "Admins can insert positions"
ON public.positions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update positions"
ON public.positions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete positions"
ON public.positions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional operators can view profiles in their region"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'regional_operator') 
  AND region_id = public.get_user_region(auth.uid())
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update protocols RLS policies
DROP POLICY IF EXISTS "Protocols are viewable by everyone" ON public.protocols;

CREATE POLICY "Admins can view all protocols"
ON public.protocols FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional operators can view protocols in their region"
ON public.protocols FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'regional_operator')
  AND organization_id IN (
    SELECT id FROM public.organizations 
    WHERE id IN (
      SELECT organization_id FROM public.profiles 
      WHERE region_id = public.get_user_region(auth.uid())
    )
  )
);

CREATE POLICY "Users can view protocols from their organization"
ON public.protocols FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'user')
  AND organization_id = public.get_user_organization(auth.uid())
);

CREATE POLICY "Authenticated users can insert protocols"
ON public.protocols FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_blocked = true
  )
);

CREATE POLICY "Users can update their organization's protocols"
ON public.protocols FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'user')
    AND organization_id = public.get_user_organization(auth.uid())
  )
  OR (
    public.has_role(auth.uid(), 'regional_operator')
    AND organization_id IN (
      SELECT id FROM public.organizations 
      WHERE id IN (
        SELECT organization_id FROM public.profiles 
        WHERE region_id = public.get_user_region(auth.uid())
      )
    )
  )
);

-- Create trigger to automatically assign 'user' role on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();