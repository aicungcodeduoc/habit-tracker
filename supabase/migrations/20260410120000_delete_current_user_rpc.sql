-- Cho phép user đã đăng nhập tự xóa bản ghi trong auth.users.
-- Dữ liệu public (profiles, habits, ...) đã REFERENCES auth.users ... ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  DELETE FROM auth.users
  WHERE id = (SELECT auth.uid());
END;
$$;

COMMENT ON FUNCTION public.delete_current_user() IS 'Self-delete: removes auth user row; related rows cascade via FK.';

REVOKE ALL ON FUNCTION public.delete_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
