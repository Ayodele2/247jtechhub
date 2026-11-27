
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaystackWebhookController } from './paystack-webhook.controller';

describe('PaystackWebhookController', () => {
  let controller: PaystackWebhookController;

  const paystackService = {
    verifyWebhookSignature: jest.fn(),
  };

  const walletService = {
    processPaystackWebhook: jest.fn(),
  };

  const createRequest = (rawBody?: Buffer) =>
    ({
      rawBody,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new PaystackWebhookController(
      paystackService as any,
      walletService as any,
    );
  });

  it('rejects requests with an invalid signature', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      controller.handleWebhook(
        createRequest(Buffer.from('{}')),
        'invalid-signature',
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(walletService.processPaystackWebhook).not.toHaveBeenCalled();
  });

  it('ignores valid events that are not charge.success', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);

    const result = await controller.handleWebhook(
      createRequest(Buffer.from('{}')),
      'valid-signature',
      { event: 'transfer.success', data: {} },
    );

    expect(result).toEqual({
      message: 'Webhook event ignored.',
    });

    expect(walletService.processPaystackWebhook).not.toHaveBeenCalled();
  });

  it('processes a valid charge.success event', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);
    walletService.processPaystackWebhook.mockResolvedValue({
      status: 'successful',
      reference: 'test-reference',
    });

    const result = await controller.handleWebhook(
      createRequest(Buffer.from('{}')),
      'valid-signature',
      {
        event: 'charge.success',
        data: {
          reference: 'test-reference',
        },
      },
    );

    expect(walletService.processPaystackWebhook).toHaveBeenCalledWith(
      'test-reference',
    );

    expect(result).toEqual({
      status: 'successful',
      reference: 'test-reference',
    });
  });

  it('rejects charge.success events without a payment reference', async () => {
    paystackService.verifyWebhookSignature.mockReturnValue(true);

    await expect(
      controller.handleWebhook(
        createRequest(Buffer.from('{}')),
        'valid-signature',
        {
          event: 'charge.success',
          data: {},
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(walletService.processPaystackWebhook).not.toHaveBeenCalled();
  });
});
