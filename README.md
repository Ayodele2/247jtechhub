# 247 VTU Platform

**A Nigerian virtual top-up platform by 247 Jtech Hub.**

247 VTU Platform is a web application in development for purchasing airtime and mobile data, funding a wallet, and accessing additional digital utility services.

## Current Status

**Phase:** Frontend foundation

The current version includes a responsive landing page and a preliminary service catalogue. Payment processing, user accounts, wallet transactions, and provider integrations have not yet been implemented.

## Planned Features

- User registration and secure authentication
- Wallet funding and transaction history
- Airtime and data purchases
- Electricity bill payments
- WAEC and JAMB services, subject to provider and product verification
- Paystack payment integration
- VTpass service fulfillment
- Administrative dashboard
- Transaction monitoring and failure handling

## Planned Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **UI:** shadcn/ui
- **Backend:** NestJS REST API
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Payments:** Paystack test mode
- **Service fulfillment:** VTpass sandbox, subject to availability
- **Testing:** Jest, Supertest, Playwright
- **Version control:** Git and GitHub

Additional infrastructure, including Redis and BullMQ, will be introduced if justified by the transaction-processing requirements.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Run the frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verify the project

```bash
npm run lint
npm run build
```

## Financial and Security Principles

- Store monetary amounts as integer kobo.
- Verify payment notifications and transactions on the server.
- Maintain an auditable wallet ledger.
- Use database transactions and idempotency controls for financial operations.
- Never treat a payment redirect as proof of successful payment.
- Handle uncertain service-provider outcomes without blindly retrying purchases or charging users twice.
- Keep credentials and API secrets out of source control.
- Test integrations in sandbox or test environments before considering production use.

## Development Approach

The project is being built incrementally. Each milestone should be implemented, tested, documented, and committed before moving to the next.

No live payment or VTU transaction should be assumed operational until its integration and verification tests have been completed.

## Repository

[247jtechhub on GitHub](https://github.com/Ayodele2/247jtechhub)
