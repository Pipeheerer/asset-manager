

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'categories', 'departments', 'assets')
ORDER BY table_name;

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'categories', 'departments', 'assets')
ORDER BY tablename, policyname;

-- Check if we have data in categories and departments
SELECT 'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'assets' as table_name, COUNT(*) as count FROM assets;
