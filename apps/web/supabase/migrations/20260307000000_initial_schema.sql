-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies: users can read and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS for Workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. Create User Workspaces (Pivot table for roles)
-- Roles could be: 'owner', 'admin', 'agent'
CREATE TABLE IF NOT EXISTS public.user_workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- ensure a user is only added to a workspace once
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS for User_Workspaces
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Workspaces and User Workspaces
-- Users can see workspaces they are part of
CREATE POLICY "Users can view their workspaces" 
  ON public.workspaces FOR SELECT 
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.user_workspaces uw
      WHERE uw.workspace_id = workspaces.id AND uw.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspaces" 
  ON public.workspaces FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own workspaces" 
  ON public.workspaces FOR UPDATE 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own workspaces" 
  ON public.workspaces FOR DELETE 
  USING (auth.uid() = owner_id);

-- Users can see relations where they are the user
CREATE POLICY "Users can view own workspace relations" 
  ON public.user_workspaces FOR SELECT 
  USING (user_id = auth.uid());


-- 5. Trigger to automatically create a Profile after Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for automatically adding the creator of a workspace as an owner
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_workspaces (user_id, workspace_id, role)
  VALUES (new.owner_id, new.id, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();
