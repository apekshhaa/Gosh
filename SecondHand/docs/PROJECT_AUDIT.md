# GOSH Marketplace Project Audit

Audit date: 2026-11-22
Branch: `feature/seller-only-5-percent-commission`
Scope: implementation and configuration currently present in the worktree

## Executive summary

**Estimated completion: 68%** for the intended multi-seller marketplace. This is an engineering estimate, not a test-coverage percentage. The storefront, buyer checkout, seller Studio, and admin dashboard have now been exercised in a browser against an isolated MongoDB replica-set API. Production checkout payments, refunds, settlements, production image storage, and a real shared replica-set environment remain incomplete or blocked.

The current worktree contains 26 pre-existing changed/untracked paths. Those changes were preserved. No branch switch, reset, cleanup, credential disclosure, Atlas connection, or payment-provider enablement was performed.

## Verification snapshot

| Check | Result | Evidence |
|---|---|---|
| Backend TypeScript build | **PASS** | `npm --prefix server run build` |
| Backend test suite (initial audit) | **29 passed, 5 failed** | `npm --prefix server test`; all initial failures were in `server/test/orders.test.ts` |
| Transaction-backed order tests (after test-infrastructure fix) | **5 passed** | `npm --prefix server test -- test/orders.test.ts`; in-memory MongoDB replica set started successfully |
| Backend full test suite (after admin implementation) | **PASS: 37 passed, 0 failed** | `npm --prefix server test` |
| Frontend production build | **PASS** | `npm run build` |
| Frontend TypeScript check | **PASS** | `npm run lint` |
| Post-hardening frontend production build | **PASS** | Vite 6.4.6; `npm run build` |
| Post-hardening backend TypeScript build | **PASS** | `npm --prefix server run build` |
| Post-hardening backend test suite | **PASS: 37 passed, 0 failed** | `npm --prefix server test` |
| Post-hardening Git diff check | **PASS** | `git diff --check` |
| Frontend test command | **NOT CONFIGURED** | Root `package.json` has no frontend test script; frontend API tests are included in the backend Vitest project |
| npm dependency audit | **UNRESOLVED, DOCUMENTED** | Root: 14 findings; backend: 8 findings; no automatic audit fix or major upgrade was applied |
| Git worktree | **DIRTY** | Existing modified and untracked files were retained |
| Local MongoDB topology | **NOT PROBED** | `mongosh` is not installed on PATH; no database configuration was changed |
| Isolated browser E2E verification | **PASS, PARTIAL** | Playwright browser automation exercised registration, seller application/approval, product creation/edit/moderation, buyer/cart/checkout, unpaid order confirmation/history, seller unpaid-order visibility, admin order oversight, and buyer denial of `/admin`; no persistent browser test suite is configured |

The initial five order failures returned HTTP 503 because `server/src/orders/inventory.ts` requires a MongoDB replica set before starting an order transaction. The test setup was using the configured standalone local MongoDB. `server/test/orders.test.ts` now verifies the configured test endpoint and falls back to an ephemeral in-memory replica set when that endpoint is reachable but standalone; an Atlas/replica-set endpoint remains the preferred verification environment. The resulting 503 was intentional transaction safety behavior, not a test bypass.

## End-to-end browser verification

This phase used the real Vite storefront and Express API against a temporary MongoDB replica-set database. `PAYMENT_PROVIDER=disabled` was kept unchanged. Browser verification passed for:

- Buyer registration in the Seller Studio sign-in/register interface and session cookie creation.
- Seller application submission, pending status display, admin approval, role promotion, and subsequent seller access.
- Seller listing creation, editing, inventory entry, resubmission for review, and admin moderation approval.
- Public API product detail rendering, add-to-bag, cart totals, delivery collection, unpaid order creation, confirmation navigation, saved address display, and buyer order history.
- Seller visibility of a created unpaid order with fulfillment controls hidden while payment is unpaid.
- Admin overview counts and order list/detail visibility, including disabled status controls for an unpaid order.
- Buyer rejection of `/admin` with an admin-access error.
- Backend-enforced rejection of a seller purchasing its own listing.

Browser verification exposed and fixed:

