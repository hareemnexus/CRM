-- Run this in Supabase SQL editor to enable email-based upsert for contacts
-- Only run if you haven't added this yet

ALTER TABLE contacts ADD CONSTRAINT contacts_email_unique UNIQUE (email);
