import { env } from '../config/env.js';

export type ProviderPaymentRequest = { providerOrderId: string; amountPaise: number; currency: 'INR'; customerId: string; customerPhone: string; returnUrl: string; notifyUrl: string; expiresAt: Date };
export type ProviderPaymentSession = { providerOrderId: string; paymentSessionId: string; expiresAt?: Date };
export type ProviderPaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed';
export type ProviderPayment = { providerOrderId: string; providerPaymentId: string; amountPaise: number; currency: 'INR'; status: ProviderPaymentStatus; occurredAt?: Date };
export type ProviderOrderSnapshot = { providerOrderId: string; amountPaise: number; currency: 'INR'; status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'TERMINATED' | 'TERMINATION_REQUESTED'; payments: ProviderPayment[] };
export type ProviderRefundRequest = { providerPaymentId: string; refundId: string; amountPaise: number; reason: string };
export type ProviderRefund = { providerRefundId: string; status: 'pending' | 'succeeded' | 'failed' };

/** Provider boundary. Production implementations must be enabled only after merchant approval and sandbox verification. */
export interface PaymentProvider {
  readonly name: string;
  createPayment(request: ProviderPaymentRequest, idempotencyKey: string): Promise<ProviderPaymentSession>;
  fetchPayment(providerOrderId: string, providerPaymentId: string): Promise<ProviderPayment>;
  fetchOrder(providerOrderId: string): Promise<ProviderOrderSnapshot>;
  createRefund(request: ProviderRefundRequest, idempotencyKey: string): Promise<ProviderRefund>;
}

export function paymentProviderUnavailable(): boolean {
  return env.PAYMENT_PROVIDER !== 'cashfree' || !env.CASHFREE_SANDBOX_ENABLED || env.CASHFREE_ENVIRONMENT !== 'sandbox' || !env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY || !env.CASHFREE_WEBHOOK_SECRET || !env.CASHFREE_NOTIFY_URL;
}
