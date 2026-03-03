# Nexus Wallet API

Core Backend desenvolvido para um teste técnico, consiste em uma carteira cripto simplificada com suporte a depósitos, swaps, cotação entre tokens e saques.

> **Taxa de swap:** 1.5% cobrada sobre o token de origem.

**Exemplo BRL → BTC:**
| | |
|---|---|
| `amount` | 100.00 BRL — valor a converter |
| `fee` | 1.50 BRL — 1.5% de 100 |
| `totalDeducted` | 101.50 BRL — debitado da carteira |
| `toAmount` | 0.00027896 BTC — valor recebido |

---

## Stack

- **Node.js** v20.19.0
- **NestJS** v11
- **TypeScript**
- **PostgreSQL** + **Prisma** v7.4.2
- **Zod** — Validação de dados
- **Redis** — Cache de cotações
- **JWT** — Autenticação

---

## Como rodar localmente

Projeto foi configurado para rodar localmente, menos o Redis que foi apontado para uma VM particular.
Caso desejar também pode utilizá-la para realizar o teste, ou trocar o valor da variável no `.env` do projeto.

### Instalação

```bash
git clone https://github.com/GabrielMth/nexus-technical-test
cd nexus-wallet
npm install
```

### Variáveis de Ambiente

Foi commitado um `.env.example`, crie um arquivo `.env` na raiz do projeto para rodar localmente.

Os valores do `JWT_SECRET` e `REFRESH_TOKEN_SECRET` podem ser gerados com:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```env
# Prisma
DATABASE_URL="postgresql://postgres:senha@localhost:5432/nexus_wallet?schema=public"

# JWT
JWT_SECRET=
REFRESH_TOKEN_SECRET=
JWT_EXPIRES_IN="3600s"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Redis
REDIS_HOST=localhost       // caso desejar utilizar minha vps aberta 187.33.200.196 , mesma porta.
REDIS_PORT=6379
```

### Banco de dados

```bash
npx prisma migrate dev
npx prisma generate
```

### Rodar o projeto

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

---

## Decisões Técnicas

### NestJS
Escolhi NestJS por já ter experiência com Java/Spring Boot — a arquitetura é muito similar (módulos, injeção de dependência, decorators/annotations/metadados). A transição foi natural e permitiu aplicar os mesmos conceitos de separação de responsabilidade que uso no ecossistema Java, porém com o ganho de performance do Node.js.

### Prisma
Diferente do Hibernate/JPA onde as entidades são classes anotadas, o Prisma usa um schema declarativo que gera tipagem automática. Me lembrou muito o Flyway que utilizo hoje em dia — realiza o versionamento com histórico de alterações.

### Zod
Praticamente igual ao Bean Validation do Java — valida as bordas da aplicação via pipes, equivalente aos `@RequestBody` do Spring. A vantagem é a inferência de tipos TypeScript automática a partir do schema.

### Transações Atômicas
O `$transaction` do Prisma cumpre o mesmo papel do `@Transactional` do Spring — garante que operações como swap (3 ledger entries) sejam atômicas, fazendo rollback automático em caso de falha.

### Modelo de Ledger
Toda alteração de saldo gera um `LedgerEntry` com `balanceBefore` e `balanceAfter`. Isso garante auditabilidade total — o saldo atual pode ser reconstruído a partir das movimentações sem depender de um campo de saldo mutável.

### Tabela Transaction
Agrupa múltiplos `LedgerEntry` em uma única operação lógica. Um swap gera 3 entradas no ledger (SWAP_OUT, SWAP_FEE, SWAP_IN) todas linkadas ao mesmo `transactionId`.

### Redis
Utilizado para cache de cotações da CoinGecko com TTL de 60 segundos, evitando chamadas repetidas à API externa e respeitando os limites do plano gratuito, dessa forma pode realizar somente quando necessário.

### Idempotência no depósito
A tabela `IdempotencyKey` garante que o mesmo depósito não seja processado duas vezes, mesmo que o webhook seja chamado múltiplas vezes com a mesma chave.

