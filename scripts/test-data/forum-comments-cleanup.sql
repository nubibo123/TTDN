\set ON_ERROR_STOP on
BEGIN;
DELETE FROM forum_posts WHERE author_id='comment-ai-test-author' AND id IN ('c4dbae46-4a4a-4c97-992d-eba1c745af6d','3a8b0f76-b48c-4114-8ab0-b734afadb9c4','2ab5e3bd-b41e-4137-81aa-6863dd4da4e3','af0c5df6-8b2d-4b0c-aa95-fa55bd2639ac','c1ae0711-48d0-4dc2-99e1-1433c161354a','629faa0d-4e09-438b-9d0a-00dfc89df441','035fb6a3-b46f-49f9-80da-3cd3c328de86','eddeb8fe-101d-4b66-bcf3-f6f9abe7c2d9','23ba6abd-309b-4aa3-8e63-cbaf8109efe0','0b308da8-bb25-462b-9823-59487623a507','1ab0fb96-b3eb-4608-ad59-6a962cdb064c','68f9f338-a424-4165-a6ee-8eb2d23a66dc');
COMMIT;
