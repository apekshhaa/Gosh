<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/87729507-06df-4f93-8449-79c0f12ece53

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Marketplace API foundation (development)

The storefront loads approved marketplace listings from the API and keeps the existing static GOSH archive visible as a fallback. Seller listings are merged into the current product views without changing their layout. The API runs separately on port `4000`; Vite runs on port `3000`. The browser API base defaults to `http://localhost:4000/api/v1` and can be changed with the public `VITE_API_BASE_URL` setting. The server only accepts browser write requests whose `Origin` exactly matches `CLIENT_ORIGIN`; cookie authentication uses `credentials: include`, an HTTP-only SameSite=Strict cookie, and secure cookies in production. Deploy the frontend and API on the same site (although they may use different subdomains) for this strict-cookie setup; a cross-site deployment would require a separately reviewed cookie and CSRF configuration.

### Install

```powershell
npm install
npm --prefix server install
Copy-Item server/.env.example server/.env
```

Set `JWT_SECRET` in `server/.env` to a random value of at least 32 characters. For example:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep this file on the server side. Do not add API secrets to Vite variables such as `VITE_*`.

### Start MongoDB locally

Install MongoDB Community Server and make `mongod` available on PATH. In a separate PowerShell window, start a local-only development database:

```powershell
New-Item -ItemType Directory -Force .data/mongo | Out-Null
mongod --dbpath .data/mongo --bind_ip 127.0.0.1 --port 27017
```

The sample `MONGODB_URI` and `MONGODB_TEST_URI` point at that local MongoDB instance. The test URI uses a separate database ending in `_test`; the test suite refuses any test database that does not use that suffix and clears test collections between cases.

### Run the app and tests

With MongoDB running and `server/.env` configured:

```powershell
npm run dev:all
```

This starts the storefront at `http://localhost:3000` and the API at `http://localhost:4000`. To run them separately, use `npm run dev` and `npm run dev:server`. Check the API at `http://localhost:4000/api/v1/health`.
If Vite reports that port 3000 is occupied and selects 3001, set `CLIENT_ORIGIN=http://localhost:3001` in `server/.env` and restart the backend so credentialed browser requests match the allowed origin.

Run backend integration tests against the configured test database:

```powershell
npm --prefix server test
```

### Seller applications and admin review

