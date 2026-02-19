-- =============================================================================
-- Migration: Rename legacy 'admin' role to 'main_admin'
-- =============================================================================
-- PURPOSE:
--   The 'admin' role has been removed from the application's Role type.
--   The RBAC system now only recognises 'main_admin' as the top-level role.
--   This migration updates all existing users that have role = 'admin' to
--   role = 'main_admin' so that authentication continues to work after deploy.
--
-- SAFETY:
--   * Run this BEFORE deploying the updated application code.
--   * The UPDATE is idempotent — running it a second time has no effect.
--   * The final SELECT is a sanity check; it MUST return 0 rows after migration.
--
-- HOW TO RUN (PostgreSQL):
--   psql "$DATABASE_URL" -f scripts/migrate-admin-roles.sql
-- =============================================================================

BEGIN;

-- Show which users will be affected before changing anything.
SELECT id, username, role
FROM   users
WHERE  role = 'admin';

-- Perform the rename.
UPDATE users
SET    role = 'main_admin'
WHERE  role = 'admin';

-- Sanity check: this must return 0 rows after a successful migration.
-- If it returns any rows, DO NOT COMMIT — ROLLBACK and investigate.
DO $$
DECLARE
    remaining_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_admin_count FROM users WHERE role = 'admin';
    IF remaining_admin_count > 0 THEN
        RAISE EXCEPTION 'Migration incomplete: % user(s) still have role=''admin''. Rolling back.', remaining_admin_count;
    END IF;
    RAISE NOTICE 'Migration successful: 0 users with legacy admin role remain.';
END;
$$;

COMMIT;
