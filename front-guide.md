# Guia do Front‑end — Moneif Maestro

Este guia descreve como construir o front‑end aproveitando ao máximo as funcionalidades expostas pelo backend FastAPI. Inclui visão geral, contratos de API, exemplos de chamadas (fetch/axios), fluxos de UI e boas práticas.

> Base URL padrão em desenvolvimento: <http://localhost:8000>
> Prefixo da API: `/api/v1`
> Documentação interativa: <http://localhost:8000/docs>


## Visão geral de autenticação

- Padrão: OAuth2 Password (Bearer JWT)
- Login: `POST /api/v1/auth/login` (form-urlencoded, campos `username`, `password`)
- Registro: `POST /api/v1/auth/register` (JSON) — requer `access_code` definido no backend (.env)
- Usuário atual: `GET /api/v1/auth/me` (Bearer)
- Duração do token: ~30 dias (configurável)

### Exemplo de cliente Axios com interceptor

```ts
// api/client.ts
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({ baseURL: API_BASE });

// Carregar token de um storage simples (ex.: localStorage)
const getToken = () => localStorage.getItem('token');

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      // Redirecionar para login ou tentar fluxo de re-login
      // (Não há refresh token — faça novo login)
    }
    return Promise.reject(error);
  }
);
```

### Fluxo de login (form-urlencoded)

```ts
// auth/login.ts
import { api } from './client';

export async function login(identifier: string, password: string) {
  const body = new URLSearchParams();
  body.set('username', identifier); // email OU telefone
  body.set('password', password);

  const { data } = await api.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  // { access_token, token_type }
  localStorage.setItem('token', data.access_token);
  return data;
}
```

### Registro

```ts
await api.post('/auth/register', {
  first_name: 'Nome',
  last_name: 'Sobrenome',
  email: 'email@exemplo.com',
  phone: '+5511999999999',
  password: 'senha123',
  access_code: 'm0n3if#2025',
});
```

---

## Recursos e contratos por domínio

Abaixo, um resumo prático dos endpoints, payloads e respostas (tipos modelados no backend com Pydantic). Use sempre o header `Authorization: Bearer {token}` para endpoints protegidos.

### Usuário

Lista de endpoints:

- GET `/user/profile` → UserProfile
- PUT `/user/profile` (partial) → UserProfile
- GET `/user/preferences` → UserPreferences
- PUT `/user/preferences` (parcial, somente após configuração inicial) → UserPreferences
- POST `/user/preferences/init` (todos obrigatórios) → UserPreferences

Schemas relevantes:

- UserProfile: `{ id, first_name, last_name, email, phone, is_active, auto_categorize_enabled, preferences: {bad_threshold?, ok_threshold?, good_threshold?}, preferences_configured, created_at, updated_at? }`
- UserPreferences(Update/Init): thresholds inteiros, com regra de ordem: `bad <= ok <= good`

Uso típico no front:

```ts
// Carregar perfil e montar header do app
const { data: profile } = await api.get('/user/profile');

// Primeira configuração de preferências
await api.post('/user/preferences/init', {
  bad_threshold: 0,
  ok_threshold: 500,
  good_threshold: 1500,
});

// Atualização parcial (após init)
await api.put('/user/preferences', { ok_threshold: 800 });
```

Notas importantes:

- Se as preferências não estiverem configuradas, PUT `/user/preferences` retorna 400. Use POST `/user/preferences/init`.
- `auto_categorize_enabled` no perfil do usuário controla se o backend deve auto-categorizar transações quando possível.

### Categorias

Endpoints:

- GET `/categories/` → `CategoryResponse[]`
- POST `/categories/` Body: `{ name }` → CategoryResponse
- PUT `/categories/{id}` Body: `{ name }` → CategoryResponse
- DELETE `/categories/{id}` → 204

Erros comuns: nome duplicado (400) e id inexistente (404).

### Orçamentos (Budgets)

Endpoints:

- GET `/budgets/?year=YYYY&month=MM&alerts_only=false` → `BudgetResponse[]`
- POST `/budgets/` Body: `{ category_id, year, month, amount, notify_threshold? }` → BudgetResponse

`BudgetResponse` contém campos calculados para UI:

- `spent`, `remaining`, `percent` (0..1), `status`: `ok | warning | exceeded`

Uso típico para exibir cards de orçamento com barra de progresso e cor por `status`.

### Transações

Endpoints:

- POST `/transactions/` Body: `TransactionCreate` → TransactionResponse
- GET `/transactions/{id}` → TransactionResponse
- GET `/transactions/?skip=0&limit=100&on_date=YYYY-MM-DD&category_id=` → `TransactionResponse[]`
- PUT `/transactions/{id}` Body: `TransactionUpdate` (parcial) → TransactionResponse
- DELETE `/transactions/{id}` → 204
- GET `/transactions/balance/daily?year=YYYY&month=MM` → `DailyBalanceResponse[]`
- POST `/transactions/suggest-category` Body: `{ description }` → `{ category?, matched_keyword? }` (não requer auth)

Tipos:

- TransactionCreate: `{ description, amount(decimal com 2 casas), type: 'income'|'expense', transaction_date: 'YYYY-MM-DD', category_id? }`
- TransactionUpdate: todos opcionais
- DailyBalanceResponse: `{ date: 'YYYY-MM-DD', balance: number, status: 'red'|'yellow'|'green'|'unconfigured' | null }`

Auto-categorização no backend:

