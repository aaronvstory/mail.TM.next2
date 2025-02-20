create table public.email_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  mail_tm_id text not null,
  email_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true not null
);

-- Set up RLS (Row Level Security)
alter table public.email_accounts enable row level security;

-- Create policies
create policy "Users can view their own email accounts"
  on public.email_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email accounts"
  on public.email_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email accounts"
  on public.email_accounts for update
  using (auth.uid() = user_id);

-- Create indexes
create index email_accounts_user_id_idx on public.email_accounts(user_id);
create index email_accounts_email_address_idx on public.email_accounts(email_address);

