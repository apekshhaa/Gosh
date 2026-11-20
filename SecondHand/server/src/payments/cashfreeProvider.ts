import { env } from '../config/env.js';
import crypto from 'node:crypto';
import type { PaymentProvider, ProviderOrderSnapshot, ProviderPayment, ProviderPaymentRequest, ProviderPaymentSession, ProviderRefund, ProviderRefundRequest } from './provider.js';

const API_VERSION = '2026-01-01';
const CASHFREE_SANDBOX_API = 'https://sandbox.cashfree.com/pg';

type CashfreeOrderResponse = { order_id: string; order_amount: number; order_currency: string; payment_session_id: string; order_expiry_time?: string };
type CashfreePaymentResponse = { cf_payment_id: string | number; order_id: string; payment_status: string; payment_amount: number; payment_currency: string; payment_time?: string };
type CashfreeOrderStateResponse = { order_id: string; order_amount: number; order_currency: string; order_status: ProviderOrderSnapshot['status'] };

/** Sandbox-only adapter. Live Cashfree endpoints are intentionally unavailable in this application phase. */
export class CashfreeSandboxProvider implements PaymentProvider {
  readonly name = 'cashfree';
  private readonly appId: string;
  private readonly secretKey: string;

  constructor(appId = env.CASHFREE_APP_ID, secretKey = env.CASHFREE_SECRET_KEY) {
    if (!appId || !secretKey) throw new Error('Cashfree sandbox credentials are not configured');
    this.appId = appId;
    this.secretKey = secretKey;
  }

  async createPayment(request: ProviderPaymentRequest, idempotencyKey: string): Promise<ProviderPaymentSession> {
    if (!Number.isSafeInteger(request.amountPaise) || request.amountPaise < 100 || request.currency !== 'INR' || request.expiresAt <= new Date()) throw new Error('Invalid Cashfree payment request');
    const body = {
      order_id: request.providerOrderId,
      order_amount: Number((request.amountPaise / 100).toFixed(2)),
      order_currency: request.currency,
      order_expiry_time: request.expiresAt.toISOString(),
      customer_details: { customer_id: request.customerId, customer_phone: request.customerPhone },
      order_meta: { return_url: request.returnUrl, notify_url: request.notifyUrl },
    };
    const response = await this.request<CashfreeOrderResponse>(`/orders`, { method: 'POST', headers: { 'x-idempotency-key': cashfreeIdempotencyUuid(request.providerOrderId, idempotencyKey) }, body: JSON.stringify(body) });
    const amountPaise = rupeesToPaise(response.order_amount);
    if (response.order_id !== request.providerOrderId || amountPaise !== request.amountPaise || response.order_currency !== request.currency || !response.payment_session_id) {
      throw new Error('Cashfree order response did not match the requested reference, amount, or currency');
    }
    return { providerOrderId: response.order_id, paymentSessionId: response.payment_session_id, ...(response.order_expiry_time ? { expiresAt: new Date(response.order_expiry_time) } : {}) };
  }

  async fetchPayment(providerOrderId: string, providerPaymentId: string): Promise<ProviderPayment> {
    const payments = await this.request<CashfreePaymentResponse[]>(`/orders/${encodeURIComponent(providerOrderId)}/payments`, { method: 'GET' });
    if (!Array.isArray(payments)) throw new Error('Cashfree returned an invalid payments response');
    const payment = payments.find((item) => String(item.cf_payment_id) === providerPaymentId);
    if (!payment || payment.order_id !== providerOrderId || payment.payment_currency !== 'INR') throw new Error('Cashfree payment reference or currency did not match');
    const amountPaise = rupeesToPaise(payment.payment_amount);
    if (amountPaise === null) throw new Error('Cashfree returned an invalid payment amount');
    const status = mapPaymentStatus(payment.payment_status);
    return { providerOrderId: payment.order_id, providerPaymentId: String(payment.cf_payment_id), amountPaise, currency: 'INR', status, ...(payment.payment_time ? { occurredAt: new Date(payment.payment_time) } : {}) };
  }

  async fetchOrder(providerOrderId: string): Promise<ProviderOrderSnapshot> {
    const order = await this.request<CashfreeOrderStateResponse>(`/orders/${encodeURIComponent(providerOrderId)}`, { method: 'GET' });
    const amountPaise = rupeesToPaise(order.order_amount);
    if (order.order_id !== providerOrderId || amountPaise === null || order.order_currency !== 'INR') throw new Error('Cashfree order reference, amount, or currency did not match');
    const rawPayments = await this.request<CashfreePaymentResponse[]>(`/orders/${encodeURIComponent(providerOrderId)}/payments`, { method: 'GET' });
    if (!Array.isArray(rawPayments)) throw new Error('Cashfree returned an invalid payments response');
    const payments = rawPayments.map((payment) => {
      const paymentAmountPaise = rupeesToPaise(payment.payment_amount);
      if (payment.order_id !== providerOrderId || payment.payment_currency !== 'INR' || paymentAmountPaise === null) throw new Error('Cashfree payment reference, amount, or currency did not match');
      return { providerOrderId, providerPaymentId: String(payment.cf_payment_id), amountPaise: paymentAmountPaise, currency: 'INR' as const, status: mapPaymentStatus(payment.payment_status), ...(payment.payment_time ? { occurredAt: new Date(payment.payment_time) } : {}) };
    });
    return { providerOrderId, amountPaise, currency: 'INR', status: order.order_status, payments };
  }

  async createRefund(_request: ProviderRefundRequest, _idempotencyKey: string): Promise<ProviderRefund> {
    throw new Error('Cashfree refunds are disabled until Easy Split refund-share adjustments and reconciliation are configured');
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${CASHFREE_SANDBOX_API}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-api-version': API_VERSION, 'x-client-id': this.appId, 'x-client-secret': this.secretKey, ...init.headers },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Cashfree API request failed with HTTP ${response.status}`);
    try { return await response.json() as T; }
    catch { throw new Error('Cashfree returned invalid JSON'); }
  }
}

function mapPaymentStatus(value: string): ProviderPayment['status'] {
  if (value === 'SUCCESS') return 'paid';
  if (value === 'FAILED' || value === 'USER_DROPPED') return 'failed';
  if (value === 'PENDING') return 'pending';
  if (value === 'AUTHORIZED') return 'authorized';
  throw new Error('Cashfree returned an unsupported payment status');
}

function rupeesToPaise(value: number): number | null {
  const paise = Math.round(value * 100);
  return Number.isFinite(value) && Number.isSafeInteger(paise) && Math.abs(value * 100 - paise) < 0.000001 ? paise : null;
}

function cashfreeIdempotencyUuid(providerOrderId: string, key: string): string {
  const chars = crypto.createHash('sha256').update(`${providerOrderId}:${key}`).digest('hex').slice(0, 32).split('');
  chars[12] = '4';
  chars[16] = ((Number.parseInt(chars[16]!, 16) & 0x3) | 0x8).toString(16);
  const hex = chars.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
