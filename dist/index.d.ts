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
/** SDK Version */
declare const VERSION = "1.0.0";
/** Environment URLs */
declare const PRODUCTION_URL = "https://api.cryptomepay.com/api/v1";
declare const SANDBOX_URL = "https://sandbox.cryptomepay.com/api/v1";
declare const STAGING_URL = "https://staging.cryptomepay.com/api/v1";
/** Supported chain types */
declare enum ChainType {
    TRC20 = "TRC20",
    BSC = "BSC",
    POLYGON = "POLYGON",
    ETH = "ETH",
    ARBITRUM = "ARBITRUM"
}
/** Payment status codes */
declare enum PaymentStatus {
    Pending = 1,
    Paid = 2,
    Expired = 3
}
/** Error codes */
declare enum ErrorCode {
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
    BurstLimitExceeded = 50002
}
/** Client configuration options */
interface CryptomePayConfig {
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
interface CreatePaymentParams {
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
interface PaymentData {
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
interface PaymentResponse {
    statusCode: number;
    message: string;
    data?: PaymentData;
    requestId: string;
}
/** Order data */
interface OrderData {
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
interface OrderResponse {
    statusCode: number;
    message: string;
    data?: OrderData;
    requestId: string;
}
/** Parameters for listing orders */
interface ListOrdersParams {
    page?: number;
    pageSize?: number;
    status?: PaymentStatus;
    chainType?: ChainType | string;
    startDate?: string;
    endDate?: string;
}
/** Order list data */
interface OrderListData {
    list: OrderData[];
    total: number;
    page: number;
    pageSize: number;
}
/** API response for order list */
interface OrderListResponse {
    statusCode: number;
    message: string;
    data?: OrderListData;
    requestId: string;
}
/** Webhook payload */
interface WebhookPayload {
    tradeId: string;
    orderId: string;
    amount: number;
    actualAmount: number;
    token: string;
    chainType: string;
    chainName?: string;
    blockTransactionId: string;
    status: PaymentStatus;
    timestamp: number;
    signature: string;
}
/** Merchant data */
interface MerchantData {
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
interface MerchantResponse {
    statusCode: number;
    message: string;
    data?: MerchantData;
    requestId: string;
}
/** Custom error class for API errors */
declare class CryptomePayError extends Error {
    readonly statusCode: number;
    readonly requestId: string;
    constructor(message: string, statusCode: number, requestId: string);
    /** Check if error is retryable */
    isRetryable(): boolean;
    /** Check if error is authentication related */
    isAuthError(): boolean;
    /** Check if error is validation related */
    isValidationError(): boolean;
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
declare class CryptomePay {
    private readonly apiKey;
    private readonly apiSecret;
    private baseUrl;
    private readonly timeout;
    constructor(config: CryptomePayConfig);
    /** Switch to sandbox environment */
    useSandbox(): this;
    /** Switch to production environment */
    useProduction(): this;
    /**
     * Create a new payment order
     */
    createPayment(params: CreatePaymentParams): Promise<PaymentResponse>;
    /**
     * Query payment by trade_id
     */
    queryPaymentByTradeId(tradeId: string): Promise<OrderResponse>;
    /**
     * Query payment by order_id
     */
    queryPaymentByOrderId(orderId: string): Promise<OrderResponse>;
    /**
     * List orders with optional filters
     */
    listOrders(params?: ListOrdersParams): Promise<OrderListResponse>;
    /**
     * Get merchant profile
     */
    getMerchantInfo(): Promise<MerchantResponse>;
    /**
     * Verify webhook signature (HMAC-SHA256)
     */
    verifyWebhookSignature(payload: WebhookPayload): boolean;
    /**
     * Verify webhook signature from raw object (snake_case keys)
     */
    verifyWebhookSignatureRaw(payload: Record<string, unknown>): boolean;
    /**
     * Calculate HMAC-SHA256 signature
     */
    private calculateSignature;
    /**
     * Generate HMAC-SHA256 signature
     */
    private generateSignature;
    /**
     * Generate random nonce
     */
    private generateNonce;
    /**
     * Make HTTP request
     */
    private request;
    /** Transform API response to PaymentResponse */
    private transformPaymentResponse;
    /** Transform API response to OrderResponse */
    private transformOrderResponse;
    /** Transform API response to OrderListResponse */
    private transformOrderListResponse;
    /** Transform API response to MerchantResponse */
    private transformMerchantResponse;
}

export { ChainType, type CreatePaymentParams, CryptomePay, type CryptomePayConfig, CryptomePayError, ErrorCode, type ListOrdersParams, type MerchantData, type MerchantResponse, type OrderData, type OrderListData, type OrderListResponse, type OrderResponse, PRODUCTION_URL, type PaymentData, type PaymentResponse, PaymentStatus, SANDBOX_URL, STAGING_URL, VERSION, type WebhookPayload, CryptomePay as default };