The API provides these authenticated endpoints:

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/v1/seller/apply` | Signed-in buyer; submits display name, legal name, address, and `agreementAccepted: true` |
| `GET` | `/api/v1/seller/me` | Signed-in applicant; reads their own application and decision status |
| `GET` | `/api/v1/admin/sellers?status=pending&page=1&limit=25` | Admin; paginated application review list |
| `POST` | `/api/v1/admin/sellers/:id/approve` | Admin; approves a pending application and promotes its account to seller |
| `POST` | `/api/v1/admin/sellers/:id/reject` | Admin; rejects a pending application with `{ "reason": "..." }` |
| `GET` | `/api/v1/seller/products/:id` | Approved seller who owns the product |
| `GET` | `/api/v1/seller/products?status=pending_review&page=1&limit=25` | Approved seller; own listings only |
| `POST` | `/api/v1/seller/products` | Approved seller; creates a pending listing |
| `PATCH` | `/api/v1/seller/products/:id` | Approved owner; edits and resubmits for review |
| `DELETE` | `/api/v1/seller/products/:id` | Approved owner; archives the listing |
| `POST` | `/api/v1/seller/products/images` | Approved seller; accepts `{ "image": "data:image/jpeg;base64,..." }` |
| `GET` | `/api/v1/products?page=1&limit=24&q=shirt&category=tops&size=M&condition=excellent&minPricePaise=10000&maxPricePaise=250000` | Public, approved and available listings only |
| `GET` | `/api/v1/products/:id` | Public approved listing details; hidden or unavailable items return 404 |
| `GET` | `/api/v1/admin/products?status=pending_review&page=1&limit=25` | Admin moderation queue |
| `POST` | `/api/v1/admin/products/:id/approve` | Admin; requires `{ "reason": "..." }` |
| `POST` | `/api/v1/admin/products/:id/reject` | Admin; requires `{ "reason": "..." }` |

Listing creation accepts `title`, `description`, `category` (department: `womens`, `mens`, `children`, or `accessories`), `subcategory` (such as `tops`, `skirts`, or `dresses`), optional `brand`, `size`, `condition` (`pristine`, `excellent`, `very_good`, or `good`), `pricePaise` (positive integer), optional `imageUrls`, and optional positive integer `inventory` (defaults to one). For development, upload image data through the image endpoint and use its returned `imageUrl`; image files are signature checked and stored under `server/uploads/<seller-id>/` with generated names. Listing updates accept only images uploaded by that seller. Local image storage is intentionally disabled in production (`503`) until a production image-storage provider is configured. The API does not accept client file paths. Editing an approved listing sends it back to `pending_review`; sellers cannot set moderation status or review fields. Admin approval and rejection both require a reason and record the reviewer and decision timestamp; rejection reasons remain available on the seller's listing.

The shop, homepage edit, and women's collection use the combined API listings and the original static catalog. If the API is unavailable, the collection view shows the original archive and provides a retry action. Product detail URLs for API listings use their MongoDB ids; static product routes continue working. The About page links to the `/seller` workspace, where users can sign in, see their application status, and approved sellers can submit and archive listings. New seller applications still go through the documented GOSH application process so the current seller terms can be presented before acceptance. The existing cart and wishlist remain browser-local conveniences and do not represent checkout or payment functionality.

The server records the configured `SELLER_AGREEMENT_VERSION` and acceptance time; callers cannot set the application status, user role, reviewer, or agreement version. Pending, approved, and suspended applications cannot be duplicated. Rejected applicants can submit a fresh application. Admin approval grants marketplace seller access only; it does not verify legal identity or replace any required identity, tax, or payment-provider checks. Do not launch applications until the actual agreement text for the configured version has been prepared and reviewed.

### Orders and inventory foundation

Order creation is available to authenticated buyer accounts. It accepts only product IDs, quantities, and optional selected sizes; all prices and totals are read from approved, available database listings. A request must include an `Idempotency-Key` header (8–128 letters, digits, `_`, `.`, or `-`). An order can contain one seller's products only. Item snapshots and paise totals are fixed at creation. Shipping, discount, and tax amounts are explicit and currently zero. Orders start with `paymentStatus: unpaid`; there is no payment collection or confirmation flow.

The local MongoDB used in development is standalone (`setName` was absent from the MongoDB `hello` response), so multi-document transactions are not supported. Stock is conditionally decremented with atomic MongoDB updates and restored if ordinary order persistence fails. This prevents overselling under concurrent requests. A process or machine failure between stock decrement and order persistence can leave inventory reserved; production deployments should use a replica set and a transaction-backed reservation workflow before relying on orders operationally.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/v1/orders` | Buyer; requires `Idempotency-Key`; accepts `{ "items": [{ "productId": "...", "quantity": 1, "selectedSize": "M" }] }` |
| `GET` | `/api/v1/orders/mine?page=1&limit=25` | Buyer; own paginated order history |
| `GET` | `/api/v1/orders/mine/:id` | Buyer; own order detail |
| `GET` | `/api/v1/orders/seller?page=1&limit=25` | Approved seller; orders for their listings only |
| `PATCH` | `/api/v1/orders/seller/:id/status` | Owning approved seller; valid next fulfillment status only (`processing`, `shipped`, `delivered`) |
| `GET` | `/api/v1/orders/admin?page=1&limit=25&status=pending_fulfillment` | Admin; order oversight list |
| `PATCH` | `/api/v1/orders/admin/:id/status` | Admin; valid forward fulfillment transition with a required audit reason; cannot set payment status |

The storefront adds `/orders` and `/orders/:id` for buyer order history and detail. Seller Studio displays only that seller's orders and offers sequential fulfillment updates. Existing local cart, WhatsApp inquiry, static catalog, and wishlist remain unchanged; they do not submit an order or collect payment.

### Payment and commission foundation (not live)