- Se `category_id` não for enviado e a feature estiver habilitada (global e por usuário), o backend tenta sugerir/atribuir categoria baseada na descrição. O front pode expor um toggle global (perfil) ou apenas informar ao usuário quando uma categoria for atribuída automaticamente.

Exemplos:
```ts
// Criar transação (categoria opcional)
await api.post('/transactions/', {
  description: 'Mercado ABC',
  amount: 245.90,
  type: 'expense',
  transaction_date: '2025-11-07',
});

// Listar com paginação e filtros
const { data: txns } = await api.get('/transactions/', {
  params: { skip: 0, limit: 50, on_date: '2025-11-07', category_id: undefined },
});

// Saldo diário do mês atual
const { data: daily } = await api.get('/transactions/balance/daily', { params: { year: 2025, month: 11 } });
```

### Recorrências

Endpoints:

- GET `/recurring/` → `RecurringResponse[]`
- POST `/recurring/` Body: `RecurringCreate` → RecurringResponse
- DELETE `/recurring/{id}` → 204
- POST `/recurring/materialize` Body: `{ up_to_date: 'YYYY-MM-DD' }` → `{ created: number }`

Regras de criação:

- `frequency`: `daily | weekly | monthly`
- `weekly` exige `weekday` (0=Segunda .. 6=Domingo)
- `monthly` exige `day_of_month` (1..31)
- `end_date` ≥ `start_date`, quando informado

Uso típico:
```ts
await api.post('/recurring/', {
  description: 'Academia',
  amount: 99.90,
  type: 'expense',
  frequency: 'monthly',
  interval: 1,
  start_date: '2025-01-05',
  day_of_month: 5,
  category_id: 3,
});

// Materializar transações recorrentes até a data (ex.: executar mensalmente via ação do usuário)
await api.post('/recurring/materialize', { up_to_date: '2025-11-30' });
```

---

## Padrões e boas práticas no front‑end

### Organização de estados e cache

- Use uma lib de dados remotos com cache e invalidação (React Query/RTK Query/TanStack Query):
  - Chaves sugeridas: `['profile']`, `['categories']`, `['budgets', year, month]`, `['transactions', paramsHash]`, `['recurring']`.
  - Invalide após mutações: criar/editar/deletar transação, categoria, orçamento e recorrência.

### Paginação e filtros

- `GET /transactions/` suporta `skip` e `limit` (1..1000). Implemente paginação baseada em deslocamento.
- Filtros: `on_date` (exact date) e `category_id`.

### Tratamento de erros

- 400: validações e regras de negócio (ex.: nomes duplicados, thresholds inválidos) → exiba mensagem do backend.
- 401: token inválido/expirado → redirecione ao login.
- 404: recurso não encontrado → feedback discreto (toast/banner) e navegação segura.

### Formatação e tipos

- Datas no formato ISO `YYYY-MM-DD`.
- Valores monetários: exiba com 2 casas (ex.: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).
- Campos decimais: envie como número com duas casas (o backend aceita `Decimal`/float com 2 casas). Evite strings monetárias.

### Cores por status

- Saldos diários: `status` pode ser `red | yellow | green | unconfigured`. Se `unconfigured`, incentive o usuário a definir preferências via `/user/preferences/init`.
- Orçamentos: `status` em `BudgetResponse` informa `ok | warning | exceeded` — ótimo para chips/etiquetas de cor.

### Sugestão de categorias (UX)

- Antes de enviar o formulário de transações, chame `POST /transactions/suggest-category` para pré-preencher a categoria, permitindo override do usuário. Não requer autenticação.

### Segurança e armazenamento do token

- SPA: localStorage é simples, mas vulnerável a XSS. Para ambientes mais rígidos, considere um Backend for Frontend (BFF) com cookies httpOnly. Neste projeto, não há refresh token; revalide via login ao receber 401.
- CORS já está liberado para `*` no backend (dev). Em produção, restrinja `allow_origins`.

### Acessibilidade e i18n

- Forneça máscaras para valores e datas.
- Textos em PT‑BR por padrão; isole rótulos para futura i18n.

---

## Fluxos de UI recomendados

1. Dashboard
  - Cards de orçamento do mês atual (GET `/budgets/`), gráfico de saldo diário (GET `/transactions/balance/daily`).
  - Destaque `status` e alertas (`alerts_only=true`) para foco em estouros/avisos.

2. Transações
  - Lista paginada com filtros por data e categoria.
  - Formulário com auto-sugestão de categoria; suporte a criar categoria inline (POST `/categories/`).
  - Edição inline e exclusão com confirmação.

3. Recorrentes
  - Tabela com próxima execução (`next_run_date`).
  - Botão “Materializar até …” chamando `/recurring/materialize`.

4. Perfil e Preferências
  - Exibir e editar `auto_categorize_enabled`, telefone e nome.
  - Wizard para configurar thresholds (init → put).

---

## Dicas de implementação (React/Next como exemplo)

- Defina `VITE_API_BASE_URL=http://localhost:8000/api/v1` em `.env` do front.
- Crie hooks por domínio: `useProfile`, `useTransactions`, `useBudgets`, `useCategories`, `useRecurring`.
- Centralize mapeamentos de erros HTTP→mensagens.
- Escreva testes de integração mínimos por chamada crítica (ex.: criação de transação e materialização recorrente simulada com MSW).

---

## Anexos rápidos

- Swagger: http://localhost:8000/docs
- Saúde do serviço: `GET /health` → `{ status: 'saudável', service: 'Moneif Maestro API' }`

Se algo divergir, consulte o código fonte das rotas em `app/api/` e os schemas em `app/schemas/` — estes são a fonte da verdade do contrato.