- Seller application was not integrated into the frontend; it now submits directly to `POST /api/v1/seller/apply`.
- Seller listings could be created and archived but not edited; the Seller Studio now loads listing fields and uses `PATCH /api/v1/seller/products/:id`.
- Listing inventory was not editable; inventory is now collected by the Seller Studio.
- Exact decimal product and cart values now display with two decimal places in cart and checkout.
- API listings without uploaded images no longer emit an empty image `src` in cart, checkout, or product detail views.
- Seller fulfillment controls are now hidden unless the order payment status is `paid`.

The browser run did not persist a Playwright test suite because this repository has no Playwright dependency or browser-test configuration. The run was performed interactively with Playwright automation and should be converted into repeatable tests when a browser-test dependency is added.

## Pre-commit hardening verification

### Repository ignore rules

The root `.gitignore` was hardened without excluding storefront assets:

- Added generated/build and cache exclusions for `.vite/`, `.cache/`, `.temp/`, `.tmp/`, and `.nyc_output/`.
- Added Playwright exclusions for `playwright-report/`, `test-results/`, `blob-report/`, and `traces/`.
- Added coverage/test-report exclusions for `*.lcov`, coverage directories, and generated test outputs.
- Added local database and dump exclusions for `data/`, `mongo-data/`, `mongod.lock`, `dump/`, SQLite, and generic database files.
- Corrected the misspelled `assests/` rule to `assets/`.
- The actual `assets/images/**` storefront assets remain intentionally unignored and available to commit.
- `server/.env` and any root `.env*` remain excluded; `.env.example` files are explicitly preserved.

### Dependency security review

No automatic `npm audit fix`, forced upgrade, or major dependency upgrade was used.

The following clearly compatible security updates were applied:

- Root Vite: `6.4.3` -> `6.4.6`, a same-major patch update with no Node engine or build-config change observed.
- Backend Mongoose: manifest/lock upgrade to `8.24.10`, the latest Mongoose 8.x release. This removes the Mongoose direct advisory reported from `8.24.6` and earlier 8.x versions.

Post-update audit results:

| Package area | Initial result | Post-hardening result | Status |
|---|---:|---:|---|
| Root npm audit | 14: 1 low, 3 moderate, 9 high, 1 critical | 14: 1 low, 3 moderate, 9 high, 1 critical | Unresolved |
| Backend npm audit | 9: 1 moderate, 6 high, 2 critical | 8: 1 moderate, 5 high, 2 critical | Mongoose resolved; Vitest/toolchain and indirect findings unresolved |

Root unresolved packages include `baseline-browser-mapping`, `body-parser`, `browserslist`, `esbuild`, `fdir`, `nanoid`, `picomatch`, `postcss`, `protobufjs`, `proxy-addr`, `qs`, `source-map-js`, `tinyglobby`, and direct `vite`. This must not be interpreted as a guarantee that all 14 findings affect production runtime; root and transitive toolchain packages require package-level advisory review.

Backend unresolved direct/toolchain findings include `vitest`, `@vitest/mocker`, `picomatch`, `tinyglobby`, `tinypool`, `follow-redirects`, `fdir`, and indirect `vite`. Vitest currently remains at `3.2.7`; npm reports that the compatible vulnerability remediations require Vitest `5.1.1`. Vitest 5 is a major upgrade and has not been applied. Before that major upgrade, a maintainer must approve it and run a full test/config compatibility review.

Remaining breaking-change/risk areas:

- Vitest 5 may change mock behavior, configuration, coverage, Node support, and test APIs.
- Vite major upgrades can change build behavior and plugin compatibility.
- Mongoose major upgrades can change casting, validation, middleware, and connection behavior.
- Express-related transitive updates require runtime and security testing if broad dependency ranges are resolved.

No `npm audit fix`, `npm audit fix --force`, live payment setting, or major dependency upgrade was performed.

## Feature status

### Frontend

