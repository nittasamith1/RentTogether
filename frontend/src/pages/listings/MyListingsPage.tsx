import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Layers,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  AlertCircle,
  PackageOpen,
} from 'lucide-react';
import { useMyListings } from '../../hooks/useListings';
import { ListingCard } from '../../components/listings/ListingCard';
import { EditListingModal } from '../../components/listings/EditListingModal';
import { RentalHistoryModal } from '../../components/listings/RentalHistoryModal';
import { OwnerListingSummary } from '../../services/listingService';

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters & State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [editingItem, setEditingItem] = useState<OwnerListingSummary | null>(null);
  const [historyItem, setHistoryItem] = useState<OwnerListingSummary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const queryFilters = {
    search: search.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  };

  const { data, isLoading, isError, refetch } = useMyListings(queryFilters);

  const stats = data?.stats || {
    total_listings: 0,
    active_listings: 0,
    paused_listings: 0,
    total_completed_rentals: 0,
  };

  const items = data?.results || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none pt-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border"
            style={{ backgroundColor: '#303653', borderColor: '#7563D9', color: '#fff' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#42A879' }} />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 border"
            style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2]" />
            <span>Owner Inventory & Lending Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#303653' }}>
            My Listings & Inventory
          </h1>
          <p className="text-xs mt-1" style={{ color: '#85899B' }}>
            Manage your shared campus resources, adjust pricing, toggle availability, and track student rentals.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => navigate('/listings/create')}
          className="text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
          style={{ backgroundColor: '#7563D9', boxShadow: '0 4px 16px rgba(117, 99, 217, 0.25)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
        >
          <Plus className="w-4 h-4" />
          <span>+ List an item</span>
        </button>
      </div>

      {/* Top 4 KPI Summary Cards — Premium Pastel Themed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Listings — Soft Lavender */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#7563D9', color: '#fff' }}>
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#D8D0F5', color: '#7563D9' }}
            >
              Inventory
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Total Listed Items</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#303653' }}>
              {stats.total_listings}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Shared on campus</span>
          </div>
        </div>

        {/* Card 2: Active & Rentable — Fresh Mint */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#42A879', color: '#fff' }}>
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#B8E5CC', color: '#2D7A5B' }}
            >
              Live Now
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Active & Discoverable</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#42A879' }}>
              {stats.active_listings}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Visible to peers</span>
          </div>
        </div>

        {/* Card 3: Paused Listings — Soft Peach */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#FFE5D6', borderColor: '#F5CDB8' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#E8A447', color: '#fff' }}>
              <PauseCircle className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#F5CDB8', color: '#A06312' }}
            >
              Temporarily Off
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Paused Items</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#E8A447' }}>
              {stats.paused_listings}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>Hidden from search</span>
          </div>
        </div>

        {/* Card 4: Total Completed Rentals — Sky Blue */}
        <div
          className="rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all"
          style={{ backgroundColor: '#DFEDFF', borderColor: '#C5DCFA' }}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#6398D6', color: '#fff' }}>
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#C5DCFA', color: '#3A6BB5' }}
            >
              Peer Trust
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium" style={{ color: '#85899B' }}>Completed Rentals</span>
            <div className="text-2xl font-extrabold mt-0.5" style={{ color: '#6398D6' }}>
              {stats.total_completed_rentals}
            </div>
            <span className="text-[11px] mt-0.5 block" style={{ color: '#85899B' }}>All-time student handovers</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="rounded-2xl p-4 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3" style={{ color: '#85899B' }} />
          <input
            type="text"
            placeholder="Search your listings by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-hidden transition-all"
            style={{
              backgroundColor: '#FFF8ED',
              border: '1px solid #EAE6E1',
              color: '#303653',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#7563D9';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(117,99,217,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#EAE6E1';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl text-xs font-bold self-start sm:self-auto border"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
        >
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white shadow-xs font-bold'
                  : 'hover:text-[#7563D9]'
              }`}
              style={{
                color: statusFilter === tab ? '#7563D9' : '#303653',
              }}
            >
              {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Paused'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Listings Grid / Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-2xl p-4 border animate-pulse space-y-3"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div className="aspect-4/3 rounded-xl" style={{ backgroundColor: '#E9E3FF' }} />
              <div className="h-4 rounded-md w-3/4" style={{ backgroundColor: '#EAE6E1' }} />
              <div className="h-3 rounded-md w-1/2" style={{ backgroundColor: '#EAE6E1' }} />
              <div className="h-8 rounded-xl" style={{ backgroundColor: '#E9E3FF' }} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div
          className="p-8 rounded-3xl border text-center space-y-3"
          style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82' }}
        >
          <AlertCircle className="w-8 h-8 mx-auto" style={{ color: '#E87575' }} />
          <h3 className="text-sm font-bold" style={{ color: '#303653' }}>Failed to load listings</h3>
          <p className="text-xs" style={{ color: '#85899B' }}>Please check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 text-white rounded-xl text-xs font-bold cursor-pointer"
            style={{ backgroundColor: '#E87575' }}
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div
          className="rounded-3xl p-10 sm:p-14 border shadow-sm text-center space-y-4 max-w-xl mx-auto my-6"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xs"
            style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
          >
            <PackageOpen className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div>
            <h3 className="text-lg font-bold" style={{ color: '#303653' }}>No items listed yet</h3>
            <p className="text-xs mt-1 max-w-md mx-auto leading-relaxed" style={{ color: '#85899B' }}>
              Have a scientific calculator, drafter, textbook, or camera lying unused? List it
              now to help fellow campus students and start earning passive income.
            </p>
          </div>

          <button
            onClick={() => navigate('/listings/create')}
            className="text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
            style={{ backgroundColor: '#7563D9' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
          >
            <Plus className="w-4 h-4" />
            <span>+ List your first item</span>
          </button>
        </div>
      ) : (
        /* Grid of Listings */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onEdit={(it) => setEditingItem(it)}
              onViewHistory={(it) => setHistoryItem(it)}
              onViewDetails={() => navigate(`/marketplace/${item.id}`)}
            />
          ))}
        </div>
      )}

      {/* Edit Listing Modal */}
      <EditListingModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {
          showToast('Listing updated successfully!');
          refetch();
        }}
      />

      {/* Rental History Modal */}
      <RentalHistoryModal
        item={historyItem}
        onClose={() => setHistoryItem(null)}
      />
    </div>
  );
};
