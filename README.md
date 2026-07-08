# VastraHub

Enterprise-grade e-commerce platform for the Indian clothing market.

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Frontend      | Next.js 15 (App Router)               |
| Backend       | Fastify v5                            |
| Database      | MongoDB (Mongoose ODM)                |
| Auth          | Better-Auth                           |
| Media Storage | Cloudflare R2                         |
| Monorepo      | Turborepo + pnpm Workspaces           |
| Language      | TypeScript 5 (strict mode)            |
| Validation    | @sinclair/typebox                     |

## Prerequisites

- **Node.js** ≥ 20.0.0 ([download](https://nodejs.org/))
- **pnpm** ≥ 9.0.0 — install via `corepack enable && corepack prepare pnpm@9.15.4 --activate`

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vastrahub.git
cd vastrahub

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start all services in development mode
pnpm dev
```

## Project Structure

```
vastrahub/
├── apps/
│   ├── web/                  # Next.js 15 storefront & admin
│   └── api/                  # Fastify v5 REST API
├── packages/
│   └── eslint-config/        # Shared ESLint flat config
│   
├── turbo.json                # Turborepo task pipeline
├── pnpm-workspace.yaml       # pnpm workspace config
├── tsconfig.base.json        # Shared TypeScript config
├── .env.example              # Environment variable template
├── package.json              # Root package.json
```

### Shared Packages

- **`@vastrahub/eslint-config`** — Shared ESLint flat configuration

## Available Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | Start all apps in development mode       |
| `pnpm build`        | Build all packages and apps              |
| `pnpm lint`         | Lint all packages and apps               |
| `pnpm type-check`   | Run TypeScript type checking             |
| `pnpm format`       | Format all files with Prettier           |
| `pnpm format:check` | Check formatting without writing changes |

## Key Design Decisions

- **Paise-based pricing** — All monetary values are stored as integers in paise (1/100 of ₹) to avoid floating-point errors
- **Variant-based media** — Product images/videos are organized by variant groups via `variantMedia[]`, not flat image arrays
- **State machines** — Order and payment status transitions are enforced via explicit transition maps
- **TypeBox validation** — Schemas are shared between Fastify backend (native TypeBox support) and Next.js frontend

## License

MIT
