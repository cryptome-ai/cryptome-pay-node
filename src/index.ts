/**
 * Cryptome Pay Node.js SDK
 *
 * Official Node.js SDK for Cryptome Pay - Non-custodial cryptocurrency payment gateway.
 *
 * @example
 * ```typescript
 * import CryptomePay from 'cryptomepay';
 *
 * const client = new CryptomePay({
 *   apiKey: 'sk_live_xxx',
 *   apiSecret: 'your_secret'
 * });
 *
 * const payment = await client.createPayment({
 *   orderId: 'ORDER_001',
 *   amount: 100.00,
 *   notifyUrl: 'https://example.com/webhook',
 *   chainType: 'BSC'
 * });
 * ```
 *
 * @packageDocumentation
 */

import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

/** SDK Version */
export const VERSION = '1.0.0';

/** Environment URLs */
export const PRODUCTION_URL = 'https://api.cryptomepay.com/api/v1';
export const SANDBOX_URL = 'https://sandbox.cryptomepay.com/api/v1';
export const STAGING_URL = 'https://staging.cryptomepay.com/api/v1';

/** Supported chain types */
export enum ChainType {
  TRC20 = 'TRC20',
  BSC = 'BSC',
  POLYGON = 'POLYGON',
  ETH = 'ETH',
  ARBITRUM = 'ARBITRUM',
}

/** Payment status codes */
export enum PaymentStatus {
  Pending = 1,
  Paid = 2,
  Expired = 3,
}

/** Error codes */
export enum ErrorCode {
  InvalidAPIKey = 1001,
  SignatureVerifyFailed = 1002,
  APIKeyExpired = 1003,
  IPNotWhitelisted = 1004,
  MerchantSuspended = 1005,
  InvalidOrderID = 10001,
  OrderExists = 10002,
  NoAvailableWallet = 10003,
  InvalidAmount = 10004,
  AmountChannelUnavailable = 10005,
  ExchangeRateError = 10006,
  OrderAlreadyPaid = 10007,
  OrderNotFound = 10008,
  OrderExpired = 10009,
  InvalidChainType = 20001,
  ChainUnavailable = 20002,
  ChainMonitoringDelay = 20003,
  RateLimitExceeded = 50001,
  BurstLimitExceeded = 50002,
}

/** Client configuration options */
export interface CryptomePayConfig {
  /** Your API key */
  apiKey: string;
  /** Your API secret */
  apiSecret: string;
  /** Base URL (default: production) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/** Parameters for creating a payment */
export interface CreatePaymentParams {
  /** Your unique order ID */
  orderId: string;
  /** Payment amount in CNY */
  amount: number;
  /** Webhook callback URL */
  notifyUrl: string;
  /** Redirect URL after payment (optional) */
  redirectUrl?: string;
  /** Blockchain network (optional, default: TRC20) */
  chainType?: ChainType | string;
}

/** Payment data returned from API */
export interface PaymentData {
  tradeId: string;
  orderId: string;
  amount: number;
  actualAmount: number;
  token: string;
  chainType: string;
  chainName: string;
  expirationTime: number;
  paymentUrl: string;
}

/** API response for payment operations */
export interface PaymentResponse {
  statusCode: number;
  message: string;
  data?: PaymentData;
  requestId: string;
}

/** Order data */
export interface OrderData {
  tradeId: string;
  orderId: string;
  amount: number;
  actualAmount: number;
  token: string;
  chainType: string;
  status: PaymentStatus;
  blockTransactionId?: string;
  createdAt: string;
  paidAt?: string;
}

/** API response for order queries */
export interface OrderResponse {
  statusCode: number;
  message: string;
  data?: OrderData;
  requestId: string;
}

/** Parameters for listing orders */
export interface ListOrdersParams {
  page?: number;
  pageSize?: number;
  status?: PaymentStatus;
  chainType?: ChainType | string;
  startDate?: string;
  endDate?: string;
}

/** Order list data */
export interface OrderListData {
  list: OrderData[];
  total: number;
  page: number;
  pageSize: number;
}

/** API response for order list */
export interface OrderListResponse {
  statusCode: number;
  message: string;
  data?: OrderListData;
  requestId: string;
}

/** Webhook payload */
export interface WebhookPayload {
  tradeId: string;
  orderId: string;
  amount: number;
  actualAmount: number;
  token: string;
  chainType: string;
  blockTransactionId: string;
  status: PaymentStatus;
  signature: string;
}

/** Merchant data */
export interface MerchantData {
  merchantId: number;
  merchantCode: string;
  name: string;
  email: string;
  status: string;
  kycStatus: string;
  kycLevel: number;
  createdAt: string;
}

/** API response for merchant info */
export interface MerchantResponse {
  statusCode: number;
  message: string;
  data?: MerchantData;
  requestId: string;
}

/** Custom error class for API errors */
export class CryptomePayError extends Error {
  public readonly statusCode: number;
  public readonly requestId: string;

