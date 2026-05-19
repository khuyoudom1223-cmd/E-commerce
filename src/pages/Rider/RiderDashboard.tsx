import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TrackingMap } from '../../components/TrackingMap.tsx';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Coins, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Eye,
  RefreshCw,
  Play
} from 'lucide-react';

interface RiderDashboardProps {
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const RiderDashboard: React.FC<RiderDashboardProps> = ({ onAlert }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  
  // Dashboard states
  const [assigned, setAssigned] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);

  // Sync rider dashboard metrics
  const loadRiderData = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/rider/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAssigned(data.assigned || []);
        setAvailable(data.availablePool || []);
        
        // Select first active assigned delivery by default if not set
        if (data.assigned && data.assigned.length > 0 && !activeDelivery) {
          // Find first not delivered
          const notDelivered = data.assigned.find((d: any) => d.deliveryStatus !== 'delivered');
          if (notDelivered) setActiveDelivery(notDelivered);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRiderData();
  }, [token]);

  // One-click claim neighborhood available request
  const claimDelivery = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/rider/orders/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        onAlert('Neighborhood trip accepted! Prepare package for pickup.', 'success');
        loadRiderData();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      onAlert(err.message || 'Could not claim order request', 'error');
    }
  };

  // Status transitioner (shipping -> out_for_delivery -> delivered / failed)
  const updateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/rider/orders/${id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (res.ok) {
        onAlert(`Delivery status successfully advanced: ${newStatus.toUpperCase()}`, 'success');
        loadRiderData();
        
        // Refresh detail view state
        if (activeDelivery && activeDelivery.id === id) {
          setActiveDelivery((prev: any) => prev ? { ...prev, deliveryStatus: newStatus } : null);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      onAlert(err.message || 'Status transition failed', 'error');
    }
  };

  if (loading && assigned.length === 0 && available.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Syncing active rider routes...</span>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <Truck className="w-6.5 h-6.5 text-emerald-500" />
            {t('rider.portal')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('rider.portal_desc')}
          </p>
        </div>
        <button
          onClick={loadRiderData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 hover:bg-slate-50 active:scale-95 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Available pools & active schedules */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Active Assigned Deliveries */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              {t('rider.my_active')} ({assigned.filter(a => a.deliveryStatus !== 'delivered').length})
            </h3>

            {assigned.filter(a => a.deliveryStatus !== 'delivered').length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">🛵</span>
                <p className="text-xs font-bold mt-2">{t('rider.idle')}</p>
                <p className="text-[10px] text-slate-450 mt-0.5">{t('rider.idle_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto">
                {assigned.filter(a => a.deliveryStatus !== 'delivered').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveDelivery(item)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      activeDelivery?.id === item.id 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'border-slate-150 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 hover:bg-slate-100/50'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{t('rider.my_active')} #{item.orderId.substring(4)}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{t('admin.to') || 'To'}: {item.receiverName} ({item.communeSangkat})</p>
                    </div>
                    <span className="text-[9px] uppercase font-extrabold">{t('status.' + item.deliveryStatus)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* neighborhood available deliveries requests pool */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              {t('rider.unassigned')} ({available.length})
            </h3>

            {available.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">📦</span>
                <p className="text-xs font-bold mt-2">{t('rider.pool_clear')}</p>
                <p className="text-[10px] text-slate-450 mt-0.5">{t('rider.pool_clear_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {available.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex flex-col gap-2 shadow-sm text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{t('ui.cart')} #{item.orderId.substring(4)}</h4>
                        <p className="text-[9px] text-slate-400 font-medium">{t('rider.store')}: {item.vendor?.storeName}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
                        {t('ui.fee') || 'Fee'}: +${item.deliveryFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t('rider.store')} ➔ {item.deliveryAddress}</span>
                    </div>

                    <button
                      onClick={() => claimDelivery(item.id)}
                      className="w-full btn-premium py-1.8 rounded-lg text-[10px] font-bold active:scale-95 transition-transform"
                    >
                      {t('rider.accept_trip')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Active Navigation Roadmap & Status controllers */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeDelivery ? (
            <>
              {/* Map viewport navigator */}
              <div className="w-full h-[320px] relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/80">
                <TrackingMap 
                  riderLat={user?.id === 'usr_rider1' ? 11.5540 : 11.5620} // placeholder coordinate fallback prior to drive tick
                  riderLng={user?.id === 'usr_rider1' ? 104.9180 : 104.9350}
                  customerLat={activeDelivery.latitude}
                  customerLng={activeDelivery.longitude}
                  vendorLat={activeDelivery.vendorId === 'vnd_2' ? 11.5540 : activeDelivery.vendorId === 'vnd_3' ? 11.5450 : 11.5564}
                  vendorLng={activeDelivery.vendorId === 'vnd_2' ? 104.9310 : activeDelivery.vendorId === 'vnd_3' ? 104.9200 : 104.9282}
                  riderName={user?.name || 'My Scooter'}
                  status={activeDelivery.deliveryStatus}
                />

                {/* Left floating header details on map */}
                <div className="absolute top-4 left-4 glass py-2 px-3 rounded-2xl z-[999] pointer-events-none text-xs flex flex-col gap-0.5 border border-slate-200/40">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{t('rider.my_active')}</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">#{activeDelivery.orderId.substring(4)}</span>
                </div>
              </div>

              {/* Courier Status controller box */}
              <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
                <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  {t('rider.nav_control')}
                </h3>

                {/* Client info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/20 p-3 rounded-2xl">
                  <div className="text-xs flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">{t('rider.receiver')}</span>
                    <span className="font-bold text-slate-850 dark:text-slate-250">{activeDelivery.receiverName}</span>
                    <a href={`tel:${activeDelivery.receiverPhone}`} className="text-emerald-500 font-semibold hover:underline mt-0.5">
                      📞 {activeDelivery.receiverPhone}
                    </a>
                  </div>
                  <div className="text-xs flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-[9px] uppercase">{t('rider.store')}</span>
                    <span className="font-bold text-slate-850 dark:text-slate-250">{activeDelivery.vendor?.storeName}</span>
                    <span className="text-slate-400 text-[10px] mt-0.5">📍 {activeDelivery.vendor?.address}</span>
                  </div>
                </div>

                {activeDelivery.deliveryNotes && (
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 p-3 rounded-2xl text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{t('rider.remark')}: "{activeDelivery.deliveryNotes}"</p>
                  </div>
                )}

                {/* Status action buttons switcher */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    {t('rider.advance')}:
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    {/* Packing complete -> ship out */}
                    <button
                      onClick={() => updateStatus(activeDelivery.id, 'shipping')}
                      disabled={activeDelivery.deliveryStatus !== 'packing'}
                      className="py-2.5 rounded-xl border text-[10px] font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:scale-100 bg-white/40 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/30"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-500" />
                      {t('rider.ship_out')}
                    </button>

                    {/* Ship out -> Out for delivery (TRIGGERS GPS DRIVING TICKER) */}
                    <button
                      onClick={() => updateStatus(activeDelivery.id, 'out_for_delivery')}
                      disabled={activeDelivery.deliveryStatus !== 'shipping'}
                      className="py-2.5 rounded-xl border text-[10px] font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:scale-100 bg-gradient-to-tr from-emerald-50 to-emerald-100/50 dark:from-slate-900 dark:to-slate-800 border-emerald-500/20 dark:border-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-500 animate-pulse-subtle" />
                      {t('rider.start_gps')}
                    </button>

                    {/* Completed Delivery */}
                    <button
                      onClick={() => updateStatus(activeDelivery.id, 'delivered')}
                      disabled={activeDelivery.deliveryStatus !== 'out_for_delivery'}
                      className="py-2.5 rounded-xl border text-[10px] font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:scale-100 bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('rider.confirm_handover')}
                    </button>

                    {/* Failed Delivery */}
                    <button
                      onClick={() => updateStatus(activeDelivery.id, 'failed')}
                      disabled={!['shipping', 'out_for_delivery'].includes(activeDelivery.deliveryStatus)}
                      className="py-2.5 rounded-xl border border-rose-250 dark:border-rose-950/20 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-[10px] font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <AlertCircle className="w-3.5 h-3.5 animate-pulse-subtle" />
                      {t('rider.failed_trip')}
                    </button>

                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="glass rounded-3xl p-10 text-center border border-slate-200/50 dark:border-slate-800/60 shadow-sm col-span-2">
              <span className="text-4xl">🗺️</span>
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mt-4 font-bold">{t('rider.no_nav')}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {t('rider.no_nav_desc')}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
