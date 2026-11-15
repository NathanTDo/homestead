-- Store the display name given at signup (auth metadata) on the profile.
-- Reading it in the trigger works even when email confirmation is on and the
-- client has no session yet right after signUp().
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(left(trim(NEW.raw_user_meta_data ->> 'display_name'), 50), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
