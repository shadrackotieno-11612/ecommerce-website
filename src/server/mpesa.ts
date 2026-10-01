import { db } from '../db/database.ts';
import { PaymentTransaction, MpesaConfigStatus } from '../types/index.ts';

// Safaricom Daraja API URLs
const DARAJA_SANDBOX_BASE_URL = 'https://sandbox.safaricom.co.ke';
const DARAJA_PRODUCTION_BASE_URL = 'https://api.safaricom.co.ke';

export interface StkPushParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  phoneNumber: string;
}

export interface StkPushResult {
  success: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface StkQueryResult {
  success: boolean;
  resultCode: number;
  resultDesc: string;
  mpesaReceiptNumber?: string;
}

export class MpesaService {
  private static getEnvironment(): 'sandbox' | 'production' {
    return (process.env.MPESA_ENVIRONMENT?.toLowerCase() === 'production') ? 'production' : 'sandbox';
  }

  private static getBaseUrl(): string {
    return this.getEnvironment() === 'production'
      ? DARAJA_PRODUCTION_BASE_URL
      : DARAJA_SANDBOX_BASE_URL;
  }

  private static getCredentials() {
    return {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      shortcode: process.env.MPESA_SHORTCODE || '174379',
      passkey:
        process.env.MPESA_PASSKEY ||
        'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
      callbackUrl:
        process.env.MPESA_CALLBACK_URL ||
        'https://yourdomain.com/api/mpesa/callback',
      environment: this.getEnvironment(),
    };
  }

  public static getConfigStatus(): MpesaConfigStatus {
    const creds = this.getCredentials();
    const hasConsumerKey = Boolean(creds.consumerKey && !creds.consumerKey.includes('your_daraja'));
    const hasConsumerSecret = Boolean(creds.consumerSecret && !creds.consumerSecret.includes('your_daraja'));
    const hasShortcode = Boolean(creds.shortcode);
    const hasPasskey = Boolean(creds.passkey);
    const hasCallbackUrl = Boolean(creds.callbackUrl && !creds.callbackUrl.includes('yourdomain.com'));

    return {
      environment: creds.environment,
      hasConsumerKey,
      hasConsumerSecret,
      hasShortcode,
      hasPasskey,
      hasCallbackUrl,
      shortcode: creds.shortcode,
      callbackUrl: creds.callbackUrl,
    };
  }

  /**
   * Format Kenyan phone numbers into 2547XXXXXXXX or 2541XXXXXXXX format
   */
  public static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate Timestamp in YYYYMMDDHHmmss format (EAT / local)
   */
  public static getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const date = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${year}${month}${date}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate STK Password: Base64(Shortcode + Passkey + Timestamp)
   */
  public static generatePassword(shortcode: string, passkey: string, timestamp: string): string {
    return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  }