  constructor(message: string, statusCode: number, requestId: string) {
    super(message);
    this.name = 'CryptomePayError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }

  /** Check if error is retryable */
  isRetryable(): boolean {
    return this.statusCode === 429 || this.statusCode >= 500;
  }

  /** Check if error is authentication related */
  isAuthError(): boolean {
    return this.statusCode >= 1001 && this.statusCode <= 1005;
  }

  /** Check if error is validation related */
  isValidationError(): boolean {
    return this.statusCode >= 10001 && this.statusCode <= 10009;
  }
}

/**
 * Cryptome Pay API Client
 *
 * @example
 * ```typescript
 * const client = new CryptomePay({
 *   apiKey: 'sk_live_xxx',
 *   apiSecret: 'your_secret'
 * });
 * ```
 */
export default class CryptomePay {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private baseUrl: string;
  private readonly timeout: number;

  constructor(config: CryptomePayConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = (config.baseUrl || PRODUCTION_URL).replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
  }

  /** Switch to sandbox environment */
  useSandbox(): this {
    this.baseUrl = SANDBOX_URL;
    return this;
  }

  /** Switch to production environment */
  useProduction(): this {
    this.baseUrl = PRODUCTION_URL;
    return this;
  }

  /**
   * Create a new payment order
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const signParams: Record<string, string> = {
      order_id: params.orderId,
      amount: params.amount.toFixed(2),
      notify_url: params.notifyUrl,
    };

    if (params.redirectUrl) {
      signParams.redirect_url = params.redirectUrl;
    }
    if (params.chainType) {
      signParams.chain_type = params.chainType;
    }

    const signature = this.generateSignature(signParams);

    const body: Record<string, unknown> = {
      order_id: params.orderId,
      amount: params.amount,
      notify_url: params.notifyUrl,
      signature,
    };

    if (params.redirectUrl) {
      body.redirect_url = params.redirectUrl;
    }
    if (params.chainType) {
      body.chain_type = params.chainType;
    }

    const response = await this.request<any>('POST', '/order/create-transaction', body);
    return this.transformPaymentResponse(response);
  }

  /**
   * Query payment by trade_id
   */
  async queryPaymentByTradeId(tradeId: string): Promise<OrderResponse> {
    const response = await this.request<any>('GET', `/order/query?trade_id=${encodeURIComponent(tradeId)}`);
    return this.transformOrderResponse(response);
  }

  /**
   * Query payment by order_id
   */
  async queryPaymentByOrderId(orderId: string): Promise<OrderResponse> {
    const response = await this.request<any>('GET', `/order/query?order_id=${encodeURIComponent(orderId)}`);
    return this.transformOrderResponse(response);
  }

  /**
   * List orders with optional filters
   */
  async listOrders(params: ListOrdersParams = {}): Promise<OrderListResponse> {
    const query = new URLSearchParams();

    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('page_size', String(params.pageSize));
    if (params.status) query.set('status', String(params.status));
    if (params.chainType) query.set('chain_type', params.chainType);
    if (params.startDate) query.set('start_date', params.startDate);
    if (params.endDate) query.set('end_date', params.endDate);

    const queryString = query.toString();
    const endpoint = queryString ? `/merchant/orders?${queryString}` : '/merchant/orders';

    const response = await this.request<any>('GET', endpoint);
    return this.transformOrderListResponse(response);
  }

