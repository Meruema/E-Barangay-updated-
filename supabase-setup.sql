-- ============================
-- SUPABASE SETUP SCRIPT
-- ============================
-- Run this in your Supabase SQL Editor to set up the database
-- This script creates triggers to sync auth.users with your users table

-- ============================
-- FUNCTION: Sync auth user to users table
-- ============================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, password, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'hashed_password_placeholder', -- You should use proper password hashing
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- TRIGGER: Auto-create user record on signup
-- ============================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- ============================
-- ROLES TABLE POLICIES
-- ============================
-- Allow anyone to read roles
CREATE POLICY "Anyone can read roles" ON roles
  FOR SELECT USING (true);

-- ============================
-- USERS TABLE POLICIES
-- ============================
-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================
-- CATEGORIES TABLE POLICIES
-- ============================
-- Anyone can read categories
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

-- ============================
-- ITEMS TABLE POLICIES
-- ============================
-- Anyone can read available items
CREATE POLICY "Anyone can read available items" ON items
  FOR SELECT USING (status = 'available');

-- ============================
-- REQUESTS TABLE POLICIES
-- ============================
-- Users can read their own requests
CREATE POLICY "Users can read own requests" ON requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests" ON requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ============================
-- REQUEST_ACTIONS TABLE POLICIES
-- ============================
-- Users can read actions on their requests
CREATE POLICY "Users can read own request actions" ON request_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_actions.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- ============================
-- STATISTICS TABLE POLICIES
-- ============================
-- Anyone can read statistics
CREATE POLICY "Anyone can read statistics" ON statistics
  FOR SELECT USING (true);

-- ============================
-- STORAGE POLICIES FOR REQUEST DOCUMENTS
-- ============================
-- Allow authenticated users to upload request documents
CREATE POLICY "Users can upload request documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-documents');

-- Allow authenticated users to view request documents
CREATE POLICY "Users can view request documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'request-documents');

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role full access to request documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'request-documents');

-- ============================
-- REQUEST_DOCUMENTS TABLE POLICIES
-- ============================
-- Enable RLS on request_documents table
ALTER TABLE request_documents ENABLE ROW LEVEL SECURITY;

-- Users can read documents for their own requests
CREATE POLICY "Users can read own request documents" ON request_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_documents.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Users can create documents for their own requests
CREATE POLICY "Users can create own request documents" ON request_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_documents.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- ============================
-- NOTES
-- ============================
-- 1. After running this script, make sure to:
--    - Set up email confirmation in Supabase Auth settings (optional)
--    - Configure your email templates
--    - Test the signup/login flow
--
-- 2. For production, consider:
--    - Adding more granular RLS policies
--    - Setting up admin roles and policies
--    - Adding proper password hashing (if storing passwords)
--    - Setting up email verification
--
-- 3. The handle_new_user function creates a user record automatically
--    when someone signs up via Supabase Auth

