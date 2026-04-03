# Cryptome Pay Node.js SDK

Official Node.js/TypeScript SDK for [Cryptome Pay](https://cryptomepay.com) - Non-custodial cryptocurrency payment gateway.

## Installation

```bash
npm install cryptomepay
# or
yarn add cryptomepay
# or
pnpm add cryptomepay
```

## Quick Start

```typescript
import CryptomePay from 'cryptomepay';

const client = new CryptomePay({
  apiKey: 'sk_live_your_api_key',
  apiSecret: 'your_api_secret',
});

// Create payment
const payment = await client.createPayment({
  orderId: `ORDER_${Date.now()}`,
  amount: 100.00,
  notifyUrl: 'https://your-site.com/webhook',
  chainType: 'BSC',
});

if (payment.statusCode === 200) {
  console.log('Payment URL:', payment.data?.paymentUrl);
}
```

## Configuration

```typescript
const client = new CryptomePay({
  apiKey: 'sk_live_xxx',
  apiSecret: 'secret',
  timeout: 60000, // Optional: request timeout in ms (default: 30000)
});
```

> **Sandbox Testing:** Use the Merchant Dashboard's built-in Sandbox page to test payment flows without real blockchain transactions.

## API Reference

### Create Payment

```typescript
import { ChainType } from 'cryptomepay';

const payment = await client.createPayment({
  orderId: 'ORDER_001',      // Your unique order ID
  amount: 100.00,            // Amount in CNY
  notifyUrl: 'https://...',  // Webhook URL
  redirectUrl: 'https://...', // Optional: redirect after payment
  chainType: ChainType.BSC,   // Optional: TRC20, BSC, POLYGON, ETH, ARBITRUM
});

console.log(payment.data?.tradeId);
console.log(payment.data?.paymentUrl);
console.log(payment.data?.actualAmount); // USDT amount
```

### Query Payment

```typescript
import { PaymentStatus } from 'cryptomepay';

// By trade_id
const result = await client.queryPaymentByTradeId('CP202312271648380592');

// By order_id
const result = await client.queryPaymentByOrderId('ORDER_001');

if (result.data?.status === PaymentStatus.Paid) {
  console.log('Payment confirmed!');
  console.log('TX:', result.data.blockTransactionId);
}
```

### List Orders

```typescript
const orders = await client.listOrders({
  page: 1,
  pageSize: 20,
  status: PaymentStatus.Paid,
  chainType: ChainType.BSC,
  startDate: '2025-12-01',
  endDate: '2025-12-31',
});

for (const order of orders.data?.list || []) {
  console.log(`${order.orderId}: ${order.actualAmount} USDT`);
}
```

### Get Merchant Info

```typescript
const merchant = await client.getMerchantInfo();
console.log('Merchant:', merchant.data?.name);
```

## Webhook Handling

### Express.js

```typescript
import express from 'express';
import CryptomePay, { WebhookPayload, PaymentStatus } from 'cryptomepay';

const app = express();
app.use(express.json());

const client = new CryptomePay({
  apiKey: process.env.CRYPTOMEPAY_API_KEY!,
  apiSecret: process.env.CRYPTOMEPAY_API_SECRET!,
});

app.post('/webhook', (req, res) => {
  const payload = req.body as WebhookPayload;

  // Verify signature
  if (!client.verifyWebhookSignature(payload)) {
    return res.status(401).send('Invalid signature');
  }

  // Process payment
  if (payload.status === PaymentStatus.Paid) {
    console.log(`Order ${payload.orderId} paid!`);
    console.log(`TX: ${payload.blockTransactionId}`);
    // Fulfill order...
  }

  res.send('ok');
});
```

### Raw Payload (snake_case)

```typescript
app.post('/webhook', (req, res) => {
  // If using raw JSON with snake_case keys
  if (!client.verifyWebhookSignatureRaw(req.body)) {
    return res.status(401).send('Invalid signature');
  }

  const { order_id, status, block_transaction_id } = req.body;
  // Process...

  res.send('ok');
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import CryptomePay, {
  CryptomePayConfig,
  CreatePaymentParams,
  PaymentResponse,
  OrderResponse,
  WebhookPayload,
  ChainType,
  PaymentStatus,
  ErrorCode,
} from 'cryptomepay';
```

## Error Handling

```typescript
import CryptomePay, { CryptomePayError, ErrorCode } from 'cryptomepay';

try {
  const payment = await client.createPayment(params);

  if (payment.statusCode !== 200) {
    switch (payment.statusCode) {
      case ErrorCode.OrderExists:
        console.log('Order already exists');
        break;
      case ErrorCode.InvalidAmount:
        console.log('Invalid amount');
        break;
      default:
        console.log('Error:', payment.message);
    }
  }
} catch (error) {
  if (error instanceof CryptomePayError) {
    if (error.isRetryable()) {
      // Retry with backoff
    }
  }
  console.error('Request failed:', error);
}
```

## Supported Chains

| ChainType | Network | Token |
|-----------|---------|-------|
| `TRC20` | TRON | USDT |
| `BSC` | BNB Smart Chain | USDT |
| `POLYGON` | Polygon PoS | USDT |
| `ETH` | Ethereum | USDT |
| `ARBITRUM` | Arbitrum One | USDT |

## Payment Status

| Status | Value | Description |
|--------|-------|-------------|
| `Pending` | 1 | Awaiting payment |
| `Paid` | 2 | Payment confirmed |
| `Expired` | 3 | Payment expired |

## CommonJS Support

```javascript
const CryptomePay = require('cryptomepay').default;
const { ChainType, PaymentStatus } = require('cryptomepay');

const client = new CryptomePay({
  apiKey: 'sk_live_xxx',
  apiSecret: 'secret',
});
```

## Testing

Run tests:

```bash
npm test
```

## Documentation

- [API Reference](https://docs.cryptomepay.com/api)
- [Webhooks Guide](https://docs.cryptomepay.com/api/WEBHOOKS.md)
- [Error Codes](https://docs.cryptomepay.com/api/ERROR_CODES.md)

## License

MIT License - see [LICENSE](LICENSE) file.

## Support

- Email: support@cryptomepay.com
- GitHub: https://github.com/cryptome-ai/cryptome-pay-node/issues
