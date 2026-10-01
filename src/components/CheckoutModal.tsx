import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const KENYAN_COUNTIES = [
  'Nairobi',
  'Mombasa',
  'Kiambu',
  'Nakuru',
  'Kisumu',
  'Machakos',
  'Uasin Gishu',
  'Kajiado',
  'Kilifi',
  'Nyeri',
  'Meru',
  'Murang\'a',
  'Kakamega',
  'Bungoma',
  'Trans Nzoia',
  'Kericho',
  'Baringo',
  'Laikipia',
  'Embu',
  'Kirinyaga',
  'Kisii',
  'Homa Bay',
  'Migori',
  'Siaya',
  'Kitui',
  'Makueni',
  'Kwale',
  'Lamu',
  'Taita Taveta',
  'Garissa',
  'Wajir',
  'Mandera',
  'Marsabit',
  'Isiolo',
  'Turkana',
  'West Pokot',
  'Samburu',
  'Elgeyo Marakwet',
  'Nandi',
  'Bomet',
  'Narok',
  'Vihiga',
  'Busia',
  'Nyamira',
  'Tana River',
  'Tharaka Nithi',
];

interface CheckoutModalProps {
  onOrderCompleted?: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onOrderCompleted }) => {
  const { t, formatPrice } = useI18n();
  const { user } = useAuth();
  const {
    cartItems,
    clearCart,
    subtotal,
    deliveryFee,
    totalAmount,
    checkoutModalOpen,
    setCheckoutModalOpen,
  } = useCart();

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '0712 345 678');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '');
  const [county, setCounty] = useState(user?.county || 'Nairobi');
  const [town, setTown] = useState(user?.town || 'Nairobi');
  const [notes, setNotes] = useState('');

  // Payment flow states
  // 'form' -> 'stk_waiting' -> 'success' | 'failed'
  const [flowState, setFlowState] = useState<'form' | 'stk_waiting' | 'success' | 'failed'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [mpesaReceipt, setMpesaReceipt] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Sync user details if user logs in during session
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.fullName);
      if (!email) setEmail(user.email);
      if (!phone) setPhone(user.phone);
      if (!deliveryAddress) setDeliveryAddress(user.deliveryAddress || '');
      if (!county) setCounty(user.county || 'Nairobi');
      if (!town) setTown(user.town || 'Nairobi');
    }
  }, [user]);

  // STK Push Countdown and Polling
  useEffect(() => {
    let timer: any;
    let pollInterval: any;

    if (flowState === 'stk_waiting' && checkoutRequestId) {
      setCountdown(30);

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll transaction status every 2.5s
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/mpesa/query/${checkoutRequestId}`);
          const data = await res.json();
          if (data.resultCode === 0) {
            clearInterval(pollInterval);
            clearInterval(timer);
            setMpesaReceipt(data.mpesaReceiptNumber || 'NL' + Math.random().toString(36).substring(2, 9).toUpperCase());
            setFlowState('success');
            clearCart();
          } else if (data.resultCode === 1032 || data.resultCode === 1 || data.resultCode === 1037) {
            clearInterval(pollInterval);
            clearInterval(timer);
            setErrorMessage(data.resultDesc || t.errors.mpesaFailed);
            setFlowState('failed');
          }
        } catch (err) {
          console.warn('Status poll failed:', err);
        }
      }, 2500);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [flowState, checkoutRequestId]);

  if (!checkoutModalOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Create the order in the database
      const orderPayload = {
        userId: user?.id || 'guest',
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        deliveryAddress,
        county,
        town,
        notes,
        items: cartItems.map((ci) => ({
          itemId: ci.itemId,
          itemType: ci.itemType,
          name: ci.name,
          quantity: ci.quantity,
          price: ci.price,
          image: ci.image,
        })),
      };

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to submit order.');
      }

      setCreatedOrderNumber(orderData.orderNumber);
      setCreatedOrderId(orderData.id);

      // 2. Trigger Safaricom Daraja STK Push
      const stkRes = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          amount: orderData.totalAmount,
          phoneNumber: phone,
        }),
      });

      const stkData = await stkRes.json();
      if (!stkRes.ok) {
        throw new Error(stkData.error || 'Failed to initiate M-Pesa STK Push prompt.');
      }

      setCheckoutRequestId(stkData.checkoutRequestId);
      setFlowState('stk_waiting');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Sandbox responses for quick developer testing
  const handleSimulate = async (scenario: 'success' | 'cancelled' | 'insufficient_funds' | 'timeout') => {
    if (!checkoutRequestId) return;
    try {
      const res = await fetch('/api/mpesa/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutRequestId,
          scenario,
        }),
      });
      const data = await res.json();
      if (data.status === 'completed') {
        setMpesaReceipt(data.receipt || 'NL' + Math.random().toString(36).substring(2, 9).toUpperCase());
        setFlowState('success');
        clearCart();
      } else {
        setErrorMessage(data.message || t.errors.mpesaFailed);
        setFlowState('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation error');
    }
  };

  const handleClose = () => {
    setCheckoutModalOpen(false);
    // Reset flow after closing
    setTimeout(() => {
      setFlowState('form');
      setErrorMessage('');
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 z-10 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
              M
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">{t.checkout.title}</h2>
              <p className="text-xs text-stone-400">{t.checkout.secureBadge}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body based on flowState */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && flowState !== 'failed' && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. CHECKOUT FORM */}
          {flowState === 'form' && (
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Customer Contact */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  {t.checkout.contactInfo}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {t.checkout.fullName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Amina Wanjiku"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {t.checkout.phoneNumber} (M-Pesa) *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
                    />
                    <span className="text-[11px] text-stone-600 mt-1 block">
                      {t.checkout.phoneHint}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.checkout.email} *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amina@example.com"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-3 pt-3 border-t border-stone-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  {t.checkout.deliveryAddress}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {t.checkout.county} *
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    >
                      {KENYAN_COUNTIES.map((c) => (
                        <option key={c} value={c} className="text-black">
                          {c} County
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      {t.checkout.town} *
                    </label>
                    <input
                      type="text"
                      required
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      placeholder="e.g. Westlands / Kilimani"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.checkout.deliveryAddress} *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t.checkout.deliveryAddressPlaceholder}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    {t.checkout.orderNotes}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Gate code or special scheduling requirements"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-sm text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{t.cart.subtotal} ({cartItems.length} items)</span>
                  <span className="font-semibold text-stone-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>{t.cart.deliveryFee}</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryFee === 0 ? t.cart.freeDelivery : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>{t.cart.total}</span>
                  <span className="text-emerald-700">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* M-Pesa STK Notice */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t.checkout.mPesaNotice}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t.checkout.processingPayment}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{t.checkout.payWithMpesa} ({formatPrice(totalAmount)})</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. STK PUSH WAITING SCREEN */}
          {flowState === 'stk_waiting' && (
            <div className="py-6 text-center space-y-6">
              <div className="relative mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 animate-pulse">
                <Smartphone className="w-10 h-10" />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                  !
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-stone-900">{t.mpesa.promptSent}</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
                  {t.mpesa.promptDesc
                    .replace('{amount}', totalAmount.toString())
                    .replace('{orderNumber}', createdOrderNumber)}
                </p>
              </div>

              {/* Countdown / Polling indicator */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 max-w-sm mx-auto space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{t.mpesa.timeRemaining.replace('{seconds}', countdown.toString())}</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 30) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-stone-600">
                  {t.mpesa.waitingForPin}
                </div>
              </div>

              {/* Developer Sandbox Simulation Helper */}
              <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>{t.mpesa.sandboxSimulator}</span>
                </div>
                <p className="text-[11px] text-amber-800 mb-3 leading-relaxed">
                  {t.mpesa.sandboxHelp}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => handleSimulate('success')}
                    className="px-3 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Simulate PIN Success</span>
                  </button>
                  <button
                    onClick={() => handleSimulate('cancelled')}
                    className="px-3 py-2 bg-stone-800 text-stone-100 rounded-xl hover:bg-stone-900 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Simulate User Cancel</span>
                  </button>
                  <button
                    onClick={() => handleSimulate('insufficient_funds')}
                    className="px-3 py-2 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Simulate Low Balance</span>
                  </button>
                  <button
                    onClick={() => handleSimulate('timeout')}
                    className="px-3 py-2 bg-rose-700 text-white rounded-xl hover:bg-rose-800 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Simulate Handset Timeout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. PAYMENT SUCCESSFUL SCREEN */}
          {flowState === 'success' && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-stone-900">{t.mpesa.paymentSuccessful}</h3>
                <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
                  {t.mpesa.paymentSuccessfulDesc}
                </p>
              </div>

              {/* Receipt Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500">{t.orders.orderNumber}</span>
                  <span className="font-bold text-stone-900 font-mono">{createdOrderNumber}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500">{t.mpesa.receiptNumber}</span>
                  <span className="font-bold text-emerald-800 font-mono tracking-wider">
                    {mpesaReceipt}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500">M-Pesa Number</span>
                  <span className="font-medium text-stone-900 font-mono">{phone}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-stone-500">{t.cart.total}</span>
                  <span className="font-black text-stone-900 text-sm">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    onOrderCompleted?.(createdOrderId);
                  }}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-xs"
                >
                  {t.mpesa.viewOrder}
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  {t.mpesa.continueShopping}
                </button>
              </div>
            </div>
          )}

          {/* 4. PAYMENT FAILED SCREEN */}
          {flowState === 'failed' && (
            <div className="py-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-stone-900">{t.mpesa.paymentFailed}</h3>
                <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
                  {errorMessage || t.errors.mpesaFailed}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setFlowState('form')}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-xs"
                >
                  {t.mpesa.tryAgain}
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
