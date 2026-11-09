
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

interface PaybetaApiResponse<T> {
  status: string;
  message: string;
  data?: T;
}

export interface PaybetaPurchaseResponse<T = unknown> {
  status: string;
  message: string;
  data?: T;
}

export interface PaybetaProvider {
  name: string;
  category: string;
  slug?: string;
  status: boolean;
  logo?: string;
}

export interface PaybetaDataPackage {
  code: string;
  description: string;
  price: string;
}

@Injectable()
export class PaybetaService {
  private readonly baseUrl = process.env.PAYBETA_BASE_URL;
  private readonly apiKey = process.env.PAYBETA_API_KEY;

  private getHeaders() {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'Paybeta API key is not configured.',
      );
    }

    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'P-API-KEY': this.apiKey,
    };
  }

  // Existing method for catalogue and successful data responses.
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'Paybeta base URL is not configured.',
      );
    }

    const response = await fetch(
      `${this.baseUrl.replace(/\/+$/, '')}${path}`,
      {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      },
    );

    let result: PaybetaApiResponse<T>;

    try {
      result = (await response.json()) as PaybetaApiResponse<T>;
    } catch {
      throw new BadGatewayException(
        'Invalid response received from Paybeta.',
      );
    }

    if (
      !response.ok ||
      result.status !== 'successful' ||
      result.data === undefined
    ) {
      throw new BadGatewayException(
        result.message || 'Paybeta request was unsuccessful.',
      );
    }

    return result.data;
  }

  // New method for purchase and transaction-query responses.
  // It preserves successful, pending, and failed statuses.
  private async requestPurchase<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<PaybetaPurchaseResponse<T>> {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'Paybeta base URL is not configured.',
      );
    }

    const response = await fetch(
      `${this.baseUrl.replace(/\/+$/, '')}${path}`,
      {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      },
    );

    let result: PaybetaPurchaseResponse<T>;

    try {
      result = (await response.json()) as PaybetaPurchaseResponse<T>;
    } catch {
      throw new BadGatewayException(
        'Invalid response received from Paybeta.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        result.message || 'Paybeta request was unsuccessful.',
      );
    }

    return result;
  }

  async getAirtimeProviders(): Promise<PaybetaProvider[]> {
    return this.request<PaybetaProvider[]>(
      '/v2/airtime/providers',
    );
  }

  async getDataProviders(): Promise<PaybetaProvider[]> {
    return this.request<PaybetaProvider[]>(
      '/v2/data-bundle/providers',
    );
  }

  async getDataBundles(
    service: string,
  ): Promise<{ packages: PaybetaDataPackage[] }> {
    return this.request<{ packages: PaybetaDataPackage[] }>(
      `/v2/data-bundle/list?service=${encodeURIComponent(service)}`,
    );
  }

  async getWalletBalance(): Promise<unknown> {
    return this.request<unknown>('/v2/wallet/balance');
  }
}