### Rate Limiting
Implementado via `@nestjs/throttler` com limite de 30 requests por minuto por IP, protegendo contra abuso dos endpoints.

### CORS 
Não foi implementado CORS por conta que não deu tempo para uma aplicação frontend porém também seria possível...

---

## Estrutura do Banco de Dados

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        String password
        DateTime createdAt
    }

    Wallet {
        String id PK
        String userId FK
        DateTime createdAt
    }

    LedgerEntry {
        String id PK
        String walletId FK
        String transactionId FK
        LedgerType type
        Token token
        Decimal amount
        Decimal balanceBefore
        Decimal balanceAfter
        DateTime createdAt
    }

    Transaction {
        String id PK
        String walletId FK
        TransactionType type
        Token fromToken
        Token toToken
        Decimal amount
        Decimal fee
        DateTime createdAt
    }

    IdempotencyKey {
        String key PK
        String walletId FK
        DateTime createdAt
    }

    User ||--o| Wallet : "has one"
    Wallet ||--o{ LedgerEntry : "has many"
    Wallet ||--o{ Transaction : "has many"
    Wallet ||--o{ IdempotencyKey : "has many"
    Transaction ||--o{ LedgerEntry : "has many"
```

---
## Motivação das Tabelas

**IdempotencyKey:** Garante a idempotência — quando estamos falando de webhook, pode ser que dispare eventos mais de uma vez, vai de quem está recebendo validar.

**User:** Entidade central do sistema. Armazena credenciais de acesso com senha hasheada via bcrypt. Separada da Wallet para seguir o princípio de responsabilidade única — autenticação é uma regra diferente de finanças.

**Wallet:** Separada do User pois tem seu próprio ciclo de vida e relacionamentos com transações, idempotências e etc. Permite suportar múltiplas carteiras por usuário no futuro sem alterar nada — pensado mais em escalabilidade.

**LedgerEntry:** Coração do sistema financeiro. Toda alteração de saldo gera um registro imutável com `balanceBefore` e `balanceAfter`. Inspirado no modelo de ledger contábil — o saldo nunca é um campo mutável, é sempre calculado a partir das movimentações, garantindo auditabilidade total e rastreabilidade de cada centavinho.

**Transaction:** Agrupa múltiplos `LedgerEntry` em uma operação lógica única. Um swap sem essa tabela geraria 3 entradas no ledger sem contexto. Com ela é possível responder "quais foram as transações do usuário?" de forma limpa.


## Endpoints

### Autenticação

#### Registrar usuário
```
POST /users/register
```
**Body:**
```json
{
  "email": "wallet@nexus.com",
  "password": "senha123"
}
```
**Response 201:**
```json
{
  "id": "uuid",
  "email": "wallet@nexus.com",
  "createdAt": "2026-03-03T00:00:00.000Z"
}
```
**Erros:**
- `400` — email inválido, senha com menos de 6 caracteres ou email já cadastrado

---

#### Login
```
POST /users/login
```
**Body:**
```json
{
  "email": "wallet@nexus.com",
  "password": "senha123"
}
```
**Response 200:**
```json
{
  "message": "Login OK!",
  "email": "wallet@nexus.com",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```
**Erros:**
- `401` — usuário não encontrado ou senha incorreta

---

### Carteira

#### Consultar saldos
```
GET /wallet/balance
Authorization: Bearer <token>
```
**Response 200:**
```json
{
  "balances": [
    { "token": "BRL", "balance": "258.50" },
    { "token": "BTC", "balance": "0.00083328" },
    { "token": "ETH", "balance": "0" }
  ]
}
```
**Erros:**
- `404` — carteira não encontrada

---

### Depósito (Webhook)

#### Processar depósito
```
POST /webhooks/deposit
```
> Rota pública — simula notificação de serviço externo, não requer autenticação JWT.

**Body:**
```json
{
  "userId": "uuid-do-usuario",
  "token": "BRL",
  "amount": "100.00",
  "idempotencyKey": "chave-unica-001"
}
```
**Response 200:**
```json
{
  "success": true,
  "token": "BRL",
  "balance": "358.50"
}
```
**Erros:**
- `404` — carteira não encontrada
- `400` — token inválido ou valor inválido
- `409` — depósito já processado (idempotencyKey duplicada)

---

### Swap

#### Cotar swap
```
GET /swap/quote?fromToken=BRL&toToken=BTC&amount=1000
Authorization: Bearer <token>
```
**Response 200:**
```json
{
  "fromToken": "BRL",
  "toToken": "BTC",
  "amount": "1000.00",
  "toAmount": "0.00277421",
  "fee": "15.00",
  "rate": "0.00000277"
}
```

---

#### Executar swap
```
POST /swap/execute
Authorization: Bearer <token>
```
**Body:**
```json
{
  "fromToken": "BRL",
  "toToken": "BTC",
  "amount": "100"
}
```
**Response 200:**
```json
{
  "success": true,
  "fromToken": "BRL",
  "toToken": "BTC",
  "fromAmount": "101.50",
  "toAmount": "0.00027896",
  "fee": "1.50",
  "rate": "0.00000279"
}
```
**Erros:**
- `400` — saldo insuficiente, tokens iguais ou valor inválido
- `503` — CoinGecko ou Redis indisponível

---

### Saque

#### Solicitar saque
```
POST /withdrawals
Authorization: Bearer <token>
```
**Body:**
```json
{
  "token": "BRL",
  "amount": "50"
}
```
**Response 200:**
```json
{
  "success": true,
  "token": "BRL",
  "amount": "50.00",
  "balanceAfter": "5.50"
}
```
**Erros:**
- `400` — saldo insuficiente ou valor inválido
- `404` — carteira não encontrada

---

### Ledger (Extrato)

#### Consultar extrato de movimentações
```
GET /ledger?page=1&limit=10
Authorization: Bearer <token>
```
**Response 200:**
```json
{
  "data": [
    {
      "transactionId": "uuid",
      "type": "SWAP",
      "createdAt": "2026-03-03T17:15:11.373Z",
      "entries": [
        {
          "id": "uuid",
          "type": "SWAP_OUT",
          "token": "BRL",
          "amount": "100",
          "balanceBefore": "360",
          "balanceAfter": "260",
          "createdAt": "2026-03-03T17:15:11.379Z"
        },
        {
          "id": "uuid",
          "type": "SWAP_FEE",
          "token": "BRL",
          "amount": "1.5",
          "balanceBefore": "260",
          "balanceAfter": "258.5",
          "createdAt": "2026-03-03T17:15:11.383Z"
        },
        {
          "id": "uuid",
          "type": "SWAP_IN",
          "token": "BTC",
          "amount": "0.00027896",
          "balanceBefore": "0",
          "balanceAfter": "0.00027896",
          "createdAt": "2026-03-03T17:15:11.390Z"
        }
      ]
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10
}
```
**Erros:**
- `404` — carteira não encontrada
---

### Histórico de Transações

#### Listar transações
```
GET /transactions?page=1&limit=10
Authorization: Bearer <token>
```
**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "SWAP",
      "fromToken": "BRL",
      "toToken": "BTC",
      "amount": "100",
      "fee": "1.5",
      "createdAt": "2026-03-03T17:15:11.373Z"
    },
    {
      "id": "uuid",
      "type": "DEPOSIT",
      "fromToken": "BRL",
      "amount": "100",
      "createdAt": "2026-03-03T16:01:26.459Z"
    },
    {
      "id": "uuid",
      "type": "WITHDRAWAL",
      "fromToken": "BRL",
      "amount": "50",
      "createdAt": "2026-03-03T18:03:01.080Z"
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 10
}
```
**Erros:**
- `404` — carteira não encontrada
---