  /**
   * Get merchant profile
   */
  async getMerchantInfo(): Promise<MerchantResponse> {
    const response = await this.request<any>('GET', '/merchant/info');
    return this.transformMerchantResponse(response);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: WebhookPayload): boolean {
    const params: Record<string, string> = {
      trade_id: payload.tradeId,
      order_id: payload.orderId,
      amount: payload.amount.toFixed(2),
      actual_amount: payload.actualAmount.toFixed(4),
      token: payload.token,
      chain_type: payload.chainType,
      block_transaction_id: payload.blockTransactionId,
      status: String(payload.status),
    };

    const expected = this.generateSignature(params);

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(payload.signature)
    );
  }

  /**
   * Verify webhook signature from raw object (snake_case keys)
   */
  verifyWebhookSignatureRaw(payload: Record<string, unknown>): boolean {
    const signature = payload.signature as string;
    if (!signature) return false;

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'signature' && value !== '' && value !== null) {
        params[key] = String(value);
      }
    }

    const expected = this.generateSignature(params);

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate MD5 signature
   */
  private generateSignature(params: Record<string, string>): string {
    const filtered = Object.entries(params)
      .filter(([key, value]) => key !== 'signature' && value !== '' && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const queryString = filtered
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return crypto.createHash('md5')
      .update(queryString + this.apiSecret)
      .digest('hex');
  }

  /**
   * Make HTTP request
   */
  private request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const isHttps = url.protocol === 'https:';

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `cryptomepay-node/${VERSION}`,
        },
        timeout: this.timeout,
      };

      const client = isHttps ? https : http;
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body && method !== 'GET') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /** Transform API response to PaymentResponse */
  private transformPaymentResponse(response: any): PaymentResponse {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        tradeId: response.data.trade_id,
        orderId: response.data.order_id,
        amount: response.data.amount,
        actualAmount: response.data.actual_amount,
        token: response.data.token,
        chainType: response.data.chain_type,
        chainName: response.data.chain_name,
        expirationTime: response.data.expiration_time,
        paymentUrl: response.data.payment_url,
      } : undefined,
      requestId: response.request_id,
    };
  }

  /** Transform API response to OrderResponse */
  private transformOrderResponse(response: any): OrderResponse {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        tradeId: response.data.trade_id,
        orderId: response.data.order_id,
        amount: response.data.amount,
        actualAmount: response.data.actual_amount,
        token: response.data.token,
        chainType: response.data.chain_type,
        status: response.data.status,
        blockTransactionId: response.data.block_transaction_id,
        createdAt: response.data.created_at,
        paidAt: response.data.paid_at,
      } : undefined,
      requestId: response.request_id,
    };
  }

  /** Transform API response to OrderListResponse */
  private transformOrderListResponse(response: any): OrderListResponse {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        list: response.data.list?.map((order: any) => ({
          tradeId: order.trade_id,
          orderId: order.order_id,
          amount: order.amount,
          actualAmount: order.actual_amount,
          token: order.token,
          chainType: order.chain_type,
          status: order.status,
          blockTransactionId: order.block_transaction_id,
          createdAt: order.created_at,
          paidAt: order.paid_at,
        })) || [],
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.page_size,
      } : undefined,
      requestId: response.request_id,
    };
  }

  /** Transform API response to MerchantResponse */
  private transformMerchantResponse(response: any): MerchantResponse {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        merchantId: response.data.merchant_id,
        merchantCode: response.data.merchant_code,
        name: response.data.name,
        email: response.data.email,
        status: response.data.status,
        kycStatus: response.data.kyc_status,
        kycLevel: response.data.kyc_level,
        createdAt: response.data.created_at,
      } : undefined,
      requestId: response.request_id,
    };
  }
}

// Named exports
export { CryptomePay };
