# Aço & Navalha — Sistema de Agendamento para Barbearia

Sistema completo (frontend + backend + banco de dados) para uma barbearia
vender agendamentos online. Testado ponta a ponta: autenticação, RLS,
agenda por barbeiro, bloqueios, serviços, relatórios.

```
barbearia-sistema/
├── backend/     API REST (Node/Express + PostgreSQL com RLS)
└── frontend/    React (Vite) + Tailwind + React Router
```

## 1. Pré-requisitos

- Node.js 18+
- PostgreSQL 14+

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # ajuste DATABASE_URL e JWT_SECRET
```

Crie o banco e rode a migração (cria tabelas + Row Level Security):

```bash
createdb barbearia
psql -d barbearia -f src/migrations/001_init.sql
```

A migração cria automaticamente uma role de banco `barbearia_app`
(sem privilégio de superusuário — é isso que faz o RLS valer de verdade).
Se preferir, troque a senha dela direto no SQL antes de rodar.

Popule com dados de exemplo (3 barbeiros, serviços, expediente, 1 admin, 1 cliente):

```bash
npm run seed
```

Suba a API:

```bash
npm start          # roda em http://localhost:4000
```

**Login de teste criado pelo seed:**
- Admin: `admin@barbearia.com` / `admin123`
- Cliente: `cliente@teste.com` / `cliente123`

⚠️ Troque essas credenciais (ou apague o usuário e crie o seu) antes de vender/publicar.

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # aponte VITE_API_URL para a API
npm run dev                 # roda em http://localhost:5173
```

Para gerar o build de produção:

```bash
npm run build     # gera a pasta dist/, pronta para qualquer hosting estático
```

## 4. Como o sistema resolve o que você pediu

- **Bloqueio por barbeiro, não global**: em Painel → Agenda, primeiro você escolhe
  o barbeiro, depois bloqueia o dia inteiro ou só um horário específico —
  o bloqueio vale só para aquele profissional.
- **Expediente flexível por barbeiro** (ex.: só de tarde): também em Painel → Agenda,
  cada barbeiro tem seu próprio expediente semanal, dia a dia. Sem horário
  cadastrado num dia = ele não atende naquele dia da semana.
- **Adicionar serviço funcionando de verdade**: Painel → Serviços, com validação
  de preço/duração e mensagens de erro claras.
- **"Nossos barbeiros" sem lista de serviços**: os cards da landing mostram
  só nome, função e foto/iniciais — sem poluir com os +10 serviços de cada um.
- **Controle total do barbeiro sobre a própria agenda**: expediente, bloqueios
  e lista de agendamentos do dia ficam todos dentro da mesma tela (Painel → Agenda),
  filtrados por barbeiro selecionado.

## 5. Segurança implementada

- **Row Level Security (RLS)** real no Postgres: a API conecta com uma role
  sem privilégio de superusuário; cada requisição seta `app.user_id` e `app.role`
  como variáveis de sessão, e as políticas do banco usam isso para decidir o que
  cada linha pode ser lida/escrita — mesmo que exista um bug na API, o banco
  não deixa um cliente ler/cancelar agendamento de outro cliente, nem um
  cliente comum escrever em tabelas de barbeiro/serviço/agenda.
- **Senhas com bcrypt**, nunca armazenadas em texto puro.
- **JWT** para sessão, com rotas do backend protegidas por `requireAuth` +
  `requireRole('admin')` onde cabe.
- **Validação de dados no backend** com `express-validator` em todas as rotas
  de escrita (não confia só na validação do frontend).
- **Revalidação de conflito de horário na escrita**: mesmo que o frontend
  mostre um horário como livre, o backend confere de novo no momento de
  salvar (evita 2 clientes reservando o mesmo horário ao mesmo tempo).

## 6. Login com Google

O botão "Continuar com Google" está funcional no fluxo (cria/loga a conta),
mas hoje simula a etapa do popup do Google com um `prompt()` simples, porque
a integração real de OAuth exige credenciais de um projeto no Google Cloud
Console (Client ID/Secret) que só você pode gerar, atrelado ao domínio da
barbearia. Trocar isso pela integração real depois é uma tarefa pequena e
isolada — o backend já tem o endpoint (`POST /api/auth/google`) pronto para
receber nome/e-mail vindos de um OAuth de verdade.

## 7. Deploy sugerido

- **Backend + Postgres**: Railway ou Render (ambos oferecem Postgres gerenciado
  e deploy direto de um repositório Node). Configure as variáveis de ambiente
  do `.env` no painel do serviço.
- **Frontend**: Vercel ou Netlify, apontando `VITE_API_URL` para a URL pública
  do backend em produção.
- Lembre-se de trocar `JWT_SECRET` por um valor aleatório longo em produção,
  e `CORS_ORIGIN` no backend para o domínio real do frontend.

## 8. Personalizando para a barbearia

- Nome/telefone/cidade: `frontend/src/brand.js`
- Cores: classes Tailwind `amber`/`stone`/`red` usadas em todo o front —
  troque por outra paleta do Tailwind se quiser (ex.: `emerald`, `blue`).
- Barbeiros, serviços e horários de exemplo: edite ou apague em
  `backend/src/seed.js` e rode `npm run seed` de novo (isso reseta os dados).