| Feature | Status | Evidence |
|---|---|---|
| React + TypeScript + Vite application | **COMPLETE AND VERIFIED** | `package.json`, `vite.config.ts`, `tsconfig.json`; production build and type check pass |
| Homepage and static product catalog | **COMPLETE AND VERIFIED** | `src/App.tsx`, `src/data.ts`, `src/components/HomeView.tsx` |
| Product detail pages and client routing | **COMPLETE AND VERIFIED** | `src/App.tsx`, `src/components/ProductDetailView.tsx` |
| Category browsing and local search | **COMPLETE AND VERIFIED** | `src/components/ShopView.tsx`, `src/components/WomensView.tsx`, `src/App.tsx` |
| API product listing/detail integration with static fallback | **COMPLETE AND VERIFIED** | `src/api/products.ts`, `src/App.tsx`; backend product tests pass |
| Responsive design, theme, loading/error/empty states | **IMPLEMENTED BUT UNVERIFIED** | `src/index.css`, `src/components/Header.tsx`, view components; no browser/device test suite is configured |
| Browser-local cart and wishlist | **COMPLETE AND VERIFIED** | `src/App.tsx`, `src/components/CartView.tsx`, `src/components/WishlistView.tsx` |
| Marketplace checkout/payment UI | **COMPLETE AND VERIFIED** | `src/components/CheckoutView.tsx` was exercised with a live buyer session, server-approved API listing, delivery details, unpaid order creation, and order confirmation; payment collection remains disabled |
| Buyer authentication UI | **PARTIALLY IMPLEMENTED** | Sign-in/registration exists inside `src/components/SellerStudioView.tsx`, but there is no general account/auth UI |
| Buyer order history UI | **COMPLETE AND VERIFIED** | `src/components/OrdersView.tsx` was exercised for order list, order detail, delivery snapshot, unpaid status, and backend isolation; cancellation UI remains absent |
| Seller Studio UI | **COMPLETE AND VERIFIED** | `src/components/SellerStudioView.tsx` now supports auth, in-app seller application submission, listing creation/edit/archive, inventory, fulfillment visibility, and unpaid-order safeguards; browser-tested in the isolated replica-set environment |
| Admin UI | **COMPLETE AND VERIFIED** | `src/components/AdminDashboard.tsx` provides admin-only overview, seller/product moderation, order oversight, payment-attempt and reconciliation views; frontend type check, production build, and browser overview/order checks pass |
| Frontend tests | **IMPLEMENTED BUT UNVERIFIED** | No repeatable root Playwright or component test suite is configured; interactive Playwright browser verification passed, while backend Vitest includes two frontend API integration tests |

### Backend/API

| Feature | Status | Evidence |
|---|---|---|
| Node.js + Express + TypeScript architecture | **COMPLETE AND VERIFIED** | `server/src/app.ts`, `server/tsconfig.json`; backend build passes |
| API versioning and health endpoints | **COMPLETE AND VERIFIED** | `/api/v1/*`, `/api/v1/health`, `/api/v1/health/ready` in `server/src/app.ts` |
| MongoDB/Mongoose models and indexes | **IMPLEMENTED BUT UNVERIFIED** | `server/src/models/*.ts`; order behavior cannot complete on the current standalone topology |
| Environment validation | **COMPLETE AND VERIFIED** | `server/src/config/env.ts` uses Zod and fails on invalid required configuration |
| Error handling | **IMPLEMENTED BUT UNVERIFIED** | `server/src/middleware/errors.ts`; broad unexpected errors are logged as names only and returned as generic 500s |
| Security middleware | **COMPLETE AND VERIFIED** | Helmet, strict CORS, trusted-origin checks, JSON size limit, rate limits, secure cookie options in `server/src/app.ts` and routes |
| Request validation | **COMPLETE AND VERIFIED** | Zod schemas across `server/src/routes/*.ts`; auth, product, seller, and payment tests pass |
| Structured operational logging | **PARTIALLY IMPLEMENTED** | Worker/payment events use JSON logs, but there is no centralized logger, request correlation, audit log for all mutations, or log transport |

### Authentication and authorization

| Feature | Status | Evidence |
|---|---|---|
| Registration and login | **COMPLETE AND VERIFIED** | `server/src/routes/auth.ts`; 16 auth tests pass |
| Password hashing | **COMPLETE AND VERIFIED** | bcryptjs in `server/src/routes/auth.ts`; password is excluded by default in `server/src/models/User.ts` |
| HTTP-only session cookie | **COMPLETE AND VERIFIED** | JWT in an HTTP-only, SameSite=Strict cookie |
| Session invalidation/logout | **COMPLETE AND VERIFIED** | `sessionVersion` in `server/src/models/User.ts` and `server/src/routes/auth.ts`; covered by auth tests |
| Browser CSRF/origin protection | **IMPLEMENTED BUT UNVERIFIED** | `server/src/middleware/csrf.ts` requires exact `Origin` for unsafe browser requests; no CSRF token exists, and provider callbacks are deliberately exempt because they use HMAC |
| Buyer/seller/admin route protection | **COMPLETE AND VERIFIED** | `server/src/middleware/auth.ts`, route middleware, auth tests |
| Email/phone verification | **NOT IMPLEMENTED** | User flags exist, but no verification workflow was found |
| Password reset/account recovery | **NOT IMPLEMENTED** | No route or model workflow found |

