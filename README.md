# SiteDeInvestigação

Instruções rápidas:

1. Crie o projeto Vite (local):

```bash
npm create vite@latest nome-do-site -- --template react-ts
cd nome-do-site
npm install
```

2. Copie os arquivos de `src/` criados aqui para o seu projeto ou use-os como referência.

3. Configure variáveis de ambiente (ex.: `.env` / `.env.local`):

VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

4. Rode o SQL no painel do Supabase (see `supabase.sql`).

5. Rodar localmente:

```bash
npm run dev
```
