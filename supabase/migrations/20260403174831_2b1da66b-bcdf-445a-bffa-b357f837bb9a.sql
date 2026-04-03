
-- Tabela de conversas da Professora
create table public.professora_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nova conversa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.professora_conversations enable row level security;

create policy "Users see own conversations" on public.professora_conversations for select using (auth.uid() = user_id);
create policy "Users create own conversations" on public.professora_conversations for insert with check (auth.uid() = user_id);
create policy "Users update own conversations" on public.professora_conversations for update using (auth.uid() = user_id);
create policy "Users delete own conversations" on public.professora_conversations for delete using (auth.uid() = user_id);

-- Adicionar conversation_id ao histórico existente
alter table public.chat_professora_historico add column if not exists conversation_id uuid references public.professora_conversations(id);