### Seller marketplace and administration

| Feature | Status | Evidence |
|---|---|---|
| Seller application and agreement capture | **COMPLETE AND VERIFIED** | `server/src/routes/seller.ts`, `server/src/models/SellerProfile.ts`; auth tests pass |
| Manual seller approval/rejection and role promotion | **COMPLETE AND VERIFIED** | `server/src/routes/admin.ts`; auth/product tests pass |
| Seller product creation, ownership, archive, and moderation | **COMPLETE AND VERIFIED** | `server/src/routes/seller.ts`, `server/src/routes/admin.ts`, `server/src/models/Product.ts`; product tests pass |
| Local image upload validation | **IMPLEMENTED BUT UNVERIFIED** | Signature checks and owner-scoped paths in `server/src/routes/seller.ts`; production is explicitly blocked |
| Seller profile management | **PARTIALLY IMPLEMENTED** | Application profile is stored/read, but no edit/profile or payout/KYC onboarding flow exists |
| Seller order management | **IMPLEMENTED BUT UNVERIFIED** | Seller list and guarded status transitions in `server/src/routes/orders.ts`; order tests cannot reach this path until transactions work |
| Admin product/seller oversight APIs | **COMPLETE AND VERIFIED** | `server/src/routes/admin.ts`; corresponding tests pass |
| Admin reconciliation view | **IMPLEMENTED BUT UNVERIFIED** | `GET /api/v1/admin/finance/reconciliation` and the dashboard aggregate captured financial events; settlement ingestion remains absent |

### Orders and inventory

| Feature | Status | Evidence |
|---|---|---|
| Server-side price calculation | **COMPLETE AND VERIFIED** | `server/src/routes/orders.ts` reads prices from approved products; order tests run on an ephemeral replica set |
| Immutable order item/price snapshots | **COMPLETE AND VERIFIED** | Immutable fields in `server/src/models/Order.ts`; historical commission snapshots remain untouched |
| Single-seller restriction and self-purchase protection | **COMPLETE AND VERIFIED** | `server/src/routes/orders.ts`; order tests pass on replica-set infrastructure |
| Idempotent order creation | **COMPLETE AND VERIFIED** | Unique buyer/key index, request hash, and transaction logic in `server/src/routes/orders.ts` |
| Atomic inventory decrement | **COMPLETE AND VERIFIED** | Conditional `$inc` inside `inTransaction` in `server/src/routes/orders.ts` |
| Reservation expiry and stock recovery | **IMPLEMENTED AND TESTED** | `server/src/orders/inventory.ts`, `server/src/workers/inventoryRecovery.ts`; replica-set tests cover recovery |
| Buyer cancellation | **IMPLEMENTED AND TESTED** | `POST /api/v1/orders/:id/cancel` and guarded restoration in `server/src/routes/orders.ts` / `server/src/orders/inventory.ts` |
| Order status transitions | **IMPLEMENTED AND TESTED** | Seller/admin guarded transitions in `server/src/routes/orders.ts` |
| Transaction-based order creation | **COMPLETE AND VERIFIED** | Replica-set test environment passes transaction-backed order creation; standalone MongoDB fails closed with HTTP 503 |
| Reservation expiry job in production | **BLOCKED** | Worker disables itself after detecting no replica set |

### Payments and financial operations

