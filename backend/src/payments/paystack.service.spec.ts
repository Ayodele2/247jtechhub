
import { createHmac } from 'node:crypto';
import { PaystackService } from './paystack.service';

describe('PaystackService webhook signature verification', () => {
  const testSecret = 'test_paystack_secret_for_unit_tests';
  const rawBody = Buffer.from(
    JSON.stringify({
      event: 'charge.success',
      data: {
        reference: '247VTU_TEST123',
        amount: 10000,
        currency: 'NGN',
      },
    }),
  );

  let service: PaystackService;
  let originalSecret: string | undefined;

  const generateSignature = (
    body: Buffer,
    secret = testSecret,
  ) =>
    createHmac('sha512', secret)
      .update(body)
      .digest('hex');

  beforeEach(() => {
    originalSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = testSecret;
    service = new PaystackService();
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.PAYSTACK_SECRET_KEY;
    } else {
      process.env.PAYSTACK_SECRET_KEY = originalSecret;
    }
  });

  it('accepts a valid Paystack signature', () => {
    const signature = generateSignature(rawBody);

    expect(
      service.verifyWebhookSignature(rawBody, signature),
    ).toBe(true);
  });

  it('rejects an incorrect signature', () => {
    const signature = generateSignature(
      rawBody,
      'incorrect_secret',
    );

    expect(
      service.verifyWebhookSignature(rawBody, signature),
    ).toBe(false);
  });

  it('rejects a malformed signature', () => {
    expect(
      service.verifyWebhookSignature(rawBody, 'invalid-signature'),
    ).toBe(false);
  });

  it('rejects a signature with the wrong length', () => {
    expect(
      service.verifyWebhookSignature(rawBody, 'abcd1234'),
    ).toBe(false);
  });

  it('rejects requests when the Paystack secret is missing', () => {
    delete process.env.PAYSTACK_SECRET_KEY;

    const serviceWithoutSecret = new PaystackService();

    expect(
      serviceWithoutSecret.verifyWebhookSignature(
        rawBody,
        generateSignature(rawBody),
      ),
    ).toBe(false);
  });
});
