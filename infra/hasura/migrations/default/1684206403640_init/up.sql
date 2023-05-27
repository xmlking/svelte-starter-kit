SET check_function_bodies = false;
---ALTER DATABASE postgres SET rules.soft_deletion TO on;
SET SESSION "rules.soft_deletion" = 'on';
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';
CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA public;
COMMENT ON EXTENSION hstore IS 'data type for storing sets of (key, value) pairs';
CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
COMMENT ON EXTENSION ltree IS 'data type for storing hierarchical data path';
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
CREATE TABLE public.devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by text NOT NULL,
    updated_by text NOT NULL,
    display_name text NOT NULL,
    description text,
    tags text[],
    annotations public.hstore,
    ip text NOT NULL,
    organization text NOT NULL
);
COMMENT ON TABLE public.devices IS 'devices metadata';
CREATE FUNCTION public.devices_not_in_pool(poolid uuid) RETURNS SETOF public.devices
    LANGUAGE sql STABLE
    AS $$
SELECT *
FROM devices
WHERE id NOT IN (SELECT device_id FROM device_pool WHERE pool_id = poolid)
$$;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.action (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.action IS 'action type';
CREATE TABLE public.device_pool (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pool_id uuid NOT NULL,
    device_id uuid NOT NULL,
    created_by text NOT NULL,
    updated_by text NOT NULL
);
COMMENT ON TABLE public.device_pool IS 'device to pool bridge table ';
CREATE TABLE public.direction (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.direction IS 'direction type';
CREATE TABLE public.organization (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.organization IS 'organizations are enums';
CREATE TABLE public.policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying NOT NULL,
    deleted_at timestamp with time zone,
    display_name character varying NOT NULL,
    description character varying,
    tags text[],
    annotations public.hstore,
    disabled boolean DEFAULT false,
    template boolean DEFAULT false,
    valid_from timestamp with time zone DEFAULT now(),
    valid_to timestamp with time zone,
    subject_id character varying NOT NULL,
    subject_secondary_id character varying,
    subject_display_name character varying,
    subject_type character varying DEFAULT 'subject_type_user'::character varying,
    organization character varying,
    source_address character varying,
    source_port character varying,
    destination_address character varying,
    destination_port character varying,
    protocol character varying DEFAULT 'Any'::character varying,
    action character varying DEFAULT 'action_permit'::character varying NOT NULL,
    direction character varying DEFAULT 'direction_egress'::character varying NOT NULL,
    weight integer DEFAULT 1000,
    app_id character varying
);
COMMENT ON TABLE public.policies IS 'This is policy table.';
CREATE TABLE public.pools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text NOT NULL,
    deleted_at timestamp with time zone,
    organization text NOT NULL,
    tags text[],
    annotations public.hstore,
    display_name text NOT NULL,
    description text
);
COMMENT ON TABLE public.pools IS 'Device pools';
CREATE TABLE public.subject_type (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.subject_type IS 'Subject Type';
ALTER TABLE ONLY public.action
    ADD CONSTRAINT action_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.device_pool
    ADD CONSTRAINT device_pool_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.device_pool
    ADD CONSTRAINT device_pool_pool_id_device_id_key UNIQUE (pool_id, device_id);
ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subject_type
    ADD CONSTRAINT subject_type_pkey PRIMARY KEY (value);
CREATE INDEX devices_display_name ON public.devices USING btree (display_name);
CREATE UNIQUE INDEX devices_display_name_organization_unique ON public.devices USING btree (display_name, organization) WHERE (deleted_at IS NULL);
CREATE INDEX policy_deleted_at ON public.policies USING btree (deleted_at);
CREATE UNIQUE INDEX policy_display_name_organization_unique ON public.policies USING btree (display_name, organization) WHERE (deleted_at IS NULL);
CREATE INDEX policy_subject_id_subject_type ON public.policies USING btree (subject_id, subject_type);
CREATE INDEX policy_subject_secondary_id_subject_type ON public.policies USING btree (subject_secondary_id, subject_type);
CREATE INDEX policy_template ON public.policies USING btree (template);
CREATE UNIQUE INDEX pools_display_name_organization_unique ON public.pools USING btree (display_name, organization) WHERE (deleted_at IS NULL);
CREATE RULE devices_soft_deletion_rule AS
    ON DELETE TO public.devices
   WHERE (current_setting('rules.soft_deletion'::text) = 'on'::text) DO INSTEAD  UPDATE public.devices SET deleted_at = now()
  WHERE (devices.id = old.id);
COMMENT ON RULE devices_soft_deletion_rule ON public.devices IS 'Make soft instead of hard deletion';
CREATE RULE policies_soft_deletion_rule AS
    ON DELETE TO public.policies
   WHERE (current_setting('rules.soft_deletion'::text) = 'on'::text) DO INSTEAD  UPDATE public.policies SET deleted_at = now()
  WHERE (policies.id = old.id);
COMMENT ON RULE policies_soft_deletion_rule ON public.policies IS 'Make soft instead of hard deletion';
CREATE RULE pools_soft_deletion_rule AS
    ON DELETE TO public.pools
   WHERE (current_setting('rules.soft_deletion'::text) = 'on'::text) DO INSTEAD  UPDATE public.pools SET deleted_at = now()
  WHERE (pools.id = old.id);
COMMENT ON RULE pools_soft_deletion_rule ON public.pools IS 'Make soft instead of hard deletion';
CREATE TRIGGER set_public_device_pool_updated_at BEFORE UPDATE ON public.device_pool FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_device_pool_updated_at ON public.device_pool IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_devices_updated_at ON public.devices IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_policies_updated_at ON public.policies IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_pools_updated_at BEFORE UPDATE ON public.pools FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_pools_updated_at ON public.pools IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.device_pool
    ADD CONSTRAINT device_pool_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.device_pool
    ADD CONSTRAINT device_pool_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pools(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_organization_fkey FOREIGN KEY (organization) REFERENCES public.organization(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_action_fkey FOREIGN KEY (action) REFERENCES public.action(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_direction_fkey FOREIGN KEY (direction) REFERENCES public.direction(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_organization_fkey FOREIGN KEY (organization) REFERENCES public.organization(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_subject_type_fkey FOREIGN KEY (subject_type) REFERENCES public.subject_type(value);
ALTER TABLE ONLY public.pools
    ADD CONSTRAINT pools_organization_fkey FOREIGN KEY (organization) REFERENCES public.organization(value);
