import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { MapPicker } from '../../components/MapPicker.tsx';
import { 
  CreditCard, 
  MapPin, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  QrCode,
  ShieldCheck, 
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';

interface CheckoutProps {
  onNavigate: (view: string) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onNavigate, onAlert }) => {
  const { user, token } = useAuth();
  const { total, deliveryFee, discount, subtotal, appliedCoupon, clearCartState, deliveryType } = useCart();
  const { t } = useLanguage();

  // Delivery details form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('Phnom Penh');
  const [district, setDistrict] = useState('Chamkar Mon');
  const [commune, setCommune] = useState('Boeung Keng Kang 1');
  const [postal, setPostal] = useState('120101');
  const [latitude, setLatitude] = useState(11.5564);
  const [longitude, setLongitude] = useState(104.9282);
  const [notes, setNotes] = useState('');

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'khqr' | 'bakong' | 'wing' | 'paypal'>('khqr');
  const [loading, setLoading] = useState(false);

  // Modals & Simulations
  const [activePaymentModal, setActivePaymentModal] = useState<boolean>(false);
  const [createdOrderMeta, setCreatedOrderMeta] = useState<any>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const handleMapChange = (lat: number, lng: number, calculatedAddr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(calculatedAddr);

    // Dynamic Phnom Penh Geocode splits based on location for extreme realism!
    if (lat > 11.565) {
      setDistrict('Daun Penh');
      setCommune('Wat Phnom');
      setPostal('120211');
    } else if (lat < 11.545) {
      setDistrict('Chamkar Mon');
      setCommune('Toul Tom Poung');
      setPostal('120102');
    } else if (lng < 104.91) {
      setDistrict('Tuol Kork');
      setCommune('Boeung Kak Ti Muoy');
      setPostal('120401');
    } else if (lng > 104.94) {
      setDistrict('Chbar Ampov');
      setCommune('Chbar Ampov Ti Muoy');
      setPostal('120501');
    } else {
      setDistrict('Chamkar Mon');
      setCommune('Boeung Keng Kang Ti Muoy');
      setPostal('120101');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!name || !phone || !address) {
      onAlert('Please verify that receiver name, phone, and coordinates are set.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverName: name,
          receiverPhone: phone,
          receiverEmail: email,
          deliveryAddress: address,
          provinceCity: province,
          districtKhan: district,
          communeSangkat: commune,
          postalCode: postal,
          latitude,
          longitude,
          couponCode: appliedCoupon?.code || '',
          paymentMethod,
          deliveryType,
          deliveryNotes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order registration failed');

      setCreatedOrderMeta(data);

      if (paymentMethod === 'cod') {
        // COD skips verification popups, completes instantly!
        onAlert('Order placed successfully (Cash on Delivery)!', 'success');
        clearCartState();
        onNavigate('orders');
      } else {
        // Open interactive KHQR or PayPal verified simulator dialog!
        setActivePaymentModal(true);
      }
    } catch (err: any) {
      onAlert(err.message || 'Checkout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Simulates scanning KHQR on banking apps or approving PayPal
  const simulatePaymentVerification = async () => {
    if (!createdOrderMeta) return;
    setVerifyingPayment(true);
    
    // Artificial 2-second banking gateway verification delay
    setTimeout(async () => {
      try {
        const txnNumber = paymentMethod === 'paypal' 
          ? `PAYPAL-${Math.floor(100000 + Math.random() * 900000)}-PP` 
          : `TXN-${Math.floor(10000 + Math.random() * 90000)}-ABA`;

        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrderMeta.orderId,
            transactionNumber: txnNumber
          })
        });

        if (res.ok) {
          onAlert('Payment cleared successfully! CONFETTI triggered.', 'success');
          setActivePaymentModal(false);
          clearCartState();
          onNavigate('orders');
        } else {
          onAlert('Payment verification gateway returned an error.', 'error');
        }
      } catch (err) {
        onAlert('Error reaching payment verifier.', 'error');
      } finally {
        setVerifyingPayment(false);
      }
    }, 2000);
  };

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6.5 h-6.5 text-emerald-500" />
          {t('tracking.title')}
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Drop your delivery pin on the map and choose a payment integration
        </p>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Coordinates picking & details form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Map coordinate picker card */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <MapPicker 
              initialLat={latitude}
              initialLng={longitude}
              onChange={handleMapChange}
            />
          </div>

          {/* Delivery Fields Card */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-1">
              <MapPin className="w-4 h-4 text-emerald-500 animate-bounce-subtle" />
              {t('form.receiver')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receiver Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('form.receiver')}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text" required placeholder="e.g. Makara Sok"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Receiver Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('form.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel" required placeholder="+855 12 345 678"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" placeholder="customer@sleekcart.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Map Dropped Address Description</label>
                <input
                  type="text" required placeholder="Select coordinate on map to reverse geocode"
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 outline-none text-xs"
                />
              </div>
            </div>

            {/* Geocoded Zone Splits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-900/85 p-3 rounded-2xl">
              <div className="text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 block uppercase font-bold text-[8px]">Province / City</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{province}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 block uppercase font-bold text-[8px]">District / Khan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{district}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 block uppercase font-bold text-[8px]">Commune / Sangkat</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{commune}</span>
              </div>
              <div className="text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 block uppercase font-bold text-[8px]">Postal Code</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{postal}</span>
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('form.note')}</label>
              <input
                type="text" placeholder="e.g. Ring bell, drop with lobby receptionist, call 10 mins before arrival..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
              />
            </div>

          </div>

        </div>

        {/* Right Column: Payment selection & aggregates checkout execution */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Payment Integrations Selector */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Online Payment Integration
            </h3>

            <div className="flex flex-col gap-2">
              {/* ABA KHQR */}
              <button
                type="button" onClick={() => setPaymentMethod('khqr')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  paymentMethod === 'khqr' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-7 h-7 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0">ABA</div>
                <div>
                  <p className="font-bold">ABA KHQR scan</p>
                  <p className="text-[9px] text-slate-400 font-medium">Auto detect verified. Local Cambodian standard.</p>
                </div>
              </button>

              {/* Bakong KHQR */}
              <button
                type="button" onClick={() => setPaymentMethod('bakong')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  paymentMethod === 'bakong' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0">BK</div>
                <div>
                  <p className="font-bold">Bakong KHQR</p>
                  <p className="text-[9px] text-slate-400 font-medium">National Bank of Cambodia QR gateway.</p>
                </div>
              </button>

              {/* Wing Pay */}
              <button
                type="button" onClick={() => setPaymentMethod('wing')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  paymentMethod === 'wing' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-7 h-7 bg-green-500 text-white rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0">WNG</div>
                <div>
                  <p className="font-bold">Wing Payment</p>
                  <p className="text-[9px] text-slate-400 font-medium">Local Wing merchant e-wallet code check.</p>
                </div>
              </button>

              {/* PayPal */}
              <button
                type="button" onClick={() => setPaymentMethod('paypal')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  paymentMethod === 'paypal' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-7 h-7 bg-sky-600 text-white rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0">PP</div>
                <div>
                  <p className="font-bold">PayPal Global Transfer</p>
                  <p className="text-[9px] text-slate-400 font-medium">International visa/master balances.</p>
                </div>
              </button>

              {/* Cash on Delivery */}
              <button
                type="button" onClick={() => setPaymentMethod('cod')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  paymentMethod === 'cod' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-7 h-7 bg-amber-500 text-white rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0">COD</div>
                <div>
                  <p className="font-bold">Cash on Delivery (COD)</p>
                  <p className="text-[9px] text-slate-400 font-medium">Pay physical cash upon courier arrival.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Pricing Summary Execution Card */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-3">
            <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mb-2">Invoice Summary</h3>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>{t('ui.subtotal')}</span>
              <span className="font-semibold text-slate-750 dark:text-slate-200">${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-500 font-semibold">
                <span>Voucher discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>{t('ui.fee')}</span>
              <span className="font-semibold text-slate-750 dark:text-slate-200">${deliveryFee.toFixed(2)}</span>
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white">{t('ui.total')}</span>
              <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white">${total.toFixed(2)}</span>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full btn-premium py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
              {paymentMethod === 'cod' ? 'Complete Cash Order' : t('ui.place_order')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </form>

      {/* ========================================================= */}
      {/* 4. INTERACTIVE PAYMENT VERIFIER MODAL (ABA/BAKONG/PAYPAL SIMULATOR) */}
      {/* ========================================================= */}
      {activePaymentModal && createdOrderMeta && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          
          <div className="w-full max-w-sm glass rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 relative flex flex-col items-center animate-scale-in">
            
            {/* Close */}
            <button 
              onClick={() => {
                setActivePaymentModal(false);
                clearCartState();
                onNavigate('orders');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo */}
            {paymentMethod === 'paypal' ? (
              <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 font-extrabold text-xl mb-4 shadow-sm border border-sky-200/30">
                PayPal
              </div>
            ) : (
              <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-xs mb-4 shadow-md border-2 border-white">
                KHQR
              </div>
            )}

            <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white text-center">
              {paymentMethod === 'paypal' ? 'Authorize PayPal balance' : 'Scan to clear payment'}
            </h3>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1 leading-snug max-w-[240px]">
              {paymentMethod === 'paypal' 
                ? 'Sign in to confirm transfer invoice total.' 
                : 'Open your local Cambodian mobile banking application (ABA Mobile, Bakong, Wing) to scan standard KHQR code.'}
            </p>

            {/* QR Code Canvas */}
            {paymentMethod !== 'paypal' ? (
              <div className="relative border-4 border-slate-100 dark:border-slate-800 bg-white p-4 rounded-2xl my-6 flex flex-col items-center justify-center shadow-inner group">
                <QrCode className="w-40 h-40 text-slate-800 group-hover:scale-101 transition-transform" />
                
                {/* Visual Bakong inner logo mock overlay */}
                <div className="absolute inset-0 m-auto w-10 h-10 bg-red-600 text-white font-extrabold rounded-lg flex items-center justify-center text-[10px] border border-white shadow shadow-red-600/35">
                  BK
                </div>
              </div>
            ) : (
              // PayPal credentials panel
              <div className="w-full flex flex-col gap-3 my-6 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                <div className="text-left text-[10px]">
                  <span className="text-slate-400 font-bold block">PAYPAL INVOICE TOTAL</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">${total.toFixed(2)} USD</span>
                </div>
                <div className="text-left text-[9px] text-slate-400 mt-1 leading-relaxed">
                  Click the button below to authorize simulated login verification.
                </div>
              </div>
            )}

            {/* Details */}
            <div className="w-full flex justify-between items-center text-[10px] bg-slate-100 dark:bg-slate-900 py-2 px-3 rounded-xl mb-6">
              <span className="font-semibold text-slate-400">Order ID: #{createdOrderMeta.orderId.substring(4)}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Amount Due: ${total.toFixed(2)}</span>
            </div>

            {/* Scan verification trigger */}
            <button
              onClick={simulatePaymentVerification}
              disabled={verifyingPayment}
              className="w-full btn-premium py-2.8 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {verifyingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Gateway...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {paymentMethod === 'paypal' ? 'Simulate PayPal Authorization' : 'Simulate QR Code Scan'}
                </>
              )}
            </button>

            {/* Note */}
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 text-center leading-snug">
              🔒 Standard PCI-DSS secure sandbox clearance network.
            </p>

          </div>

        </div>
      )}

    </div>
  );
};
