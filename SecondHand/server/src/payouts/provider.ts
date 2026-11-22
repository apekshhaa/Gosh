export type PayoutProviderSnapshot = {
  status: 'processing' | 'paid' | 'failed';
  providerReference: string;
  failureReason?: string;
};

export interface PayoutProvider {
  initiate(input: { payoutId: string; sellerId: string; amountPaise: number; idempotencyKey: string }): Promise<PayoutProviderSnapshot>;
  check(providerReference: string): Promise<PayoutProviderSnapshot>;
}

export class DisabledPayoutProvider implements PayoutProvider {
  async initiate(): Promise<PayoutProviderSnapshot> {
    throw new Error('Payout provider is disabled');
  }
  async check(): Promise<PayoutProviderSnapshot> {
    throw new Error('Payout provider is disabled');
  }
}

export class MockPayoutProvider implements PayoutProvider {
  constructor(private readonly outcome: 'processing' | 'paid' | 'failed' = 'processing') {}

  async initiate(input: { payoutId: string; sellerId: string; amountPaise: number; idempotencyKey: string }): Promise<PayoutProviderSnapshot> {
    if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise < 0) throw new RangeError('Invalid mock payout amount');
    return this.outcome === 'failed'
      ? { status: 'failed', providerReference: `mock-failed-${input.payoutId}`, failureReason: 'Mock provider failure fixture' }
      : { status: this.outcome, providerReference: `mock-${input.payoutId}` };
  }

  async check(providerReference: string): Promise<PayoutProviderSnapshot> {
    if (!providerReference.startsWith('mock-')) throw new Error('Unknown mock payout reference');
    return { status: this.outcome, providerReference };
  }
}
