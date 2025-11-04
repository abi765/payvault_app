-- Run this in DBeaver to create the PayVault database
-- Make sure you're connected to your PostgreSQL server (not a specific database)

CREATE DATABASE payvault
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- After running this, you should see 'payvault' database in DBeaver
-- Then update your .env file with the correct username and password
