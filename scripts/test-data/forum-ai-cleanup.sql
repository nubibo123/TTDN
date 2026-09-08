\set ON_ERROR_STOP on
BEGIN;
DELETE FROM forum_threads
WHERE author_id = 'aitest-forum-author'
  AND id IN ('56ecac15-74d5-4bf2-9383-758dfe0d95a9', 'e090ad85-1e80-457e-a9de-e12cf5a2a13b', '65579594-87b8-4332-89fa-b82a81944be7', '7e58c17f-1232-43b7-8a2e-492fe0a9fc1b', 'd38f04ac-98ce-4e53-8505-59a2d4e19bec', 'b8a55206-03a5-45cc-aff4-b31d7f683568', 'b448e5f0-2334-4340-807f-91e9dc332af6', '32c2d372-4398-4ac8-bcde-dbb731926af9', '3414c3e8-049d-4c0d-8520-490b2c770efc', '58c54858-715d-4fb9-9c23-a601a4ec7bc0', '8aaa2169-259e-47ed-8ccb-ee476d73d50f', '57223114-f492-4668-b7bc-da3a0ee240f8');
-- Keep the disabled test author to avoid cascading deletion of other records.
COMMIT;
