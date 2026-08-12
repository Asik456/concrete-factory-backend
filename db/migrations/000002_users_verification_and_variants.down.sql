DROP TABLE IF EXISTS product_variants;

ALTER TABLE products
    DROP COLUMN IF EXISTS price_wholesale;

ALTER TABLE users
    DROP COLUMN IF EXISTS is_verified,
    DROP COLUMN IF EXISTS is_blocked,
    DROP COLUMN IF EXISTS verification_code,
    DROP COLUMN IF EXISTS verification_code_expires_at;
