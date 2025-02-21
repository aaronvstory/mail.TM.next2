-- Create a function to import CSV data
create or replace function import_emails_from_csv(
  csv_data text,
  delimiter text default ','
) returns void language plpgsql as $$
begin
  create temp table temp_emails (
    message_id text,
    account_email text,
    from_address text,
    from_name text,
    to_addresses jsonb,
    subject text,
    intro text,
    text_content text,
    html_content text,
    seen boolean,
    is_deleted boolean,
    has_attachments boolean,
    size integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  ) on commit drop;

  -- Copy the CSV data into the temp table
  copy temp_emails from program 'echo ' || quote_literal(csv_data) || ' | tr "' || delimiter || '" "|"' with (format csv, delimiter '|');

  -- Insert into the real table, skipping duplicates
  insert into emails (
    message_id, account_email, from_address, from_name,
    to_addresses, subject, intro, text_content, html_content,
    seen, is_deleted, has_attachments, size, created_at, updated_at
  )
  select
    message_id, account_email, from_address, from_name,
    to_addresses::jsonb, subject, intro, text_content, html_content,
    seen, is_deleted, has_attachments, size::integer,
    created_at::timestamp with time zone,
    updated_at::timestamp with time zone
  from temp_emails
  on conflict (message_id) do nothing;

end; $$;
