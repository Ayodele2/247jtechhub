
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
  status?: boolean;
  logo?: string;
}

export interface PaybetaDataPackage {
  code: string;
  description: string;
  price: string;
}

export interface PaybetaTransactionResult {
  httpStatus: number;
  body: unknown;
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

  // Catalogue requests that require a successful response.
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'Paybeta base URL is not configured.',
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl.replace(/\/+$/, '')}${path}`,
        {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        },
      );
    } catch {
      throw new BadGatewayException(
        'Unable to connect to Paybeta.',
      );
    }

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

  // Purchase and transaction-query requests.
  // Preserve the HTTP status and raw response so the VTU service
  // can distinguish confirmed outcomes from uncertain outcomes.
  private async requestTransaction(
    path: string,
    body: Record<string, unknown>,
  ): Promise<PaybetaTransactionResult> {
    if (!this.baseUrl) {
      throw new InternalServerErrorException(
        'Paybeta base URL is not configured.',
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl.replace(/\/+$/, '')}${path}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(body),
        },
      );
    } catch {
      // A network error does not prove that Paybeta did not
      // receive or process the transaction.
      return {
        httpStatus: 0,
        body: null,
      };
    }

    let responseBody: unknown = null;

    try {
      responseBody = await response.json();
    } catch {
      // Preserve the HTTP status even if the response is invalid.
    }

    return {
      httpStatus: response.status,
      body: responseBody,
    };
  }

  // Get airtime providers.
  async getAirtimeProviders(): Promise<PaybetaProvider[]> {
    return this.request<PaybetaProvider[]>(
      '/v2/airtime/providers',
    );
  }

  // Get data providers.
  async getDataProviders(): Promise<PaybetaProvider[]> {
    return this.request<PaybetaProvider[]>(
      '/v2/data-bundle/providers',
    );
  }

  // Get available data bundles for a network.
  async getDataBundles(
    service: string,
  ): Promise<{ packages: PaybetaDataPackage[] }> {
    return this.request<{ packages: PaybetaDataPackage[] }>(
      `/v2/data-bundle/list?service=${encodeURIComponent(service)}`,
    );
  }

  // Get available Cable TV providers.
async getCableProviders(): Promise<PaybetaProvider[]> {
  return this.request<PaybetaProvider[]>(
    '/v2/cable/providers',
  );
}


  // Get available Education providers.
  async getEducationProviders(): Promise<PaybetaProvider[]> {
    return this.request<PaybetaProvider[]>(
      '/v2/education/providers',
    );
  }


  // Get available examination products for an Education provider.
  async getEducationExamTypes(service: string): Promise<unknown> {
    return this.request<unknown>(
      '/v2/education/list',
      {
        method: 'POST',
        body: JSON.stringify({ service }),
      },
    );
  }


  
// Get available bouquets for a Cable TV provider.
async getCableBouquets(
  service: string,
): Promise<{ packages: PaybetaDataPackage[] }> {
  return this.request<{ packages: PaybetaDataPackage[] }>(
    '/v2/cable/bouquet',
    {
      method: 'POST',
      body: JSON.stringify({ service }),
    },
  );
}

// Validate a Cable TV smart card / IUC number.
async validateCableAccount(
  service: string,
  smartCardNumber: string,
): Promise<unknown> {
  return this.request<unknown>(
    '/v2/cable/validate',
    {
      method: 'POST',
      body: JSON.stringify({
        service,
        smartCardNumber,
      }),
    },
  );
}

  // Get Paybeta wallet balance.
  async getWalletBalance(): Promise<unknown> {
    return this.request<unknown>('/v2/wallet/balance');
  }

  // Submit an airtime purchase.
  async purchaseAirtime(input: {
    service: string;
    phoneNumber: string;
    amount: number;
    reference: string;
  }): Promise<PaybetaTransactionResult> {
    return this.requestTransaction(
      '/v2/airtime/purchase',
      input,
    );
  }

  // Submit a data bundle purchase.
  async purchaseData(input: {
    service: string;
    phoneNumber: string;
    amount: number;
    code: string;
    reference: string;
  }): Promise<PaybetaTransactionResult> {
    return this.requestTransaction(
      '/v2/data-bundle/purchase',
      input,
    );
  }

  // Query an existing transaction by its reference.
  async queryTransaction(
    reference: string,
  ): Promise<PaybetaTransactionResult> {
    return this.requestTransaction(
      '/v2/transaction/query',
      { reference },
    );
  }
}
