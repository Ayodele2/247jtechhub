
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    gateway_response: string;
    paid_at: string | null;
    channel: string;
  };
}

@Injectable()
export class PaystackService {
  private readonly baseUrl =
    process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co';

  private readonly secretKey =
    process.env.PAYSTACK_SECRET_KEY;

  private getHeaders() {
    if (!this.secretKey) {
      throw new InternalServerErrorException(
        'Paystack secret key is not configured.',
      );
    }

    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    callbackUrl: string;
  }) {
    const response = await fetch(
      `${this.baseUrl}/transaction/initialize`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: params.email,
          amount: params.amountKobo,
          reference: params.reference,
          callback_url: params.callbackUrl,
          currency: 'NGN',
        }),
      },
    );

    let result: PaystackInitializeResponse;

    try {
      result =
        (await response.json()) as PaystackInitializeResponse;
    } catch {
      throw new BadGatewayException(
        'Invalid response received from Paystack.',
      );
    }

    if (!response.ok || !result.status || !result.data) {
      throw new BadGatewayException(
        result.message || 'Unable to initialize Paystack payment.',
      );
    }

    return result.data;
  }

  async verifyTransaction(reference: string) {
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );

    let result: PaystackVerifyResponse;

    try {
      result =
        (await response.json()) as PaystackVerifyResponse;
    } catch {
      throw new BadGatewayException(
        'Invalid verification response received from Paystack.',
      );
    }

    if (!response.ok || !result.status || !result.data) {
      throw new BadGatewayException(
        result.message || 'Unable to verify Paystack transaction.',
      );
    }

    return result.data;
  }
}
