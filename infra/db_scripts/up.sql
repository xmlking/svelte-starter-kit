SET check_function_bodies = false;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';
CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA public;
COMMENT ON EXTENSION hstore IS 'data type for storing sets of (key, value) pairs';
CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;
COMMENT ON EXTENSION ltree IS 'data type for storing hierarchical data path';
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
CREATE FUNCTION public.protect_record_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Can not delete rows in this table';
    RETURN OLD;
END;
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
    subject_domain character varying,
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
CREATE TABLE public.subject_type (
    value text NOT NULL,
    description text NOT NULL
);
COMMENT ON TABLE public.subject_type IS 'Subject Type';
ALTER TABLE ONLY public.action
    ADD CONSTRAINT action_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.direction
    ADD CONSTRAINT direction_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subject_type
    ADD CONSTRAINT subject_type_pkey PRIMARY KEY (value);
CREATE INDEX policy_deleted_at ON public.policies USING btree (deleted_at);
CREATE INDEX policy_subject_id_subject_type ON public.policies USING btree (subject_id, subject_type);
CREATE INDEX policy_subject_secondary_id_subject_type ON public.policies USING btree (subject_secondary_id, subject_type);
CREATE INDEX policy_template ON public.policies USING btree (template);
CREATE TRIGGER protect_public_policies_record_delete BEFORE DELETE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.protect_record_delete();
COMMENT ON TRIGGER protect_public_policies_record_delete ON public.policies IS 'trigger to prevent policies deletion';
CREATE TRIGGER set_public_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_policies_updated_at ON public.policies IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_action_fkey FOREIGN KEY (action) REFERENCES public.action(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_direction_fkey FOREIGN KEY (direction) REFERENCES public.direction(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_subject_domain_fkey FOREIGN KEY (subject_domain) REFERENCES public.organization(value);
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_subject_type_fkey FOREIGN KEY (subject_type) REFERENCES public.subject_type(value);
