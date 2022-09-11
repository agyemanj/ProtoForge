DROP
    SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

CREATE DOMAIN EXTERNAL_ID AS varchar(31);

CREATE DOMAIN EMAIL_ADDR AS varchar(254);

CREATE DOMAIN OBJECT_LABEL AS varchar(255);

CREATE DOMAIN PHONE_NUMBER AS varchar(31);

CREATE DOMAIN MONEY_AMOUNT AS numeric(12, 2);

CREATE DOMAIN SHORT_TEXT AS varchar(31);

CREATE DOMAIN MEDIUM_TEXT AS varchar(255);

CREATE DOMAIN LONG_TEXT AS varchar(4095);

CREATE TYPE TYPE_TYPE AS ENUM (
    'address',
    'boolean',
    'date',
    'datetime',
    'email_address',
    'external_id',
    'float',
    'hash',
    'integer',
    'internal_id',
    'long_text',
    'media',
    'medium_text',
    'money_amount',
    'object_label',
    'phone_number',
    'salt',
    'short_text',
    'time',
    'url'
);

CREATE TYPE RENDERING_ARCHITECTURE_TYPE AS ENUM ('isomorphic', 'server', 'client');

CREATE TYPE PAGES_ARCHITECTURE_TYPE AS ENUM ('SPA', 'MPA');

CREATE TYPE FOOTER_ORIENTATION_TYPE AS ENUM ('vertical', 'horizontal');

CREATE TYPE CONTAINER_KIND_TYPE AS ENUM ('grid', 'list', 'table');

CREATE TYPE CONTAINER_ORIENTATION_TYPE AS ENUM ('vertical', 'horizontal');

CREATE TYPE TEMPLATE_FIELD_LABELS_TYPE AS ENUM ('caption', 'icon');

CREATE TYPE SEARCH_BOX_TYPE AS ENUM ('dynamic', 'lazy', 'none');

CREATE TYPE SEARCH_PANEL_POSITION_TYPE AS ENUM ('left', 'top', 'right', 'bottom');

CREATE TYPE INITIAL_SORT_ORDER_TYPE AS ENUM ('ascending', 'descending');

CREATE TYPE KIND_TYPE AS ENUM ('wizard', 'list', 'table');

CREATE TYPE ACCESS_LEVEL_TYPE AS ENUM ('none', 'dev', 'admin', 'regular');

CREATE TABLE
    entities (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        name SHORT_TEXT NOT NULL,
        -- The plural name of the entity,
        name_plural SHORT_TEXT NOT NULL,
        title MEDIUM_TEXT NOT NULL,
        description MEDIUM_TEXT NOT NULL,
        -- Name of entity that this entity derives from, or extends,
        extends SHORT_TEXT NULL,
        readonly BOOLEAN NULL
    );

CREATE TABLE
    entity_parents (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_id EXTERNAL_ID NULL REFERENCES entities (id) ON DELETE CASCADE,
        parent_entity SHORT_TEXT NOT NULL
    );

CREATE TABLE
    fields (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_id EXTERNAL_ID NULL REFERENCES entities (id) ON DELETE CASCADE,
        name SHORT_TEXT NOT NULL,
        title MEDIUM_TEXT NOT NULL,
        description MEDIUM_TEXT NOT NULL,
        -- Other enum field on which applicability of this field is based; useful for implementing sum/union types,
        applicable_enum_field SHORT_TEXT NOT NULL,
        -- Value of the enum field that indicates this field is applicable,
        applicable_enum_value SHORT_TEXT NOT NULL,
        -- Whether field value is optional,
        optional BOOLEAN NOT NULL,
        type TYPE_TYPE NOT NULL
    );

CREATE TABLE
    ui_config (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        -- Rendering architecture,
        rendering_architecture RENDERING_ARCHITECTURE_TYPE NOT NULL,
        -- Pages architecture,
        pages_architecture PAGES_ARCHITECTURE_TYPE NOT NULL,
        promo_content_url LONG_TEXT NULL,
        -- Whether bread-crumbs are shown for navigation between pages within a hierarchical entity groups,
        breadcrumbs BOOLEAN NULL,
        -- Whether to show a button for back navigation on each page,
        back_button BOOLEAN NULL,
        primary_color SHORT_TEXT NULL,
        secondary_color SHORT_TEXT NULL,
        copyright_notice SHORT_TEXT NULL,
        contact_address SHORT_TEXT NULL,
        -- General orientation of footer elements other than link set; default is vertical,
        footer_orientation FOOTER_ORIENTATION_TYPE NOT NULL,
        instagram LONG_TEXT NOT NULL,
        facebook LONG_TEXT NOT NULL,
        linkedin LONG_TEXT NOT NULL,
        twitter LONG_TEXT NOT NULL,
        ios_app_store LONG_TEXT NOT NULL,
        google_play_store LONG_TEXT NOT NULL
    );