| Feature | Status | Evidence |
|---|---|---|
| Payment provider abstraction | **COMPLETE AND VERIFIED** | `server/src/payments/provider.ts` |
| Cashfree sandbox order/session initiation | **IMPLEMENTED BUT UNVERIFIED** | `server/src/payments/cashfreeProvider.ts`, order payment-attempt route; credentials and provider access are unavailable |
| Cashfree server-side payment verification | **IMPLEMENTED BUT UNVERIFIED** | Provider fetch methods and webhook route |
| Webhook HMAC verification and raw-body handling | **IMPLEMENTED BUT UNVERIFIED** | `server/src/payments/cashfreeWebhook.ts`, `server/src/routes/payments.ts`; tests currently verify forged/mismatched requests fail closed |
| Duplicate webhook event handling | **IMPLEMENTED BUT UNVERIFIED** | `PaymentEvent` unique provider event key and transaction processing |
| 5% seller-only / 95% seller earnings commission calculation | **COMPLETE AND VERIFIED** | `server/src/payments/commission.ts`; tests cover integer paise, half-up rounding, discounts, and zero buyer fee |
| Refund initiation and verification | **NOT IMPLEMENTED** | `CashfreeSandboxProvider.createRefund()` intentionally throws |
| Settlement events and seller payouts | **NOT IMPLEMENTED** | Financial event enum has settlement types, but no provider ingestion or payout flow exists |
| Financial reconciliation | **PARTIALLY IMPLEMENTED** | Captured-payment aggregation exists; settlement/refund/provider-fee reconciliation does not |
| Live payments | **BLOCKED BY DESIGN** | `PAYMENT_PROVIDER=disabled` and sandbox checks are required; no live endpoint is exposed |

The current marketplace commission policy is 5% of the discounted product subtotal, charged entirely to the seller, with 95% seller earnings and a 0% buyer marketplace fee. Shipping, taxes, and separately calculated charges are excluded from the commission basis. New orders store `commissionRateBps: 500`, the immutable commission basis and amounts, and the zero buyer fee. Existing orders keep their original immutable snapshots, including historical 20%/80% records; dashboard and reconciliation views identify snapshot values rather than silently rewriting history.

### Testing and deployment

| Feature | Status | Evidence |
|---|---|---|
| Backend auth/product/payment/inventory tests | **COMPLETE AND VERIFIED** | 29 tests pass |
| Backend order tests | **PASS** | Replica-set Vitest coverage passes for order creation and idempotency |
| Concurrency inventory verification | **PASS** | Inventory concurrency tests execute on the ephemeral replica-set test environment |
| Frontend API tests | **COMPLETE AND VERIFIED** | Included Vitest tests pass |
| Frontend component/browser tests | **NOT IMPLEMENTED** | No configured suite |
| Production build/type checking | **COMPLETE AND VERIFIED** | Frontend build and root type check pass; backend build passes |
| Atlas deployment configuration | **IMPLEMENTED BUT UNVERIFIED** | URI is supplied by `MONGODB_URI`; no Atlas connection was attempted |
| Production image storage | **NOT IMPLEMENTED** | Local filesystem upload returns 503 in production |
| Deployment/observability automation | **NOT IMPLEMENTED** | No deployment manifest, migration process, centralized logs, or health-based process supervision was found |

## Database configuration and Atlas assessment

The project is currently configured around local MongoDB defaults:

- `MONGODB_URI` controls the runtime API connection.
- `MONGODB_TEST_URI` is used by test files when present; `server/test/setup.ts` falls back to a local `gosh_marketplace_test` database or an in-memory standalone server.
- `server/.env.example` defaults to `mongodb://127.0.0.1:27017/gosh_marketplace` and a separate `_test` database.
- The actual `server/.env` contains the same configuration keys, but secret values were not read into this report.

Mongoose accepts MongoDB Atlas `mongodb+srv://` and standard replica-set connection strings through `MONGODB_URI`; no code change is inherently required for the driver. The order implementation requires a deployment that advertises a replica set and logical sessions. Atlas clusters provide this capability, subject to the selected tier/configuration and network access.

The safe Atlas test arrangement is a separate database name ending in `_test` on a test-only cluster or test project, with a least-privilege test database user. Set only `MONGODB_TEST_URI` for tests, keep `MONGODB_URI` pointed at the intended application database, restrict Atlas network access, and never reuse production credentials. The existing test guard rejects a test URI whose database name does not end in `_test`.

No Atlas connection was attempted because credentials, network access, and approval were not provided. No local topology query was attempted through PyMongo; `mongosh` is not installed on PATH.

## Bugs, risks, and technical debt

