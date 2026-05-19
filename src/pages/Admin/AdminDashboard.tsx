import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { 
  ShieldAlert, 
  Users, 
  Coins, 
  Truck, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  FileText, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAlert }) => {
  const { token } = useAuth();
  const { t } = useLanguage();
  
  // Dashboard states
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector for assigning riders
  const [selectedRiders, setSelectedRiders] = useState<{ [orderId: string]: string }>({});

  const loadAdminData = () => {
    if (!token) return;
    setLoading(true);
    
    Promise.all([
      fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/admin/vendors', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([dashboardData, vendorsData]) => {
        setMetrics(dashboardData.metrics || null);
        setOrders(dashboardData.orders || []);
        setRiders(dashboardData.riders || []);
        setVendors(vendorsData || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUpdateVendorStatus = async (vendorId: string, status: 'active' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      
      if (res.ok) {
        onAlert(status === 'active' ? 'Merchant store successfully approved!' : 'Merchant store application rejected.', 'success');
        loadAdminData();
      } else {
        throw new Error(data.message || 'Status update failed');
      }
    } catch (err: any) {
      onAlert(err.message || 'Status update failed', 'error');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  // Handle dropdown changes
  const handleRiderSelectChange = (orderId: string, riderId: string) => {
    setSelectedRiders(prev => ({ ...prev, [orderId]: riderId }));
  };

  // manual dispatch order assigner
  const assignRiderToOrder = async (orderId: string) => {
    if (!token) return;
    const riderId = selectedRiders[orderId];
    if (!riderId) {
      onAlert('Please select a rider from the dropdown first.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ riderId })
      });
      const data = await res.json();

      if (res.ok) {
        onAlert('Logistics courier successfully assigned & dispatched!', 'success');
        loadAdminData();
      } else {
        throw new Error(data.message || 'Dispatch failed');
      }
    } catch (err: any) {
      onAlert(err.message || 'Dispatch failed', 'error');
    }
  };

  const handlePrintMock = (orderId: string) => {
    onAlert(`Generating Invoice PDF for #${orderId.substring(4)}... mock print triggered.`, 'success');
  };

  if (loading && orders.length === 0 && riders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Retrieving logistical coordinates...</span>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6.5 h-6.5 text-emerald-500" />
            {t('admin.portal')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('admin.portal_desc')}
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 hover:bg-slate-50 active:scale-95 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 1. ADMIN ANALYTICS CARD GRID */}
      {metrics && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Gross sales */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              {t('admin.gross_sales')}
            </span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">${metrics.grossSales.toFixed(2)}</span>
            <span className="text-[9px] text-emerald-500 font-semibold mt-1">{t('admin.sales_sub')}</span>
          </div>

          {/* Active fleet size */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-violet-500" />
              {t('admin.fleet_size')}
            </span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">
              {riders.length} {t('admin.couriers') || 'Couriers'}
            </span>
            <span className="text-[9px] text-violet-500 font-semibold mt-1">
              {riders.filter(r => r.isAvailable).length} {t('admin.fleet_sub')}
            </span>
          </div>

          {/* Fulfillment Rate */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 animate-pulse-subtle" />
              {t('admin.fulfillment')}
            </span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">99.2% {t('admin.fulfillment_completed')}</span>
            <span className="text-[9px] text-blue-500 font-semibold mt-1">{t('admin.fulfillment_sub')}</span>
          </div>

          {/* Total Users */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-slate-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {t('admin.accounts')}
            </span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">
              {metrics.userCount} {t('admin.accounts_members')}
            </span>
            <span className="text-[9px] text-slate-400 font-semibold mt-1">{t('admin.accounts_sub')}</span>
          </div>
        </section>
      )}

      {/* 2. ADMIN CHARTS BLOCK */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Sales trend curved graph (SVG Curved Lines with custom fills!) */}
        <div className="md:col-span-2 glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {t('admin.revenue_trend')}
            </h3>
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{t('admin.revenue_sub')}</span>
          </div>

          {/* Curved Line SVG Chart Canvas */}
          <div className="w-full h-40 bg-white/40 dark:bg-slate-900/40 border border-slate-200/25 rounded-2xl relative p-2 shadow-inner">
            <svg viewBox="0 0 100 35" className="w-full h-full text-emerald-500 select-none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.2" />

              {/* Area path */}
              <path d="M 0 35 Q 15 25 30 28 T 60 15 T 80 18 T 100 5 L 100 35 Z" fill="url(#chartGradient)" />
              {/* Curve Stroke line */}
              <path d="M 0 35 Q 15 25 30 28 T 60 15 T 80 18 T 100 5" fill="none" stroke="#10b981" strokeWidth="0.75" strokeLinecap="round" />
              
              {/* Graph Nodes */}
              <circle cx="30" cy="28" r="0.8" fill="#10b981" stroke="white" strokeWidth="0.2" />
              <circle cx="60" cy="15" r="0.8" fill="#10b981" stroke="white" strokeWidth="0.2" />
              <circle cx="100" cy="5" r="0.8" fill="#10b981" stroke="white" strokeWidth="0.2" />
            </svg>

            {/* Bottom labels */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold px-2 mt-1">
              <span>{t('admin.mon') || 'Mon'}</span>
              <span>{t('admin.wed') || 'Wed'}</span>
              <span>{t('admin.fri') || 'Fri'}</span>
              <span>{t('admin.today') || 'Today'}</span>
            </div>
          </div>
        </div>

        {/* Fulfillment share categories (CSS percentages) */}
        <div className="md:col-span-1 glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
              {t('admin.distribution')}
            </h3>

            <div className="flex flex-col gap-3">
              {/* Electronics */}
              <div className="text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  <span>{t('admin.electronics')}</span>
                  <span>58% {t('admin.share') || 'share'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58%' }} />
                </div>
              </div>

              {/* Apparel */}
              <div className="text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  <span>{t('admin.fashion')}</span>
                  <span>26% {t('admin.share') || 'share'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '26%' }} />
                </div>
              </div>

              {/* Groceries */}
              <div className="text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  <span>{t('admin.groceries')}</span>
                  <span>16% {t('admin.share') || 'share'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '16%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* 3. Left Columns: manual Dispatch Center orders queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              {t('admin.dispatch_queue')} ({orders.filter(o => o.status === 'packing').length})
            </h3>

            {orders.filter(o => o.status === 'packing').length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">🪘</span>
                <p className="text-xs font-bold mt-2">{t('admin.queue_idle')}</p>
                <p className="text-[10px] text-slate-455 mt-0.5">{t('admin.queue_idle_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.filter(o => o.status === 'packing').map((ord) => {
                  const selectedRiderId = selectedRiders[ord.id] || '';
                  const availableRiders = riders.filter(r => r.isAvailable);

                  return (
                    <div 
                      key={ord.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm text-xs"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white">{t('admin.invoice_order') || 'Invoice Order'} #{ord.id.substring(4)}</h4>
                        <p className="text-[10px] text-slate-450 font-semibold mt-1">{t('admin.to') || 'To'}: {ord.receiverName || 'Anonymous Customer'} ({(ord.deliveryAddress || 'No Address').substring(0, 30)}...)</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{t('admin.items_total') || 'Items Total'}: ${ord.totalAmount.toFixed(2)}</p>
                      </div>

                      {/* Selector dropdown */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={selectedRiderId}
                          onChange={(e) => handleRiderSelectChange(ord.id, e.target.value)}
                          className="px-2 py-1.8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-[10px] font-bold"
                        >
                          <option value="" className="text-slate-850 bg-white dark:bg-slate-950 font-semibold">-- {t('admin.select_courier')} --</option>
                          {availableRiders.map((rid) => (
                            <option key={rid.id} value={rid.id} className="text-slate-850 bg-white dark:bg-slate-950 font-semibold">
                              {rid.name} ({t('admin.plate') || 'Plate'}: {rid.vehiclePlate})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => assignRiderToOrder(ord.id)}
                          className="btn-premium px-3.5 py-1.8 rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {t('admin.dispatch')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historic invoices and print reports */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              {t('admin.cleared_invoices')} ({orders.filter(o => o.status === 'delivered').length})
            </h3>

            {orders.filter(o => o.status === 'delivered').length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs font-bold">{t('admin.no_completed')}</p>
                <p className="text-[10px] text-slate-455 mt-0.5">{t('admin.no_completed_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {orders.filter(o => o.status === 'delivered').map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between gap-3 shadow-sm text-xs group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{t('ui.cart')} #{item.id.substring(4)}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{t('admin.cleared_total') || 'Cleared total'}: ${item.totalAmount.toFixed(2)} | {t('admin.paid') || 'Paid'}: ABA KHQR</p>
                    </div>

                    <button
                      onClick={() => handlePrintMock(item.id)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 hover:bg-slate-50 active:scale-95 shadow-sm transition-all flex items-center gap-1 text-[9px] font-bold shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      {t('admin.print_invoice')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Merchant Store Applications Audit */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm mt-6">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center justify-between">
              <span>{t('admin.vendor_applications')} ({vendors.filter(v => v.status === 'pending').length})</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">{t('admin.licensing_checks')}</span>
            </h3>

            {vendors.filter(v => v.status === 'pending').length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">🏪</span>
                <p className="text-xs font-bold mt-2">{t('admin.all_audited')}</p>
                <p className="text-[10px] text-slate-455 mt-0.5">{t('admin.all_audited_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {vendors.filter(v => v.status === 'pending').map((vend) => (
                  <div 
                    key={vend.id}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200/50 p-1 shrink-0 flex items-center justify-center">
                        <img src={vend.storeLogo} alt="" className="max-h-full max-w-full object-contain rounded" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{vend.storeName}</h4>
                        <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{t('admin.owner') || 'Owner'}: {vend.ownerName} ({vend.ownerEmail})</p>
                        <p className="text-[9px] text-slate-455 dark:text-slate-400 mt-0.5 leading-relaxed">{vend.storeDescription}</p>
                        <p className="text-[8px] font-mono text-emerald-500 mt-1 uppercase">LOC: {vend.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => handleUpdateVendorStatus(vend.id, 'rejected')}
                        className="px-3.5 py-1.8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:bg-rose-950/20 text-slate-655 dark:text-slate-450 text-[10px] font-bold active:scale-95 transition-all"
                      >
                        {t('admin.reject_app')}
                      </button>
                      <button
                        onClick={() => handleUpdateVendorStatus(vend.id, 'active')}
                        className="btn-premium px-4 py-1.8 rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('admin.approve_app')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 4. Right Column: Riders fleet status monitor */}
        <div className="lg:col-span-1 glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-4">
          <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            {t('admin.rider_monitor')}
          </h3>

          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            {riders.map((rid) => (
              <div 
                key={rid.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex flex-col gap-2 shadow-sm text-xs"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <img 
                      src={rid.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'} 
                      alt="" 
                      className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/10 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{rid.name}</h4>
                      <p className="text-[8px] text-slate-400 leading-none mt-0.5">{t('admin.plate') || 'Plate'}: {rid.vehiclePlate}</p>
                    </div>
                  </div>

                  <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    rid.isAvailable 
                      ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/15 text-rose-600 dark:text-rose-450 animate-pulse'
                  }`}>
                    {rid.isAvailable ? t('admin.fleet_sub') : (t('admin.on_active_trip') || 'On Active Trip')}
                  </span>
                </div>

                <div className="h-[1px] bg-slate-50 dark:bg-slate-800/80 my-1" />

                <div className="flex justify-between items-center text-[9px] text-slate-450">
                  <span className="font-semibold">{t('admin.rating') || 'Rating'}: 4.85 / 5.0 ⭐</span>
                  <span className="font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/20">
                    Loc: {rid.latitude.toFixed(4)}, {rid.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