The provider assessment is in [`docs/PAYMENT_PROVIDER_ASSESSMENT.md`](docs/PAYMENT_PROVIDER_ASSESSMENT.md). Cashfree Easy Split is the conditional recommendation, subject to merchant eligibility, legal review, seller KYC/onboarding, provider approval, and written confirmation of the permitted funds flow and settlement timing. The backend contains a sandbox-only Cashfree adapter for session creation and provider-side payment/order lookup, but sandbox credentials are not configured and the integration has not been verified against a Cashfree sandbox account. Payment initiation is disabled by default and fails closed with HTTP 503 unless all sandbox settings are explicitly configured. No frontend claims payment is available, and no payment is marked paid except after webhook signature verification and matching provider-side confirmation.

The commission snapshot applies 20% to `itemSubtotalPaise - discountsPaise`, rounded to the nearest paise with exact half-paise ties rounded up. The seller share is the remaining eligible item subtotal (80%); shipping and taxes are currently zero and outside that split. Provider collection/split fees and their GST are assigned to the platform in the proposed policy and do not reduce the seller share. This policy requires provider contract and seller-terms approval. The order stores the rate, eligible basis, commission, and seller share immutably for reconciliation. Refund allocation, provider-confirmed seller settlements, vendor onboarding, and their event ingestion are not implemented; there is no internal wallet and no escrow representation.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/v1/orders/:id/payment-attempts` | Buyer who owns the order; requires `Idempotency-Key`; sandbox adapter only, disabled unless explicitly configured |
| `POST` | `/api/v1/payments/webhooks/cashfree` | Provider callback; raw-body HMAC signature required; only matches an existing payment attempt |

Payment states are separate from fulfillment (`unpaid`, `pending`, `authorized`, `paid`, `failed`, `expired`, `partially_refunded`, `refunded`). Sellers and admins cannot advance fulfillment unless the order is verified as paid; they cannot set payment status. Tests use locally generated HMAC fixtures and do not count as provider sandbox verification. Set `PAYMENT_PROVIDER=cashfree`, `CASHFREE_ENVIRONMENT=sandbox`, `CASHFREE_SANDBOX_ENABLED=true`, credentials, and `CASHFREE_NOTIFY_URL` only in the server environment after sandbox access is available; never use `VITE_` variables for these values. Live payment is not implemented or enabled. Refund initiation and provider settlement-event ingestion are not implemented; reconciliation lists captured-payment events but does not claim seller settlement.

Inventory reservations and order persistence now run in a MongoDB transaction, with an expiry worker that reconciles pending Cashfree sandbox orders before releasing stock and an idempotent transaction-backed buyer cancellation path for eligible unpaid orders. The current local MongoDB is standalone and cannot provide multi-document transactions: order creation and recovery therefore fail closed, and transaction-backed order tests cannot pass on this topology. The worker deliberately keeps reservations when provider state is ambiguous. Use a MongoDB replica set and run the full transaction test suite before relying on this behavior. Live sales remain disabled; production recovery, payment, refund, settlement, backup, monitoring, and operational procedures are not yet verified or complete.

For the local tests, run MongoDB using the instructions above, then set the test database URI and run Vitest:

```powershell
$env:MONGODB_TEST_URI = 'mongodb://127.0.0.1:27017/gosh_marketplace_test'
npm --prefix server test
Remove-Item Env:MONGODB_TEST_URI
```

### Provision the first administrator

There is no public admin-registration endpoint. A trusted operator must build the server, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 16 characters in the server process environment, then run the confirmed one-time command below. The script refuses to run without `--confirm`, refuses an existing admin account, and never prints credentials. Keep the password out of source files and shell history; use an approved secret manager or secure prompt, and clear the temporary environment values immediately afterward.

```powershell
npm --prefix server run build
$env:ADMIN_NAME = 'Marketplace Administrator'
$env:ADMIN_EMAIL = 'admin@example.com'
$securePassword = Read-Host 'Initial admin password (16+ characters)' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm --prefix server run admin:provision -- --confirm
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

Use the real operator email and a unique password at execution time. The sample values above are examples only. The command uses `MONGODB_URI` from `server/.env` and must be run by a trusted operator with access to that environment.

Run `npm run lint`, `npm --prefix server run build`, `npm --prefix server test`, and `npm run build` for type, test, and production-bundle checks. The frontend production build may use Vite's default `dist` directory. Set `COOKIE_SECURE=true`, configure `CLIENT_ORIGIN` and `VITE_API_BASE_URL` for the deployed origins, configure a production image-storage provider, and serve both apps over HTTPS before production use.
