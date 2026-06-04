# loyalty-bff-customer

Experience-oriented BFF for the **customer** side of the loyalty platform.

This service exists to keep the frontend focused on UX while isolating it from core-level contracts and backend composition details.

The current minimum slice also exposes mock storefront endpoints so the frontend can move on catalog-oriented flows without waiting for a dedicated commerce backend.

Part of the ecosystem:

- `loyalty-web` → customer-facing frontend in **Next.js**
- `loyalty-bff-customer` → experience-oriented BFF in **NestJS**
- `loyalty-core-customer` → technical core service in **Go + Postgres**

```text
Next.js web → NestJS BFF → Go core service + Postgres traces
```

---

## What this service is responsible for

`loyalty-bff-customer` adapts backend behavior into frontend-ready payloads.

It is responsible for:

- exposing customer-facing payloads for home, profile summary, and wallet
- orchestrating the journey stages for enrollment, password change, and login
- managing traceability by stage id
- translating core integration status into something useful for the UI
- keeping the web layer decoupled from core-specific payload shapes

---

## Journey orchestration implemented

This BFF currently supports:

```text
enrollment → password change → login
```

What happens in practice:

1. normalize incoming customer data when needed
2. generate stage-specific identifiers
3. prepare the minimal payload for the core
4. reuse technical context between stages
5. expose traceability endpoints so the UI can inspect the full journey

Identifiers used:

- `transactionId` for enrollment
- `requestId` for password change
- `loginId` for login

Reusable technical context:

- `customerEmailHash`

---

## Endpoints

### Infra
- `GET /api/health`
- `GET /api/ready`

### Customer experience
- `GET /api/v1/customer/home`
- `GET /api/v1/customer/profile-summary`
- `GET /api/v1/customer/wallet`

### Storefront mock slice
- `GET /api/v1/storefront/home`
- `GET /api/v1/storefront/categories`
- `GET /api/v1/storefront/products`
- `GET /api/v1/storefront/products?categoryId=electronics`
- `GET /api/v1/storefront/products/:productId`
- `POST /api/v1/storefront/cart/quote`

### Journey orchestration
- `POST /api/v1/customer/enrollment`
- `GET /api/v1/customer/enrollment-traces`
- `GET /api/v1/customer/enrollment-traces/:transactionId`
- `POST /api/v1/customer/password-change`
- `GET /api/v1/customer/password-change-traces/:requestId`
- `POST /api/v1/customer/login`
- `GET /api/v1/customer/login-traces/:loginId`

---

## Technical highlights

- **NestJS modular structure**
- **BFF pattern** by experience, not CRUD
- **journey-aware orchestration** across 3 stages
- **core handoff integration** for technical validation
- **degraded behavior support** when the core is unavailable
- **customer snapshot propagation** toward the authenticated frontend flow

---

## Current integration model

Today this service uses:

- controlled mocks for home/profile/wallet payloads
- real integration with `loyalty-core-customer` for journey handoff and lookup

This is intentional: it keeps the portfolio slice realistic enough to demonstrate architecture and traceability without pretending the full domain is already implemented.

---

## Related repositories

- `loyalty-web` → presentation layer that consumes this BFF
- `loyalty-core-customer` → technical core service used for journey handoff and trace lookup

This repo is intentionally centered on orchestration, not on full domain ownership.

---

## Environment

Create the local env file:

```bash
cp .env.example .env
```

Main variables:

- `PORT=3002`
- `CORE_CUSTOMER_BASE_URL=http://localhost:3001`

---

## Run locally

```bash
npm install
npm run start:dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

---

## Validation status

Latest validated status:

- `npm test` ✅
- `npm run test:e2e` ✅
- `npm run build` ✅

Existing tests already cover:

- happy path for enrollment → password change → login
- error when enrollment trace is missing
- error when password change trace is missing
- degraded behavior when the core is unavailable
- storefront home/products/product detail/cart quote mock slice

---

## Architecture notes

This service follows the project decision to use:

- BFF pattern
- modular layered architecture
- payloads designed by experience
- core integration kept behind client/service boundaries

Related docs:

- `../docs/architecture/architecture-decision.md`
- `../docs/architecture/customer-experience-map.md`
- `../docs/architecture/core-customer-contract.md`

Note: broader ecosystem/case-study docs currently live outside this repo and are not duplicated here yet.

---

## What I would improve next

1. replace remaining controlled mocks with a more explicit integration source
2. extend test coverage around DTO validation and error mapping
3. separate journey orchestration concerns even further if the slice grows
4. introduce per-experience observability/metrics hooks
5. prepare this repo for standalone public publication