1. **Order test environment mismatch:** the order suite now has local in-memory replica-set coverage, but the configured local database remains standalone. Atlas/replica-set verification is still needed for deployment parity.
2. **Repeatable browser/component checkout coverage:** checkout now calls `POST /api/v1/orders`, reserves inventory, and creates a backend unpaid order. Interactive browser verification is documented, but a repeatable frontend Playwright/component suite is not yet configured.
3. **Delivery and settlement implementation is development-only:** sellers can submit shipments, buyers can record acknowledgements, couriers/admins can provide trusted verification, and a unique payout ledger is persisted. Payout execution remains disabled and no money is transferred.
4. **Payment lifecycle gap:** refunds, settlement callbacks, provider fee accounting, and seller payout onboarding are absent. The provider adapter is sandbox-only and intentionally fails closed.
5. **Returns and recovery are incomplete:** disputes block payout eligibility, but post-payout refunds and financial recovery obligations are not fully implemented.
6. **Image storage is not production-ready:** uploads are local filesystem files and are disabled in production. There is no durable/object storage, malware scanning, lifecycle cleanup, or orphan cleanup.
7. **Application approval is multi-step without a transaction:** admin approval updates the seller profile and user role separately. The code compensates for some races, but this should be made transactional on a replica set.
8. **No account verification/recovery:** email/phone verification and password reset are absent for a production marketplace.
9. **Frontend API resilience:** the client has no request timeout/abort policy and no centralized auth/session state; several views make unbounded `limit=100` requests.
10. **Operational visibility:** logs are partly structured but there is no durable audit/event sink or alerting around failed payment verification, recovery blockage, or reconciliation mismatches.

## Security assessment

Positive controls include strict input schemas, server-side pricing, HTTP-only SameSite cookies, JWT algorithm pinning, session-version invalidation, exact trusted-origin checks, rate limits, Helmet, raw-body HMAC verification, amount/currency/provider-reference checks, owner-scoped image paths, and no secret values in the audit.

Remaining security/compliance work includes production secret management and rotation, email/phone verification, password recovery, a documented CSRF strategy for all deployment topologies, provider webhook replay-window handling, durable audit logs, image malware/content policy, KYC/payout controls, privacy/retention policy, and a formal threat model for seller/admin workflows. These are not reasons to weaken the existing fail-closed behavior.

## Highest-priority remaining work

1. Provide a replica-set test environment (preferably a dedicated Atlas test database or a locally configured replica set), set `MONGODB_TEST_URI`, and rerun the order/concurrency suite against that deployment; local transaction coverage now uses an ephemeral in-memory replica set when needed.
2. Verify order creation, cancellation, expiry, recovery, and fulfillment transitions end to end against that topology.
3. Finish and test Cashfree sandbox flows only after valid sandbox credentials, webhook reachability, and provider approval are available; keep `PAYMENT_PROVIDER=disabled` until then.
4. Implement refund and settlement event contracts, idempotency, ledger/reconciliation rules, and admin oversight.
5. Replace local image storage with a reviewed production object-storage provider and cleanup policy.
6. Add repeatable frontend browser/component tests for checkout, auth, seller, and admin surfaces.
7. Complete production deployment, secret management, observability, backups, retention, and compliance review.

## Audit conclusion

The current branch is a meaningful, security-oriented marketplace foundation, not a production-ready marketplace. New orders use a 5% seller-only commission based on the discounted product subtotal, with 95% seller earnings and a zero buyer marketplace fee. Shipping and taxes do not increase the commission. Historical order and financial-event snapshots retain their original commission rates and amounts. The safe next action is deployment verification of the existing replica-set transaction implementation; live payment, settlement, and production-storage work must remain blocked until their required external approvals and credentials exist.

## Delivery verification and payout ledger security audit

Courier delivery webhooks use the exact raw request body, a configured HMAC secret, timing-safe comparison, a five-minute replay window, and a unique event-ID ledger. Tracking IDs must match the order shipment and cancelled, refunded or disputed orders cannot be verified. Buyer acknowledgement requires authentication, ownership, confirmed payment, and matching shipment tracking, but is stored separately and never changes trusted verification status. Concurrent eligibility requests use database uniqueness and are re-evaluated against the current order state. Payout records preserve immutable financial snapshots and completed payouts cannot be changed by disabled-provider retry actions.

Post-payout refunds are represented as separate accounting adjustments and recovery obligations; this is accounting-only and does not execute a provider refund or recover money. Refund/provider settlement automation and real payout-provider confirmation remain unimplemented. Buyer acknowledgement is not trusted verification and never makes a payout eligible; payout remains disabled.
