create table emails (
  message_id text primary key,
  account_email text not null,
  from_address text not null,
  from_name text,
  to_addresses jsonb not null,
  subject text not null,
  intro text,
  text_content text,
  html_content text,
  seen boolean default false,
  is_deleted boolean default false,
  has_attachments boolean default false,
  size integer,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null
);

-- Create indexes for better query performance
create index emails_account_email_idx on emails(account_email);
create index emails_created_at_idx on emails(created_at);

-- Add RLS policies
alter table emails enable row level security;

create policy "Users can view their own emails"
  on emails for select
  using (auth.uid()::text = account_email);

create policy "Users can update their own emails"
  on emails for update
  using (auth.uid()::text = account_email);
