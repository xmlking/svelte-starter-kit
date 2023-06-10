#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_USER" <<-EOSQL
	CREATE EXTENSION IF NOT EXISTS hstore;
	-- create extension if not exists postgis;
	SELECT * FROM PG_EXTENSION;
	-- add global variable for controlling hard/soft deletion
	ALTER DATABASE postgres SET rules.soft_deletion TO on;
    -- CREATE USER app_user WITH ENCRYPTED PASSWORD 'app_user';
    -- CREATE DATABASE policy;
    -- GRANT ALL PRIVILEGES ON DATABASE policy TO app_user;
EOSQL
