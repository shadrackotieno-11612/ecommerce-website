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

  public static getBaseUrl(): string {
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
   * GET {baseUrl}/oauth/v1/generate?grant_type=client_credentials using Basic auth
   */
  public static async getAccessToken(): Promise<{ token: string | null; error?: string }> {
    const creds = this.getCredentials();
    if (!creds.consumerKey || !creds.consumerSecret || creds.consumerKey.includes('your_daraja')) {
      return { token: null, error: 'M-Pesa Consumer Key or Consumer Secret is not set.' };
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
        const errorText = await response.text().catch(() => response.statusText);
        console.error('Daraja OAuth token request failed:', response.status, errorText);
        return { token: null, error: `Daraja OAuth failed (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return { token: data.access_token || null };
    } catch (error: any) {
      console.error('Error fetching Daraja access token:', error);
      return { token: null, error: `Failed to connect to Safaricom Daraja: ${error.message}` };
    }
  }

  /**
   * Initiate STK Push (Lipa na M-Pesa Online)
   * 1. Get access token from {baseUrl}/oauth/v1/generate?grant_type=client_credentials using Basic auth with MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.
   * 2. POST to {baseUrl}/mpesa/stkpush/v1/processrequest with BusinessShortCode, Password, Timestamp, TransactionType, Amount, PartyA, PartyB, PhoneNumber, CallBackURL, AccountReference and TransactionDesc.
   * 3. Save real MerchantRequestID and CheckoutRequestID returned, and return clear error messages if Safaricom rejects the request.
   * Only allow simulated mode when MPESA_CONSUMER_KEY is empty AND NODE_ENV is not production.
   */
  public static async initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
    const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
    const creds = this.getCredentials();
    const isProduction = process.env.NODE_ENV === 'production';

    // Validate phone number format (must be 12 digits starting with 2547 or 2541)
    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      return {
        success: false,
        error: 'Invalid Safaricom phone number. Must start with 07, 01, or +254.',
      };
    }

    const timestamp = this.getTimestamp();
    const password = this.generatePassword(creds.shortcode, creds.passkey, timestamp);

    // If MPESA_CONSUMER_KEY is provided, perform real Safaricom Daraja STK Push
    if (creds.consumerKey && !creds.consumerKey.includes('your_daraja')) {
      const { token: accessToken, error: tokenError } = await this.getAccessToken();

      if (!accessToken) {
        return {
          success: false,
          error: tokenError || 'Failed to authenticate with Safaricom Daraja OAuth service.',
        };
      }

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
          // Record real pending transaction
          await db.createPaymentTransaction({
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
          await db.updateOrderStatus(params.orderId, 'payment_pending', 'processing');

          return {
            success: true,
            merchantRequestId: data.MerchantRequestID,
            checkoutRequestId: data.CheckoutRequestID,
            responseCode: data.ResponseCode,
            customerMessage: data.CustomerMessage || 'STK Push sent successfully. Please check your phone.',
          };
        } else {
          // Return clear error message when Safaricom rejects request
          const errorMessage =
            data.errorMessage ||
            data.ResponseDescription ||
            `STK Push rejected by Safaricom Daraja (code: ${data.ResponseCode || response.status}).`;
          return {
            success: false,
            error: errorMessage,
          };
        }
      } catch (err: any) {
        console.error('Real Safaricom Daraja STK Push request failed:', err);
        return {
          success: false,
          error: `Network error communicating with Safaricom Daraja: ${err.message}`,
        };
      }
    }

    // If MPESA_CONSUMER_KEY is empty:
    // Only allow fake simulated mode when MPESA_CONSUMER_KEY is empty AND NODE_ENV is not production
    if (isProduction) {
      return {
        success: false,
        error: 'MPESA_CONSUMER_KEY is required in production environment.',
      };
    }

    // Local / Dev Fallback Simulator (only when MPESA_CONSUMER_KEY is empty and NODE_ENV !== production)
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const merchantRequestId = `MR-${Date.now()}-${randomHex}`;
    const checkoutRequestId = `ws_CO_${timestamp}_${randomHex}`;

    // Record payment transaction in pending state
    await db.createPaymentTransaction({
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
    await db.updateOrderStatus(params.orderId, 'payment_pending', 'processing');

    return {
      success: true,
      merchantRequestId,
      checkoutRequestId,
      responseCode: '0',
      responseDescription: 'Success. Request accepted for processing in simulated mode.',
      customerMessage: `Simulated STK Push: Check phone ${formattedPhone} for M-Pesa PIN prompt.`,
      isSimulated: true,
    };
  }

  /**
   * Process Safaricom Daraja STK Callback
   * Only accept results for payments that are still pending, and check that
   * the amount paid matches the order total before marking the order as paid.
   */
  public static async handleCallback(body: any): Promise<{ success: boolean; message: string }> {
    try {
      const stkCallback = body?.Body?.stkCallback;
      if (!stkCallback) {
        return { success: false, message: 'Invalid M-Pesa callback payload' };
      }

      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
        stkCallback;

      const existingTx = await db.getPaymentByCheckoutId(CheckoutRequestID);
      if (!existingTx) {
        console.warn(`No payment transaction found for checkoutRequestId: ${CheckoutRequestID}`);
        return { success: false, message: 'Transaction not found' };
      }

      // Only accept results for payments that are still pending
      if (existingTx.status !== 'processing') {
        console.warn(`Payment transaction ${CheckoutRequestID} is not pending (status: ${existingTx.status})`);
        return { success: false, message: `Payment is already settled or not in pending state (status: ${existingTx.status})` };
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
        // Retrieve associated order to verify total amount
        const order = await db.getOrderById(existingTx.orderId);
        if (!order) {
          console.error(`Order ${existingTx.orderId} not found for callback payment ${CheckoutRequestID}`);
          return { success: false, message: 'Order record not found' };
        }

        // Check that the amount paid matches the order total before marking the order as paid
        if (amountPaid === undefined || Math.round(amountPaid) !== Math.round(order.totalAmount)) {
          console.error(
            `M-Pesa payment amount mismatch! Order Total: ${order.totalAmount}, Amount Paid: ${amountPaid}`
          );
          await db.updatePaymentTransaction(CheckoutRequestID, {
            status: 'failed',
            resultCode: ResultCode,
            resultDesc: `Amount mismatch: Paid KES ${amountPaid} but order total is KES ${order.totalAmount}`,
            completedAt: new Date().toISOString(),
          });
          return {
            success: false,
            message: `Amount paid (${amountPaid}) does not match order total (${order.totalAmount}). Order not marked as paid.`,
          };
        }

        // Payment Succeeded and verified
        const receipt = mpesaReceiptNumber || `NL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        await db.updatePaymentTransaction(CheckoutRequestID, {
          status: 'completed',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          mpesaReceiptNumber: receipt,
          completedAt: new Date().toISOString(),
        });

        await db.updateOrderStatus(existingTx.orderId, 'paid', 'completed', receipt);

        return { success: true, message: 'Payment verified and settled successfully' };
      } else {
        // Payment Failed, Cancelled, or Timed out
        const status = ResultCode === 1032 ? 'cancelled' : 'failed';

        await db.updatePaymentTransaction(CheckoutRequestID, {
          status,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          completedAt: new Date().toISOString(),
        });

        await db.updateOrderStatus(existingTx.orderId, 'payment_pending', status);

        return { success: true, message: `Payment failed with code ${ResultCode}: ${ResultDesc}` };
      }
    } catch (err: any) {
      console.error('Error handling M-Pesa callback:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Simulate M-Pesa Sandbox response for immediate interactive testing (dev only)
   */
  public static async simulateSandboxResponse(
    checkoutRequestId: string,
    scenario: 'success' | 'cancelled' | 'insufficient_funds' | 'timeout'
  ): Promise<{ success: boolean; status: string; receipt?: string; message: string }> {
    const tx = await db.getPaymentByCheckoutId(checkoutRequestId);
    if (!tx) {
      return { success: false, status: 'error', message: 'Transaction not found' };
    }

    if (scenario === 'success') {
      const receipt = `QK${Math.floor(10 + Math.random() * 90)}Z${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await db.updatePaymentTransaction(checkoutRequestId, {
        status: 'completed',
        resultCode: 0,
        resultDesc: 'The service request is processed successfully.',
        mpesaReceiptNumber: receipt,
        completedAt: new Date().toISOString(),
      });
      await db.updateOrderStatus(tx.orderId, 'paid', 'completed', receipt);
      return {
        success: true,
        status: 'completed',
        receipt,
        message: 'M-Pesa payment simulated successfully! Receipt generated.',
      };
    } else if (scenario === 'cancelled') {
      await db.updatePaymentTransaction(checkoutRequestId, {
        status: 'cancelled',
        resultCode: 1032,
        resultDesc: 'Request cancelled by user on phone.',
        completedAt: new Date().toISOString(),
      });
      await db.updateOrderStatus(tx.orderId, 'cancelled', 'cancelled');
      return {
        success: false,
        status: 'cancelled',
        message: 'Payment was cancelled by the user on their phone.',
      };
    } else if (scenario === 'insufficient_funds') {
      await db.updatePaymentTransaction(checkoutRequestId, {
        status: 'failed',
        resultCode: 1,
        resultDesc: 'The balance is insufficient for the transaction.',
        completedAt: new Date().toISOString(),
      });
      await db.updateOrderStatus(tx.orderId, 'payment_pending', 'failed');
      return {
        success: false,
        status: 'failed',
        message: 'Payment failed: Insufficient funds in M-Pesa account.',
      };
    } else {
      // Timeout
      await db.updatePaymentTransaction(checkoutRequestId, {
        status: 'failed',
        resultCode: 1037,
        resultDesc: 'DS timeout user cannot be reached / no PIN entered.',
        completedAt: new Date().toISOString(),
      });
      await db.updateOrderStatus(tx.orderId, 'payment_pending', 'failed');
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
  public static async queryTransactionStatus(checkoutRequestId: string): Promise<StkQueryResult> {
    const tx = await db.getPaymentByCheckoutId(checkoutRequestId);
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
