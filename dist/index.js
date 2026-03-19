"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ChainType: () => ChainType,
  CryptomePay: () => CryptomePay,
  CryptomePayError: () => CryptomePayError,
  ErrorCode: () => ErrorCode,
  PRODUCTION_URL: () => PRODUCTION_URL,
  PaymentStatus: () => PaymentStatus,
  SANDBOX_URL: () => SANDBOX_URL,
  STAGING_URL: () => STAGING_URL,
  VERSION: () => VERSION,
  default: () => CryptomePay
});
module.exports = __toCommonJS(index_exports);
var crypto = __toESM(require("crypto"));
var https = __toESM(require("https"));
var http = __toESM(require("http"));
var VERSION = "1.0.0";
var PRODUCTION_URL = "https://api.cryptomepay.com/api/v1";
var SANDBOX_URL = "https://sandbox.cryptomepay.com/api/v1";
var STAGING_URL = "https://staging.cryptomepay.com/api/v1";
var ChainType = /* @__PURE__ */ ((ChainType2) => {
  ChainType2["TRC20"] = "TRC20";
  ChainType2["BSC"] = "BSC";
  ChainType2["POLYGON"] = "POLYGON";
  ChainType2["ETH"] = "ETH";
  ChainType2["ARBITRUM"] = "ARBITRUM";
  return ChainType2;
})(ChainType || {});
var PaymentStatus = /* @__PURE__ */ ((PaymentStatus2) => {
  PaymentStatus2[PaymentStatus2["Pending"] = 1] = "Pending";
  PaymentStatus2[PaymentStatus2["Paid"] = 2] = "Paid";
  PaymentStatus2[PaymentStatus2["Expired"] = 3] = "Expired";
  return PaymentStatus2;
})(PaymentStatus || {});
var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
  ErrorCode2[ErrorCode2["InvalidAPIKey"] = 1001] = "InvalidAPIKey";
  ErrorCode2[ErrorCode2["SignatureVerifyFailed"] = 1002] = "SignatureVerifyFailed";
  ErrorCode2[ErrorCode2["APIKeyExpired"] = 1003] = "APIKeyExpired";
  ErrorCode2[ErrorCode2["IPNotWhitelisted"] = 1004] = "IPNotWhitelisted";
  ErrorCode2[ErrorCode2["MerchantSuspended"] = 1005] = "MerchantSuspended";
  ErrorCode2[ErrorCode2["InvalidOrderID"] = 10001] = "InvalidOrderID";
  ErrorCode2[ErrorCode2["OrderExists"] = 10002] = "OrderExists";
  ErrorCode2[ErrorCode2["NoAvailableWallet"] = 10003] = "NoAvailableWallet";
  ErrorCode2[ErrorCode2["InvalidAmount"] = 10004] = "InvalidAmount";
  ErrorCode2[ErrorCode2["AmountChannelUnavailable"] = 10005] = "AmountChannelUnavailable";
  ErrorCode2[ErrorCode2["ExchangeRateError"] = 10006] = "ExchangeRateError";
  ErrorCode2[ErrorCode2["OrderAlreadyPaid"] = 10007] = "OrderAlreadyPaid";
  ErrorCode2[ErrorCode2["OrderNotFound"] = 10008] = "OrderNotFound";
  ErrorCode2[ErrorCode2["OrderExpired"] = 10009] = "OrderExpired";
  ErrorCode2[ErrorCode2["InvalidChainType"] = 20001] = "InvalidChainType";
  ErrorCode2[ErrorCode2["ChainUnavailable"] = 20002] = "ChainUnavailable";
  ErrorCode2[ErrorCode2["ChainMonitoringDelay"] = 20003] = "ChainMonitoringDelay";
  ErrorCode2[ErrorCode2["RateLimitExceeded"] = 50001] = "RateLimitExceeded";
  ErrorCode2[ErrorCode2["BurstLimitExceeded"] = 50002] = "BurstLimitExceeded";
  return ErrorCode2;
})(ErrorCode || {});
var CryptomePayError = class extends Error {
  constructor(message, statusCode, requestId) {
    super(message);
    this.name = "CryptomePayError";
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
  /** Check if error is retryable */
  isRetryable() {
    return this.statusCode === 429 || this.statusCode >= 500;
  }
  /** Check if error is authentication related */
  isAuthError() {
    return this.statusCode >= 1001 && this.statusCode <= 1005;
  }
  /** Check if error is validation related */
  isValidationError() {
    return this.statusCode >= 10001 && this.statusCode <= 10009;
  }
};
var CryptomePay = class {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = (config.baseUrl || PRODUCTION_URL).replace(/\/$/, "");
    this.timeout = config.timeout || 3e4;
  }
  /** Switch to sandbox environment */
  useSandbox() {
    this.baseUrl = SANDBOX_URL;
    return this;
  }
  /** Switch to production environment */
  useProduction() {
    this.baseUrl = PRODUCTION_URL;
    return this;
  }
  /**
   * Create a new payment order
   */
  async createPayment(params) {
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const nonce = this.generateNonce();
    const signParams = {
      api_key: this.apiKey,
      timestamp,
      nonce,
      order_id: params.orderId,
      amount: params.amount.toFixed(2),
      notify_url: params.notifyUrl
    };
    if (params.redirectUrl) {
      signParams.redirect_url = params.redirectUrl;
    }
    if (params.chainType) {
      signParams.chain_type = params.chainType;
    }
    const signature = this.generateSignature(signParams);
    const body = {
      api_key: this.apiKey,
      timestamp,
      nonce,
      order_id: params.orderId,
      amount: params.amount,
      notify_url: params.notifyUrl,
      signature
    };
    if (params.redirectUrl) {
      body.redirect_url = params.redirectUrl;
    }
    if (params.chainType) {
      body.chain_type = params.chainType;
    }
    const response = await this.request("POST", "/order/create-transaction", body);
    return this.transformPaymentResponse(response);
  }
  /**
   * Query payment by trade_id
   */
  async queryPaymentByTradeId(tradeId) {
    const response = await this.request("GET", `/merchant/order/query?trade_id=${encodeURIComponent(tradeId)}`);
    return this.transformOrderResponse(response);
  }
  /**
   * Query payment by order_id
   */
  async queryPaymentByOrderId(orderId) {
    const response = await this.request("GET", `/merchant/order/query?order_id=${encodeURIComponent(orderId)}`);
    return this.transformOrderResponse(response);
  }
  /**
   * List orders with optional filters
   */
  async listOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("page_size", String(params.pageSize));
    if (params.status) query.set("status", String(params.status));
    if (params.chainType) query.set("chain_type", params.chainType);
    if (params.startDate) query.set("start_date", params.startDate);
    if (params.endDate) query.set("end_date", params.endDate);
    const queryString = query.toString();
    const endpoint = queryString ? `/merchant/orders?${queryString}` : "/merchant/orders";
    const response = await this.request("GET", endpoint);
    return this.transformOrderListResponse(response);
  }
  /**
   * Get merchant profile
   */
  async getMerchantInfo() {
    const response = await this.request("GET", "/merchant/info");
    return this.transformMerchantResponse(response);
  }
  /**
   * Verify webhook signature (HMAC-SHA256)
   */
  verifyWebhookSignature(payload) {
    const params = {
      trade_id: payload.tradeId,
      order_id: payload.orderId,
      amount: typeof payload.amount === "number" ? payload.amount.toFixed(2) : String(payload.amount),
      actual_amount: typeof payload.actualAmount === "number" ? payload.actualAmount.toFixed(4) : String(payload.actualAmount),
      token: payload.token,
      chain_type: payload.chainType,
      block_transaction_id: payload.blockTransactionId,
      status: String(payload.status),
      timestamp: String(payload.timestamp)
    };
    if (payload.chainName) {
      params.chain_name = payload.chainName;
    }
    const expected = this.calculateSignature(params);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(payload.signature)
      );
    } catch {
      return false;
    }
  }
  /**
   * Verify webhook signature from raw object (snake_case keys)
   */
  verifyWebhookSignatureRaw(payload) {
    const signature = payload.signature;
    if (!signature) return false;
    const params = {};
    for (const [key, value] of Object.entries(payload)) {
      if (key === "signature") continue;
      if (value === "" || value === null || value === void 0) continue;
      if (key === "amount" && typeof value === "number") {
        params[key] = value.toFixed(2);
      } else if (key === "actual_amount" && typeof value === "number") {
        params[key] = value.toFixed(4);
      } else {
        params[key] = String(value);
      }
    }
    const expected = this.calculateSignature(params);
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
   * Calculate HMAC-SHA256 signature
   */
  calculateSignature(params) {
    const filtered = Object.entries(params).filter(([key, value]) => key !== "signature" && value !== "" && value !== null).sort(([a], [b]) => a.localeCompare(b));
    const queryString = filtered.map(([key, value]) => `${key}=${value}`).join("&");
    return crypto.createHmac("sha256", this.apiSecret).update(queryString).digest("hex");
  }
  /**
   * Generate HMAC-SHA256 signature
   */
  generateSignature(params) {
    const filtered = Object.entries(params).filter(([key, value]) => key !== "signature" && value !== "" && value !== null).sort(([a], [b]) => a.localeCompare(b));
    const queryString = filtered.map(([key, value]) => `${key}=${value}`).join("&");
    return crypto.createHmac("sha256", this.apiSecret).update(queryString).digest("hex");
  }
  /**
   * Generate random nonce
   */
  generateNonce() {
    return crypto.randomBytes(16).toString("hex");
  }
  /**
   * Make HTTP request
   */
  request(method, endpoint, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + endpoint);
      const isHttps = url.protocol === "https:";
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": `cryptomepay-node/${VERSION}`
        },
        timeout: this.timeout
      };
      const client = isHttps ? https : http;
      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
      if (body && method !== "GET") {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
  /** Transform API response to PaymentResponse */
  transformPaymentResponse(response) {
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
        paymentUrl: response.data.payment_url
      } : void 0,
      requestId: response.request_id
    };
  }
  /** Transform API response to OrderResponse */
  transformOrderResponse(response) {
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
        paidAt: response.data.paid_at
      } : void 0,
      requestId: response.request_id
    };
  }
  /** Transform API response to OrderListResponse */
  transformOrderListResponse(response) {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        list: response.data.list?.map((order) => ({
          tradeId: order.trade_id,
          orderId: order.order_id,
          amount: order.amount,
          actualAmount: order.actual_amount,
          token: order.token,
          chainType: order.chain_type,
          status: order.status,
          blockTransactionId: order.block_transaction_id,
          createdAt: order.created_at,
          paidAt: order.paid_at
        })) || [],
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.page_size
      } : void 0,
      requestId: response.request_id
    };
  }
  /** Transform API response to MerchantResponse */
  transformMerchantResponse(response) {
    return {
      statusCode: response.status_code,
      message: response.message,
      data: response.data ? {
        merchantId: response.data.merchant_id,
        merchantCode: response.data.merchant_code,
        name: response.data.merchant_name || response.data.name,
        email: response.data.email,
        status: response.data.status,
        kycStatus: response.data.kyc_status,
        kycLevel: response.data.kyc_level,
        createdAt: response.data.created_at
      } : void 0,
      requestId: response.request_id
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ChainType,
  CryptomePay,
  CryptomePayError,
  ErrorCode,
  PRODUCTION_URL,
  PaymentStatus,
  SANDBOX_URL,
  STAGING_URL,
  VERSION
});
