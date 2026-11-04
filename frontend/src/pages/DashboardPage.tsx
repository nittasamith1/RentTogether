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
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ItemDetailModal, ModalResourceItem } from '../components/common/ItemDetailModal';
import { ListItemModal } from '../components/common/ListItemModal';

// Authentic visual assets extracted directly from the reference mockup
import heroGearImg from '../assets/hero_gear.png';
import itemCasioImg from '../assets/item_casio.png';
import itemDsaImg from '../assets/item_dsa.png';
import itemArduinoImg from '../assets/item_arduino.png';
import itemCanonImg from '../assets/item_canon.png';

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

  // 100% exact match to RentTogether Campus Rental Dashboard.png
  const popularResources: ModalResourceItem[] = [
    {
      id: 'casio-991ex',
      title: 'Casio fx-991EX',
      category: 'Calculator',
      pricePerDay: 30,
      rating: 4.8,
      reviewsCount: 18,
      image: itemCasioImg,
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
      reviewsCount: 12,
      image: itemDsaImg,
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
      reviewsCount: 26,
      image: itemArduinoImg,
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
      reviewsCount: 35,
      image: itemCanonImg,
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

      {/* 1. Hero Welcome Banner (Exact match to Mockup: Typography + 3D Render Image) */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-amber-200/50 p-8 sm:p-12 border border-amber-200/50 shadow-soft"
      >
        {/* Soft Ambient Organic Backdrop Gradient */}
        <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-amber-200/40 via-amber-100/30 to-transparent pointer-events-none rounded-r-3xl" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-yellow/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-extrabold tracking-widest uppercase text-slate-500 font-display">
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

          {/* Right Visual: Exact 3D Render of Books, MacBook, and Canon Camera */}
          <div className="hidden lg:flex lg:col-span-5 justify-end items-center relative select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              className="relative max-w-md cursor-pointer"
            >
              <img
                src={heroGearImg}
                alt="Campus Resources: Books, Laptop, Camera"
                className="w-full h-auto drop-shadow-xl object-contain"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 2. Key Metrics Row (4 Floating KPI Cards matching Mockup) */}
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
              {/* Category Filter Pills */}
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

          {/* Cards Grid matching 4 items in mockup with authentic images */}
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
                    className="bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-card-hover transition-all p-3 flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div>
                      {/* Item Image with Wishlist Button */}
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50 mb-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-contain p-1 group-hover:scale-108 transition-transform duration-500 ease-out"
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
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.category === 'Calculator'
                              ? 'bg-amber-100/70 text-amber-900'
                              : item.category === 'Books'
                              ? 'bg-blue-100/70 text-blue-900'
                              : item.category === 'Project'
                              ? 'bg-rose-100/70 text-rose-900'
                              : 'bg-sky-100/70 text-sky-900'
                          }`}
                        >
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
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Carousel Pagination Dots Indicator (Matching Mockup) */}
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

        {/* Sustainability Impact Widget (4 cols matching Mockup) */}
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
                    transition={{ duration: 1.4, ease: 'easeOut' }}
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
