-- =========================================================
-- Tabela de contatos do formulário da landing page.
-- Como aplicar: Supabase > SQL Editor > cole este arquivo > Run.
--
-- Segurança:
--   * RLS ativado e NENHUMA policy: o navegador (chaves anon/publishable)
--     não consegue ler, inserir, alterar nem apagar nada aqui.
--   * Só a função da Vercel (api/contato.js), com a chave secreta
--     service_role guardada nas variáveis de ambiente da Vercel, grava.
--   * Os limites de tamanho são repetidos aqui (CHECK) para valerem
--     mesmo se alguém chamar a API do banco por outro caminho.
-- =========================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nome        text not null check (char_length(nome) between 2 and 100),
  contato     text not null check (char_length(contato) between 5 and 120),
  procura     text not null default '' check (char_length(procura) <= 1000),
  origem      text not null default 'landing' check (origem in ('landing')),
  -- hash (SHA-256 + segredo) do IP: serve para o limite de envios sem guardar o IP real (LGPD)
  ip_hash     text not null check (char_length(ip_hash) = 64)
);

comment on table public.leads is 'Contatos enviados pelo formulário da landing page. Gravação só pelo servidor (service_role).';

-- Usado pelo limite de envios por IP (consulta "quantos envios deste IP nos últimos minutos")
create index if not exists leads_ip_hash_created_at_idx on public.leads (ip_hash, created_at desc);

-- RLS ligado, sem policies = acesso negado para anon e authenticated
alter table public.leads enable row level security;
alter table public.leads force row level security;

-- Defesa extra: tira as permissões padrão dos papéis usados pelo navegador
revoke all on table public.leads from anon, authenticated;