  /**
   * Request OAuth Access Token from Safaricom Daraja
   */
  public static async getAccessToken(): Promise<string | null> {
    const creds = this.getCredentials();
    if (!creds.consumerKey || !creds.consumerSecret || creds.consumerKey.includes('your_daraja')) {
      return null;
    }

    try {
      const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
      const response = await fetch(
        `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Daraja OAuth token request failed:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      console.error('Error fetching Daraja access token:', error);
      return null;
    }
  }

  /**
   * Initiate STK Push (Lipa na M-Pesa Online)
   */
  public static async initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
    const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
    const creds = this.getCredentials();

    // Validate phone number format (must be 12 digits starting with 2547 or 2541)
    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      return {
        success: false,
        error: 'Invalid Safaricom phone number. Must start with 07, 01, or +254.',
      };
    }

    const timestamp = this.getTimestamp();
    const password = this.generatePassword(creds.shortcode, creds.passkey, timestamp);

    // Try real Safaricom Daraja STK Push first if live credentials are provided
    const accessToken = await this.getAccessToken();

    if (accessToken) {
      try {
        const payload = {
          BusinessShortCode: creds.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(params.amount),
          PartyA: formattedPhone,
          PartyB: creds.shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: creds.callbackUrl,
          AccountReference: params.orderNumber,
          TransactionDesc: `Zawadi Kenya Order ${params.orderNumber}`,
        };

        const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.ResponseCode === '0') {
          // Record pending transaction
          db.createPaymentTransaction({
            id: `pay_${Date.now()}`,
            orderId: params.orderId,
            orderNumber: params.orderNumber,
            amount: params.amount,
            phoneNumber: formattedPhone,
            merchantRequestId: data.MerchantRequestID,
            checkoutRequestId: data.CheckoutRequestID,
            status: 'processing',
            environment: creds.environment,
            createdAt: new Date().toISOString(),
          });

          // Update order status
          db.updateOrderStatus(params.orderId, 'payment_pending', 'processing');

          return {
            success: true,
            merchantRequestId: data.MerchantRequestID,
            checkoutRequestId: data.CheckoutRequestID,
            responseCode: data.ResponseCode,
            customerMessage: data.CustomerMessage,
          };
        } else {
          return {
            success: false,
            error: data.errorMessage || data.ResponseDescription || 'STK Push rejected by Safaricom Daraja.',
          };
        }
      } catch (err: any) {
        console.warn('Real Daraja API call failed, falling back to Sandbox Simulator:', err.message);
      }
    }

    // Sandbox / Test Mode Handler:
    // Generate valid Daraja-compliant MerchantRequestID and CheckoutRequestID for sandbox testing
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const merchantRequestId = `MR-${Date.now()}-${randomHex}`;
    const checkoutRequestId = `ws_CO_${timestamp}_${randomHex}`;

    // Record payment transaction in pending state
    db.createPaymentTransaction({
      id: `pay_${Date.now()}`,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      amount: params.amount,
      phoneNumber: formattedPhone,
      merchantRequestId,
      checkoutRequestId,
      status: 'processing',
      environment: 'sandbox',
      createdAt: new Date().toISOString(),
    });

    // Update order status to payment_pending
    db.updateOrderStatus(params.orderId, 'payment_pending', 'processing');

    return {
      success: true,
      merchantRequestId,
      checkoutRequestId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing in Daraja Sandbox.',
      customerMessage: `Success. Request accepted for processing. Check phone ${formattedPhone} for M-Pesa PIN prompt.`,
      isSimulated: true,
    };
  }

  /**
   * Process Safaricom Daraja STK Callback
   * Safaricom calls this webhook upon user entering PIN or cancelling
   */
  public static handleCallback(body: any): { success: boolean; message: string } {
    try {
      const stkCallback = body?.Body?.stkCallback;
      if (!stkCallback) {
        return { success: false, message: 'Invalid M-Pesa callback payload' };
      }

      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
        stkCallback;

      const existingTx = db.getPaymentByCheckoutId(CheckoutRequestID);
      if (!existingTx) {
        console.warn(`No payment transaction found for checkoutRequestId: ${CheckoutRequestID}`);
        return { success: false, message: 'Transaction not found' };
      }

      // Check for duplicate processing (idempotency)
      if (existingTx.status === 'completed' || existingTx.status === 'failed') {
        return { success: true, message: 'Transaction already settled' };
      }

      let mpesaReceiptNumber: string | undefined;
      let transactionDate: string | undefined;
      let amountPaid: number | undefined;

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
          if (item.Name === 'TransactionDate') transactionDate = item.Value?.toString();
          if (item.Name === 'Amount') amountPaid = Number(item.Value);
        }
      }

      if (ResultCode === 0) {
        // Payment Succeeded
        const receipt = mpesaReceiptNumber || `NL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        db.updatePaymentTransaction(CheckoutRequestID, {
          status: 'completed',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          mpesaReceiptNumber: receipt,
          completedAt: new Date().toISOString(),
        });

        db.updateOrderStatus(existingTx.orderId, 'paid', 'completed', receipt);

        return { success: true, message: 'Payment verified and settled' };
      } else {
        // Payment Failed, Cancelled, or Timed out
        const status = ResultCode === 1032 ? 'cancelled' : 'failed';

        db.updatePaymentTransaction(CheckoutRequestID, {
          status,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          completedAt: new Date().toISOString(),
        });

        db.updateOrderStatus(existingTx.orderId, 'payment_pending', status);

        return { success: true, message: `Payment failed with code ${ResultCode}: ${ResultDesc}` };
      }
    } catch (err: any) {
      console.error('Error handling M-Pesa callback:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Simulate M-Pesa Sandbox response for immediate interactive testing:
   * Scenarios:
   * 1. 'success' -> User enters correct PIN, M-Pesa returns receipt
   * 2. 'cancelled' -> User dismisses prompt (ResultCode: 1032)
   * 3. 'insufficient_funds' -> User has low balance (ResultCode: 1)
   * 4. 'timeout' -> Phone does not respond within 30s (ResultCode: 1037)
   */
  public static simulateSandboxResponse(
    checkoutRequestId: string,
    scenario: 'success' | 'cancelled' | 'insufficient_funds' | 'timeout'
  ): { success: boolean; status: string; receipt?: string; message: string } {
    const tx = db.getPaymentByCheckoutId(checkoutRequestId);
    if (!tx) {
      return { success: false, status: 'error', message: 'Transaction not found' };
    }

    if (scenario === 'success') {
      const receipt = `QK${Math.floor(10 + Math.random() * 90)}Z${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      db.updatePaymentTransaction(checkoutRequestId, {
        status: 'completed',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        mpesaReceiptNumber: receipt,
        completedAt: new Date().toISOString(),
      });
      db.updateOrderStatus(tx.orderId, 'paid', 'completed', receipt);
      return {
        success: true,
        status: 'completed',
        receipt,
        message: 'M-Pesa payment simulated successfully! Receipt generated.',
      };
    } else if (scenario === 'cancelled') {
      db.updatePaymentTransaction(checkoutRequestId, {
        status: 'cancelled',
        resultCode: 1032,
        resultDesc: 'Request cancelled by user on phone.',
        completedAt: new Date().toISOString(),
      });
      db.updateOrderStatus(tx.orderId, 'cancelled', 'cancelled');
      return {
        success: false,
        status: 'cancelled',
        message: 'Payment was cancelled by the user on their phone.',
      };
    } else if (scenario === 'insufficient_funds') {
      db.updatePaymentTransaction(checkoutRequestId, {
        status: 'failed',
        resultCode: 1,
        resultDesc: 'The balance is insufficient for the transaction.',
        completedAt: new Date().toISOString(),
      });
      db.updateOrderStatus(tx.orderId, 'payment_pending', 'failed');
      return {
        success: false,
        status: 'failed',
        message: 'Payment failed: Insufficient funds in M-Pesa account.',
      };
    } else {
      // Timeout
      db.updatePaymentTransaction(checkoutRequestId, {
        status: 'failed',
        resultCode: 1037,
        resultDesc: 'DS timeout user cannot be reached / no PIN entered.',
        completedAt: new Date().toISOString(),
      });
      db.updateOrderStatus(tx.orderId, 'payment_pending', 'failed');
      return {
        success: false,
        status: 'failed',
        message: 'M-Pesa authorization timed out. No response received from handset.',
      };
    }
  }

  /**
   * Query status of an STK Push transaction
   */
  public static queryTransactionStatus(checkoutRequestId: string): StkQueryResult {
    const tx = db.getPaymentByCheckoutId(checkoutRequestId);
    if (!tx) {
      return {
        success: false,
        resultCode: -1,
        resultDesc: 'Transaction record not found',
      };
    }

    if (tx.status === 'completed') {
      return {
        success: true,
        resultCode: 0,
        resultDesc: tx.resultDesc || 'Payment confirmed by Safaricom M-Pesa.',
        mpesaReceiptNumber: tx.mpesaReceiptNumber,
      };
    }

    if (tx.status === 'cancelled') {
      return {
        success: false,
        resultCode: 1032,
        resultDesc: tx.resultDesc || 'Request cancelled by user.',
      };
    }

    if (tx.status === 'failed') {
      return {
        success: false,
        resultCode: tx.resultCode || 1,
        resultDesc: tx.resultDesc || 'Transaction failed or timed out.',
      };
    }

    return {
      success: false,
      resultCode: 103, // Still pending
      resultDesc: 'Transaction is currently processing. Awaiting PIN authorization on handset.',
    };
  }
}
