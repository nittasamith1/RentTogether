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
import { OwnerListingSummary } from '../../services/listingService';

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters & State
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [editingItem, setEditingItem] = useState<OwnerListingSummary | null>(null);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1E1B4B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-400/30"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-[#5B4DFF] text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 stroke-[2]" />
            <span>Owner Inventory & Lending Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
            My Listings & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your shared campus resources, adjust pricing, toggle availability, and track student rentals.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => navigate('/listings/create')}
          className="bg-[#5B4DFF] hover:bg-[#4E3FE6] text-white px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ List an item</span>
        </button>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Listings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              Inventory
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Total Listed Items</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {stats.total_listings}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Shared on campus</span>
          </div>
        </div>

        {/* Card 2: Active & Rentable */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Now
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Active & Discoverable</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
              {stats.active_listings}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Visible to peers</span>
          </div>
        </div>

        {/* Card 3: Paused Listings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PauseCircle className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Temporarily Off
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Paused Items</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">
              {stats.paused_listings}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Hidden from search</span>
          </div>
        </div>

        {/* Card 4: Total Completed Rentals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Peer Trust
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-medium text-slate-500">Completed Rentals</span>
            <div className="text-2xl font-extrabold text-[#5B4DFF] mt-0.5">
              {stats.total_completed_rentals}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">All-time student handovers</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search your listings by title or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-bold self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-[#1E1B4B] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
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
              className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse space-y-3"
            >
              <div className="aspect-4/3 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              <div className="h-8 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load listings</h3>
          <p className="text-xs text-rose-600">Please check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 shadow-sm text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center mx-auto shadow-xs">
            <PackageOpen className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">No items listed yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Have a scientific calculator, drafter, textbook, or camera lying unused? List it
              now to help fellow campus students and start earning passive income.
            </p>
          </div>

          <button
            onClick={() => navigate('/listings/create')}
            className="bg-[#5B4DFF] hover:bg-[#4E3FE6] text-white px-6 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md shadow-indigo-500/25 inline-flex items-center gap-2 cursor-pointer active:scale-95"
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
    </div>
  );
};
