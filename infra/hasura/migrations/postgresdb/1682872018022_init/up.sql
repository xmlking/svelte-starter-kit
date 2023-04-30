SET check_function_bodies = false;
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;
COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';
CREATE EXTENSION IF NOT EXISTS hstore WITH SCHEMA public;
COMMENT ON EXTENSION hstore IS 'data type for storing sets of (key, value) pairs';
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
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
CREATE FUNCTION public.protect_record_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Can not delete rows in this table';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TABLE public.policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    created_by character varying NOT NULL,
    updated_by character varying NOT NULL,
    display_name character varying NOT NULL,
    description character varying(100),
    tags text[],
    annotations public.hstore,
    disabled boolean DEFAULT false,
    template boolean DEFAULT false,
    valid_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
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
ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);
CREATE INDEX policy_deleted_at ON public.policies USING btree (deleted_at);
CREATE INDEX policy_subject_id_subject_type ON public.policies USING btree (subject_id, subject_type);
CREATE INDEX policy_subject_secondary_id_subject_type ON public.policies USING btree (subject_secondary_id, subject_type);
CREATE INDEX policy_template ON public.policies USING btree (template);
CREATE TRIGGER set_public_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_policies_updated_at ON public.policies IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER protect_public_policies_record_delete BEFORE DELETE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.protect_record_delete();
COMMENT ON TRIGGER protect_public_policies_record_delete ON public.policies IS 'trigger to prevent policies deletion';
