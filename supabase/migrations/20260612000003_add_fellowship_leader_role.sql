-- Must run in its own migration/transaction (Postgres restriction on ALTER TYPE ... ADD VALUE)
alter type public.app_role add value if not exists 'fellowship_leader';
