import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Package,
  CalendarCheck,
  IndianRupee,
  Leaf,
  Plus,
  ArrowRight,
  Heart,
  Star,
  Coins,
  Recycle,
  Sparkles,
  CheckCircle2,
  Laptop,
  Camera,
  BookOpen,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ItemDetailModal, ModalResourceItem } from '../components/common/ItemDetailModal';
import { ListItemModal } from '../components/common/ListItemModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Modal States
  const [activeDetailItem, setActiveDetailItem] = useState<ModalResourceItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const toggleWishlist = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(wishlist);
    if (next.has(id)) {
      next.delete(id);
      showToast(`Removed "${title}" from Wishlist`);
    } else {
      next.add(id);
      showToast(`Saved "${title}" to your Wishlist! ❤️`);
    }
    setWishlist(next);
  };

  const categories = ['All', 'Calculator', 'Books', 'Project', 'Electronics'];

  // High quality images matching the exact items in RentTogether Campus Rental Dashboard.png
  const popularResources: ModalResourceItem[] = [
    {
      id: 'casio-991ex',
      title: 'Casio fx-991EX',
      category: 'Calculator',
      pricePerDay: 30,
      rating: 4.8,
      reviewsCount: 14,
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=85',
      ownerName: 'Sai R.',
      deposit: 200,
      pickupLocation: 'Central Library Ground Floor',
    },
    {
      id: 'dsa-book-set',
      title: 'DSA Book Set',
      category: 'Books',
      pricePerDay: 20,
      rating: 4.7,
      reviewsCount: 9,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=85',
      ownerName: 'Priya K.',
      deposit: 150,
      pickupLocation: 'Main Canteen Tables',
    },
    {
      id: 'arduino-uno-kit',
      title: 'Arduino Uno Kit',
      category: 'Project',
      pricePerDay: 80,
      rating: 4.9,
      reviewsCount: 22,
      image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=85',
      ownerName: 'Varun T.',
      deposit: 400,
      pickupLocation: 'CSE Block 2nd Floor',
    },
    {
      id: 'canon-dslr',
      title: 'Canon DSLR',
      category: 'Electronics',
      pricePerDay: 250,
      rating: 4.8,
      reviewsCount: 31,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=85',
      ownerName: 'Aditya M.',
      deposit: 1500,
      pickupLocation: 'Campus Security Gate 1',
    },
  ];

  const filteredResources = selectedCategory === 'All'
    ? popularResources
    : popularResources.filter((r) => r.category === selectedCategory);

  // Framer Motion Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto relative pb-8"
    >
      {/* Toast Notification with Spring Physics */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 bg-brand-navy-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/80 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Hero Welcome Banner (with Ambient Warm Glow & 3D Cards) */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-amber-200/50 p-8 sm:p-12 border border-amber-200/50 shadow-soft"
      >
        {/* Soft Ambient Organic Backdrop Gradient */}
        <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-amber-200/40 via-amber-100/30 to-transparent pointer-events-none rounded-r-3xl" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-yellow/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/60 text-brand-navy-950 text-xs font-extrabold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow-600" />
              CAMPUS RESOURCE SHARING
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-display">
              Welcome back, Sai!
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
              Rent, lend and share resources within your campus.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/explore')}
                  className="gap-2 shadow-glow-yellow px-6 py-3 font-bold"
                >
                  <span>Explore Resources</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsListModalOpen(true)}
                  className="gap-2 bg-white/90 hover:bg-white text-slate-800 border-slate-300/80 shadow-soft px-6 py-3 font-semibold"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                  <span>+ List an Item</span>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Right Visual 3D Showcase (MacBook, DSA Book Stack, DSLR Camera) */}
          <div className="hidden lg:flex lg:col-span-5 justify-end relative">
            <div className="relative w-full max-w-md h-52 flex items-center justify-end select-none">
              {/* Book Stack Pill */}
              <motion.div
                initial={{ rotate: -8, y: 10 }}
                animate={{ rotate: -5, y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute left-4 top-8 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-xl z-10 flex items-center gap-2.5 cursor-pointer hover:rotate-0 transition-transform"
              >
                <BookOpen className="w-5 h-5 text-blue-200" />
                <div>
                  <div className="text-xs font-bold leading-tight">Data Structures</div>
                  <div className="text-[10px] text-blue-200">Algorithms & OS</div>
                </div>
              </motion.div>

              {/* MacBook Pro Glass Container */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                className="w-64 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 z-20 cursor-pointer"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-brand-yellow" />
                    <span className="text-xs font-bold text-slate-200">MacBook Pro 14"</span>
                  </div>
                  <span className="text-[10px] bg-brand-yellow text-slate-950 font-bold px-1.5 py-0.5 rounded">
                    Available
                  </span>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 flex justify-between">
                  <span>Rent for capstone</span>
                  <span className="font-bold text-white">₹350/day</span>
                </div>
              </motion.div>

              {/* Canon DSLR Camera Pill */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                className="absolute right-0 -bottom-2 bg-white text-slate-900 px-3.5 py-2.5 rounded-2xl shadow-card border border-slate-100 z-30 flex items-center gap-2.5 hover:scale-105 transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">Canon DSLR</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Campus Handover</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Key Metrics Row (4 Floating KPI Cards) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Active Rentals */}
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="flex items-center gap-4.5 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer group">
            <div className="w-13 h-13 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-display">
                3
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Active Rentals
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Completed Rentals */}
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="flex items-center gap-4.5 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer group">
            <div className="w-13 h-13 rounded-2xl bg-sky-100/80 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-display">
                8
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Completed Rentals
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Money Saved */}
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="flex items-center gap-4.5 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer group">
            <div className="w-13 h-13 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-display">
                ₹2,450
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Money Saved
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Waste Avoided */}
        <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <Card className="flex items-center gap-4.5 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all cursor-pointer group">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-display">
                12.4 kg
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Waste Avoided
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* 3. Bottom Grid: Popular Resources (8 cols) + Sustainability Impact (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Popular Resources Section */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                Popular Resources
              </h2>
              <div className="h-0.5 w-10 bg-brand-yellow mt-1 rounded-full" />
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Pills with Layout Animation */}
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
                      selectedCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs scale-102 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/explore')}
                className="text-xs font-bold text-slate-700 hover:text-brand-navy-950 flex items-center gap-1 transition-colors hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cards Grid matching 4 items in mockup */}
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredResources.map((item) => {
                const isWishlisted = wishlist.has(item.id);
                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    onClick={() => setActiveDetailItem(item)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all p-3.5 flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div>
                      {/* Item Image with Wishlist Button */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                        {/* Interactive Heart Button */}
                        <button
                          onClick={(e) => toggleWishlist(item.id, item.title, e)}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-75 ${
                            isWishlisted
                              ? 'bg-rose-50 text-rose-500 shadow-sm'
                              : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
                          }`}
                          aria-label="Toggle wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform ${
                              isWishlisted ? 'fill-rose-500 scale-110' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Title & Category Badge */}
                      <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-brand-yellow-600 transition-colors">
                        {item.title}
                      </h3>
                      <div className="mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Price & Rating */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/90">
                      <div className="text-sm font-black text-slate-900 font-display">
                        ₹{item.pricePerDay}{' '}
                        <span className="text-[11px] font-normal text-slate-500">/ day</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{item.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Carousel Pagination Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  carouselIndex === idx
                    ? 'w-5 h-1.5 bg-brand-yellow'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Sustainability Impact Widget (4 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
              <Leaf className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              <span>Sustainability Impact</span>
            </h2>
            <div className="h-0.5 w-10 bg-brand-yellow mt-1 rounded-full" />
          </div>

          <Card className="p-6 bg-white rounded-3xl border border-slate-100 shadow-soft hover:shadow-card transition-shadow">
            {/* Animated Circular Donut Ring Chart (Matching UI Mockup 78%) */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-40 h-40 flex items-center justify-center group">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Outer Subtle Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="11"
                  />
                  {/* Contribution Arc (78%) in Brand Yellow with SVG Spring Animation */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FBBF24"
                    strokeWidth="11"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 * (1 - 0.78) }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-display">
                    78%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Your Contribution
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Metric Breakdown List (Matching Icons & Numbers) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* Stat 1 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Total Money Saved</span>
                </div>
                <span className="font-extrabold text-sm text-slate-900 font-display">₹2,450</span>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Recycle className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Resources Reused</span>
                </div>
                <span className="font-extrabold text-sm text-slate-900 font-display">12</span>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Estimated Waste Reduced</span>
                </div>
                <span className="font-extrabold text-sm text-slate-900 font-display">12.4 kg</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Interactive Item Detail Modal */}
      <ItemDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
        onRequestBooking={(item) => {
          showToast(`Rental request submitted for "${item.title}"! 🎉`);
        }}
      />

      {/* Interactive "+ List an Item" Modal */}
      <ListItemModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onItemCreated={(title, _category, price) => {
          showToast(`Listed "${title}" for ₹${price}/day! 🚀`);
        }}
      />
    </motion.div>
  );
};
