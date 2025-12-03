
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maintenance DISABLE ROW LEVEL SECURITY;


SELECT 'Checking tables...' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'categories', 'departments', 'assets', 'maintenance');


SELECT 'Checking RLS status...' as status;

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'categories', 'departments', 'assets');


SELECT 'Checking data counts...' as status;

SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'assets', COUNT(*) FROM assets;


SELECT 'Assets table columns:' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'assets'
ORDER BY ordinal_position;


DO $$
DECLARE
  test_cat_id UUID;
  test_dept_id UUID;
BEGIN
  -- Get a category and department ID
  SELECT id INTO test_cat_id FROM categories LIMIT 1;
  SELECT id INTO test_dept_id FROM departments LIMIT 1;
  
  IF test_cat_id IS NULL THEN
    RAISE NOTICE 'No categories found! Please add categories first.';
  ELSIF test_dept_id IS NULL THEN
    RAISE NOTICE 'No departments found! Please add departments first.';
  ELSE
    RAISE NOTICE 'Categories and departments exist. Ready for asset creation.';
    RAISE NOTICE 'Category ID: %', test_cat_id;
    RAISE NOTICE 'Department ID: %', test_dept_id;
  END IF;
END $$;

SELECT 'Verification complete!' as status;
