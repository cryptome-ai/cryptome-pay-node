import CryptomePay, {
  ChainType,
  PaymentStatus,
  PRODUCTION_URL,
  SANDBOX_URL,
  WebhookPayload,
} from '../src';

describe('CryptomePay', () => {
  let client: CryptomePay;

  beforeEach(() => {
    client = new CryptomePay({
      apiKey: 'sk_test_key',
      apiSecret: 'test_secret',
    });
  });

  describe('constructor', () => {
    it('should create client with default settings', () => {
      expect(client).toBeInstanceOf(CryptomePay);
    });

    it('should use production URL by default', () => {
      // @ts-ignore - accessing private property for testing
      expect(client.baseUrl).toBe(PRODUCTION_URL);
    });

    it('should allow custom base URL', () => {
      const customClient = new CryptomePay({
        apiKey: 'sk_test',
        apiSecret: 'secret',
        baseUrl: 'https://custom.example.com/api/v1',
      });
      // @ts-ignore
      expect(customClient.baseUrl).toBe('https://custom.example.com/api/v1');
    });
  });

  describe('useSandbox', () => {
    it('should switch to sandbox URL', () => {
      client.useSandbox();
      // @ts-ignore
      expect(client.baseUrl).toBe(SANDBOX_URL);
    });

    it('should return this for chaining', () => {
      const result = client.useSandbox();
      expect(result).toBe(client);
    });
  });

  describe('useProduction', () => {
    it('should switch to production URL', () => {
      client.useSandbox();
      client.useProduction();
      // @ts-ignore
      expect(client.baseUrl).toBe(PRODUCTION_URL);
    });
  });

  describe('generateSignature', () => {
    it('should generate consistent signature', () => {
      const params = {
        order_id: 'ORDER_001',
        amount: '100.00',
        notify_url: 'https://example.com/webhook',
        chain_type: 'BSC',
      };

      // @ts-ignore - accessing private method for testing
      const signature1 = client.generateSignature(params);
      // @ts-ignore
      const signature2 = client.generateSignature(params);

      expect(signature1).toBe(signature2);
      expect(signature1).toHaveLength(32);
    });

    it('should sort parameters alphabetically', () => {
      const params1 = {
        order_id: 'ORDER_001',
        amount: '100.00',
        notify_url: 'https://example.com',
      };

      const params2 = {
        notify_url: 'https://example.com',
        order_id: 'ORDER_001',
        amount: '100.00',
      };

      // @ts-ignore
      expect(client.generateSignature(params1)).toBe(client.generateSignature(params2));
    });

    it('should exclude empty values', () => {
      const params1 = {
        order_id: 'ORDER_001',
        amount: '100.00',
      };

      const params2 = {
        order_id: 'ORDER_001',
        amount: '100.00',
        chain_type: '',
      };

      // @ts-ignore
      expect(client.generateSignature(params1)).toBe(client.generateSignature(params2));
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      // First generate a valid signature
      const params = {
        trade_id: 'CP123',
        order_id: 'ORDER_001',
        amount: '100.00',
        actual_amount: '15.6250',
        token: '0xabc',
        chain_type: 'BSC',
        block_transaction_id: '0x123',
        status: '2',
      };
      // @ts-ignore
      const validSignature = client.generateSignature(params);

      const payload: WebhookPayload = {
        tradeId: 'CP123',
        orderId: 'ORDER_001',
        amount: 100.00,
        actualAmount: 15.6250,
        token: '0xabc',
        chainType: 'BSC',
        blockTransactionId: '0x123',
        status: PaymentStatus.Paid,
        signature: validSignature,
      };

      expect(client.verifyWebhookSignature(payload)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload: WebhookPayload = {
        tradeId: 'CP123',
        orderId: 'ORDER_001',
        amount: 100.00,
        actualAmount: 15.6250,
        token: '0xabc',
        chainType: 'BSC',
        blockTransactionId: '0x123',
        status: PaymentStatus.Paid,
        signature: 'invalid_signature_here_32chars__',
      };

      expect(client.verifyWebhookSignature(payload)).toBe(false);
    });
  });

  describe('verifyWebhookSignatureRaw', () => {
    it('should verify raw payload with snake_case keys', () => {
      const params = {
        trade_id: 'CP123',
        order_id: 'ORDER_001',
        amount: '100',
        actual_amount: '15.625',
        token: '0xabc',
        chain_type: 'BSC',
        block_transaction_id: '0x123',
        status: '2',
      };
      // @ts-ignore
      const validSignature = client.generateSignature(params);

      const payload = {
        ...params,
        signature: validSignature,
      };

      expect(client.verifyWebhookSignatureRaw(payload)).toBe(true);
    });

    it('should return false for missing signature', () => {
      const payload = {
        trade_id: 'CP123',
        order_id: 'ORDER_001',
      };

      expect(client.verifyWebhookSignatureRaw(payload)).toBe(false);
    });
  });
});

describe('ChainType', () => {
  it('should have correct values', () => {
    expect(ChainType.TRC20).toBe('TRC20');
    expect(ChainType.BSC).toBe('BSC');
    expect(ChainType.POLYGON).toBe('POLYGON');
    expect(ChainType.ETH).toBe('ETH');
    expect(ChainType.ARBITRUM).toBe('ARBITRUM');
  });
});

describe('PaymentStatus', () => {
  it('should have correct values', () => {
    expect(PaymentStatus.Pending).toBe(1);
    expect(PaymentStatus.Paid).toBe(2);
    expect(PaymentStatus.Expired).toBe(3);
  });
});
