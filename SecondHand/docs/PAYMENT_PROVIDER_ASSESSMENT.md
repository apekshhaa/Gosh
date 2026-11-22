# Payment provider assessment (23 October 2026)

## Recommendation: Cashfree Easy Split, subject to approval

Cashfree Easy Split is the closest documented fit for GOSH's India/INR, one-seller-per-order model. Its official documentation covers payment collection, vendor onboarding, order splits, commission deduction, vendor settlements, refund adjustments, reconciliation, and sandbox simulation. It couples Easy Split to Cashfree Payment Gateway, so it is not a portable settlement layer. The pricing page currently publishes an Easy Split platform fee of 0.20%–0.25% per order value, in addition to normal payment-gateway collection charges. Merchant-specific pricing and applicable GST must be confirmed in writing.

Cashfree's vendor API requires vendor KYC and settlement details (including bank or UPI details); GOSH does not currently have a secure seller payout onboarding flow or provider vendor IDs. Vendor creation and settlement therefore remain blocked until GOSH completes provider review and defines a compliant seller onboarding flow.

## Alternatives reviewed

| Provider | Marketplace capability | Public fees / settlement | Refund and onboarding considerations |
| --- | --- | --- | --- |
| Cashfree Easy Split | Native vendors, order split, commission, vendor reconciliation and settlement APIs | 0.20%–0.25% Easy Split platform fee plus normal PG charges. Vendor schedule is configurable; actual schedule is account-specific. | Refunds can specify split adjustments, including debit/adjustment of vendor balance. Easy Split requires Cashfree PG and vendor KYC details. Sandbox has an Easy Split enablement/simulation API. |
| Razorpay Route | Linked accounts, transfers, reversals, scheduled or held transfers and Route webhooks | Public Route page advertises a transfer add-on in the 0.10%–0.25% range depending on plan/offer; underlying PG charges and GST apply. Exact commercial terms require a quote. | Linked-account onboarding and linked-account refunds are supported; Route access and vendor eligibility are account-approved. Its transfer controls are flexible, but product and pricing terms need a business-specific quote. |
| PayU Split Settlements | Parent/child merchant aggregator setup; percentage or absolute split during or after payment; release-settlement API | No reliable public marketplace tariff found; obtain a written quote. T+0/T+1 examples are schedule-specific, not a guaranteed GOSH settlement SLA. | Split Settlements must be activated for the parent merchant and child merchant accounts configured. Only the parent can initiate split refunds; PayU documents refund limits based on the parent share remaining after split. |

## Eligibility and compliance gates

The existence of a marketplace product does not mean GOSH is approved to use it. Cashfree must review GOSH's legal entity, marketplace model, second-hand clothing category, customer/seller contracts, refund/return policy, seller KYC process, money flow, commission, and settlement schedule. Confirm in writing whether the intended funds flow and any deferral until delivery/return-window expiry are available to GOSH. This recommendation does not call the arrangement escrow and does not assume GOSH may hold customer funds. Review the structure with payments counsel and the provider before accepting live funds.

Provider fees are borne by the platform in this proposed accounting policy unless a signed provider agreement and seller terms explicitly establish another treatment. A payment-gateway fee or its GST must not silently reduce the seller's 95% share; the 5% marketplace commission is charged only to the seller against the discounted product subtotal, and buyers pay no marketplace commission.

## Sandbox path

Create a Cashfree merchant sandbox account and credentials, enable Easy Split using Cashfree's sandbox simulation API, provision sample vendor records, and use the sandbox PG endpoint and Cashfree.js `mode: "sandbox"`. Configure an HTTPS-reachable sandbox webhook URL and the Cashfree webhook secret. Exercise failed, pending, late-success, duplicate, refund and split-settlement events; confirm the final payment through Cashfree's server API and reconcile provider reports. Sandbox APIs and test vendor samples do not imply live merchant or Easy Split approval.

## Sources

- [Cashfree Easy Split overview and sandbox simulation APIs](https://www.cashfree.com/docs/api-reference/payments/latest/split/easy-split-overview)
- [Cashfree Create Vendor API (vendor KYC)](https://www.cashfree.com/docs/api-reference/payments/latest/easy-split/create-vendor)
- [Cashfree Easy Split and current pricing](https://www.cashfree.com/payment-gateway-charges/)
- [Cashfree sandbox Easy Split enablement](https://www.cashfree.com/docs/api-reference/payments/latest/simulation/enable-easy-split-sandbox)
- [Cashfree webhook signature verification](https://www.cashfree.com/devstudio/preview/pg/tools/webhookVerification)
- [Razorpay Route capabilities and pricing](https://razorpay.com/route/)
- [PayU Split Settlement integration](https://docs.payu.in/docs/create-the-split)
- [PayU split-settlement refund limits](https://docs.payu.in/docs/faqs-for-split-settlements)