CREATE TABLE
    entity_list_pages (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_id EXTERNAL_ID NULL REFERENCES entities (id) ON DELETE CASCADE,
        name SHORT_TEXT NOT NULL,
        -- The container to use for displaying the entity objects,
        container_kind CONTAINER_KIND_TYPE NOT NULL,
        container_orientation CONTAINER_ORIENTATION_TYPE NULL,
        -- Comma separated list of fields shown in list/grid template, in roughly the order listed,
        template_fields LONG_TEXT NULL,
        -- Kind of field labels (if any) to be shown; does not apply to table pages,
        template_field_labels TEMPLATE_FIELD_LABELS_TYPE NULL,
        -- Configuration for the free-form search box; dynamic => changes to the search text are immediately applied,
        search_box SEARCH_BOX_TYPE NULL,
        -- Comma separated fields of the object to allow searching by; If missing no search panel is shown,
        search_panel_fields LONG_TEXT NULL,
        -- Position of search panel if shown. Default is left,
        search_panel_position SEARCH_PANEL_POSITION_TYPE NULL,
        initial_sort_field SHORT_TEXT NOT NULL,
        initial_sort_order INITIAL_SORT_ORDER_TYPE NOT NULL
    );

CREATE TABLE
    entity_editor_pages (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_id EXTERNAL_ID NULL REFERENCES entities (id) ON DELETE CASCADE,
        name SHORT_TEXT NOT NULL,
        -- The editor to use for displaying the entity objects,
        kind KIND_TYPE NOT NULL,
        -- If the kind is 'form', then this field indicates the number of columns used to arrange the fields. If not provided, the number of columns is dynamically determined by the viewport,
        columns INTEGER NULL
    );

CREATE TABLE
    editor_page_tabs (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_editor_page_id EXTERNAL_ID NULL REFERENCES entity_editor_pages (id) ON DELETE CASCADE,
        title SHORT_TEXT NOT NULL,
        -- Comma-separated list of names of fields edited in the tab,
        fields SHORT_TEXT NOT NULL
    );

CREATE TABLE
    editor_page_steps (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        entity_editor_page_id EXTERNAL_ID NULL REFERENCES entity_editor_pages (id) ON DELETE CASCADE,
        title SHORT_TEXT NOT NULL,
        -- Comma-separated list of names of fields edited in the step,
        fields SHORT_TEXT NOT NULL
    );

CREATE TABLE
    listing_media (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        content LONG_TEXT NOT NULL
    );

CREATE TABLE
    footer_links (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        set
            SHORT_TEXT NOT NULL,
            title SHORT_TEXT NOT NULL,
            link LONG_TEXT NOT NULL
    );

CREATE TABLE
    config (_id SERIAL PRIMARY KEY, id EXTERNAL_ID UNIQUE NOT NULL);

CREATE TABLE
    users (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        pwd_hash VARCHAR(60) NOT NULL,
        pwd_salt VARCHAR(255) NOT NULL,
        verification_code MEDIUM_TEXT NOT NULL,
        display_name SHORT_TEXT NOT NULL,
        email_address LONG_TEXT NOT NULL,
        company_name LONG_TEXT NOT NULL,
        access_level ACCESS_LEVEL_TYPE NOT NULL,
        -- Timestamp (milliseconds since epoch) when user was verified by email,
        when_verified BIGINT NULL,
        -- No. of times user has accessed an app - defined resource(useful for conditionally limiting access),
        resource_access_count INTEGER NULL
    );

CREATE TABLE
    resource_access_counts (
        _id SERIAL PRIMARY KEY,
        id EXTERNAL_ID UNIQUE NOT NULL,
        user_id EXTERNAL_ID NULL REFERENCES users (id) ON DELETE CASCADE,
        resource_code SHORT_TEXT NOT NULL,
        resource_type SHORT_TEXT NOT NULL,
        count INTEGER NOT NULL,
        UNIQUE (resource_code, user_id)
    );

CREATE VIEW
    users_readonly AS (
        SELECT
            display_name,
            email_address,
            company_name,
            access_level,
            when_verified,
            resource_access_count
        FROM
            users
    );