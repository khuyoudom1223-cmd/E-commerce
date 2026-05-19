import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TrackingMap } from '../../components/TrackingMap.tsx';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  ListOrdered,
  Sparkles,
  ArrowLeft,
  Bell
} from 'lucide-react';

interface OrderTrackingProps {
  onNavigate: (view: string) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ onNavigate, onAlert }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live SSE stream states
  const [liveCoords, setLiveCoords] = useState<{ lat?: number; lng?: number }>({});
  const [liveStatus, setLiveStatus] = useState<string>('pending');
  const [liveEta, setLiveEta] = useState<string>('30');
  const [liveRider, setLiveRider] = useState<any>(null);
  const [trackingLogs, setTrackingLogs] = useState<any[]>([]);

  const loadOrders = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/profile/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        if (data.length > 0 && !selectedOrder) {
          setSelectedOrder(data[0]); // Select latest order by default
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  // Live SSE listener sync
  useEffect(() => {
    if (!selectedOrder) return;

    // Reset live states to order details first
    setLiveStatus(selectedOrder.status);
    setLiveEta(selectedOrder.delivery?.estimatedDeliveryTime || '30');
    setLiveRider(null);
    setLiveCoords({});
    setTrackingLogs(selectedOrder.tracking || []);

    console.log(`Connecting to SSE stream for order ${selectedOrder.id}`);
    const eventSource = new EventSource(`/api/tracking/stream/${selectedOrder.id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE Live update received:', data);

      if (data.type === 'update') {
        if (data.latitude && data.longitude) {
          setLiveCoords({ lat: data.latitude, lng: data.longitude });
        }
        if (data.status) setLiveStatus(data.status);
        if (data.eta) setLiveEta(data.eta);
        if (data.rider) setLiveRider(data.rider);

        // Fetch logs on status shifts
        fetch('/api/profile/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(ordersList => {
            const updated = ordersList.find((o: any) => o.id === selectedOrder.id);
            if (updated) {
              setTrackingLogs(updated.tracking || []);
            }
          });
      }

      if (data.type === 'completed') {
        onAlert(`Your package delivery status updated: ${data.status.toUpperCase()}`, 'success');
        eventSource.close();
        loadOrders(); // reload complete states
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE disconnected or complete', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selectedOrder, token]);

  const getStatusStepIndex = (status: string): number => {
    const steps = ['pending', 'confirmed', 'packing', 'shipping', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  const steps = [
    { label: t('status.pending'), status: 'pending', desc: 'Awaiting clearance' },
    { label: t('status.confirmed'), status: 'confirmed', desc: 'Order approved' },
    { label: t('status.packing'), status: 'packing', desc: 'Preparing package' },
    { label: t('status.shipping'), status: 'shipping', desc: 'In transit to zone' },
    { label: t('status.out_for_delivery'), status: 'out_for_delivery', desc: 'Rider driving live' },
    { label: t('status.delivered'), status: 'delivered', desc: 'Handed over' }
  ];

  const activeIndex = getStatusStepIndex(liveStatus);

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Retrieving logistics tracking index...</span>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <Navigation className="w-5.5 h-5.5 text-emerald-500 animate-pulse-subtle" />
            {t('tracking.title')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Monitor real-time transit logs, rider drive-paths and estimated arrivals
          </p>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs font-bold text-slate-500 hover:text-emerald-500 flex items-center gap-1 hover:underline transition-colors active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Shop
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 dark:border-slate-800/60 shadow-sm max-w-md mx-auto">
          <span className="text-4xl">📦</span>
          <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mt-4 font-bold">No Active Invoices Located</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
            You haven't registered any purchase invoices under this customer session yet. Go to shop and complete an checkout to observe maps!
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="btn-premium px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 mt-5 active:scale-95"
          >
            Explore marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Orders selector list & details panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Orders checklist switcher card */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-3">
                <ListOrdered className="w-4 h-4 text-emerald-500" />
                Purchase Invoices ({orders.length})
              </h3>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {orders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      selectedOrder?.id === ord.id 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'border-slate-150 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50'
                    }`}
                  >
                    <div>
                      <p className="font-bold">Invoice #{ord.id.substring(4)}</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wide">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected order summary info card */}
            {selectedOrder && (
              <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-3">
                <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Invoice details
                </h3>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Merchant Shop</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder.vendor?.storeName}</span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Destination Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{selectedOrder.delivery?.deliveryAddress}</span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedOrder.payment?.paymentMethod} ({selectedOrder.payment?.paymentStatus})</span>
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cart Items:</span>
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-[10px] bg-slate-100/40 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/20">
                      <span className="text-slate-750 dark:text-slate-300 font-semibold max-w-[160px] truncate">{item.product?.name}</span>
                      <span className="font-bold text-slate-800 dark:text-white">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Net Paid Invoice Total</span>
                  <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

          </div>

          {/* Right Columns: Tracking Map & Status Timelines */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Real-time map viewport */}
            <div className="w-full h-[340px] relative rounded-3xl overflow-hidden shadow-md border border-slate-200/50 dark:border-slate-800/60 bg-white dark:bg-slate-900">
              <TrackingMap 
                riderLat={liveCoords.lat}
                riderLng={liveCoords.lng}
                customerLat={selectedOrder?.delivery?.latitude}
                customerLng={selectedOrder?.delivery?.longitude}
                vendorLat={selectedOrder?.vendorId === 'vnd_2' ? 11.5540 : selectedOrder?.vendorId === 'vnd_3' ? 11.5450 : 11.5564}
                vendorLng={selectedOrder?.vendorId === 'vnd_2' ? 104.9310 : selectedOrder?.vendorId === 'vnd_3' ? 104.9200 : 104.9282}
                riderName={liveRider?.name || 'Assigned Courier'}
                vehicleType={liveRider?.vehicleType || 'moto'}
                status={liveStatus}
              />

              {/* Floating ETA overlay */}
              <div className="absolute bottom-4 left-4 glass py-2 px-3 rounded-2xl z-[999] pointer-events-none flex items-center gap-2.5 shadow-lg border border-slate-200/40">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md animate-bounce-subtle">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase">{t('tracking.eta')}</p>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">
                    {liveStatus === 'delivered' ? 'ARRIVED 🎉' : `${liveEta} ${t('tracking.eta_unit')}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Rider profile dialog card */}
            {liveRider && (
              <div className="glass rounded-3xl p-4 border border-emerald-500/25 dark:border-emerald-500/20 shadow-md flex justify-between items-center animate-slide-up">
                <div className="flex items-center gap-3">
                  <img 
                    src={liveRider.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'} 
                    alt={liveRider.name} 
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      {liveRider.name}
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/10 uppercase">
                        Verified Rider
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Vehicle: <span className="font-semibold capitalize text-slate-600 dark:text-slate-300">{liveRider.vehicleType}</span> ({liveRider.vehiclePlate})
                    </p>
                  </div>
                </div>

                <a 
                  href={`tel:${liveRider.phone}`}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 hover:bg-slate-50 active:scale-95 shadow-sm transition-all flex items-center gap-1.5 font-bold text-[10px]"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  {t('tracking.phone')}
                </a>
              </div>
            )}

            {/* Horizontal Timeline Status stepper */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white">
                Delivery Timeline Progress
              </h3>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                {steps.map((st, idx) => {
                  const isCompleted = idx <= activeIndex;
                  const isActive = idx === activeIndex;

                  return (
                    <div key={st.status} className="flex flex-col items-center text-center gap-1.5 relative group">
                      
                      {/* Timeline dot */}
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                        isActive 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-110 animate-pulse-subtle' 
                          : isCompleted 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' 
                          : 'border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold ${isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'} leading-snug`}>
                          {st.label}
                        </span>
                        <span className="text-[8px] text-slate-400 max-w-[80px] truncate leading-none mt-0.5">
                          {st.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrolling Dynamic Event tracking logs */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
              <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <Bell className="w-4 h-4 text-emerald-500 animate-bounce-subtle" />
                Real-Time Tracking Events Log
              </h3>

              <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto pr-1">
                {trackingLogs.map((log: any, idx) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-relaxed border-l-2 border-slate-200 dark:border-slate-800 pl-4 relative">
                    {/* timeline bullet on border */}
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-350">{log.note}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
