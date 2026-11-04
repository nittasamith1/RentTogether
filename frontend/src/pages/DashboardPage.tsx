import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  ArrowRight,
  Heart,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { ItemDetailModal, ModalResourceItem } from '../components/common/ItemDetailModal';
import { ListItemModal } from '../components/common/ListItemModal';

// Authentic visual assets extracted directly from the reference mockup
import heroWithWaveImg from '../assets/hero_with_wave.png';
import itemCasioImg from '../assets/item_casio.png';
import itemDsaImg from '../assets/item_dsa.png';
import itemArduinoImg from '../assets/item_arduino.png';
import itemCanonImg from '../assets/item_canon.png';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Modal States
  const [activeDetailItem, setActiveDetailItem] = useState<ModalResourceItem | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Exact 4 Popular Resources matching RentTogether Campus Rental Dashboard.png
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

  // Premium, subtle cubic-bezier easing [0.16, 1, 0.3, 1] (Apple/Linear standard)
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
  };

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto relative pb-6 text-[#061C3D]"
    >
      {/* Toast Notification with Elegant Spring Physics */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 bg-[#061C3D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700/60 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F5A623] shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Hero Welcome Section (Seamless, Open Canvas matching Mockup 1:1) */}
      <motion.div variants={fadeUpVariants} className="relative pt-2 pb-2 grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Left Text Column */}
        <div className="lg:col-span-6 space-y-3.5 pr-2 z-10">
          <div className="text-[11px] font-black tracking-[0.24em] text-[#061C3D] uppercase">
            CAMPUS RESOURCE SHARING
          </div>

          <h1 className="text-4xl sm:text-[46px] font-black text-[#061C3D] tracking-tight leading-[1.12]">
            Welcome back, Sai!
          </h1>

          <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
            Rent, lend and share resources within your campus.
          </p>

          <div className="flex items-center gap-3.5 pt-2">
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
              transition={{ duration: 0.15 }}
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F5A623] text-[#061C3D] font-bold text-sm shadow-sm hover:brightness-105 transition-all cursor-pointer"
            >
              <span>Explore Resources</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsListModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-300 text-[#061C3D] font-semibold text-sm shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span>+ List an Item</span>
            </motion.button>
          </div>
        </div>

        {/* Right Gear & Wave Image (Seamlessly blended into canvas) */}
        <div className="lg:col-span-6 flex justify-end items-center select-none relative -mr-4">
          <motion.img
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            src={heroWithWaveImg}
            alt="Campus Resources: Books, MacBook Laptop, Canon DSLR"
            className="w-full max-w-lg object-contain pointer-events-none"
          />
        </div>
      </motion.div>

      {/* 2. Key Metrics Row (4 Floating White Cards with Elegant Hover Micro-Interaction) */}
      <motion.div variants={fadeUpVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {/* Active Rentals */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4 p-4.5 bg-white rounded-[20px] border border-slate-100/90 shadow-soft hover:shadow-card transition-shadow cursor-default"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FFF8EC] flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-[#E68A00]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#061C3D] leading-tight">
              3
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Active Rentals
            </div>
          </div>
        </motion.div>

        {/* Completed Rentals */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4 p-4.5 bg-white rounded-[20px] border border-slate-100/90 shadow-soft hover:shadow-card transition-shadow cursor-default"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF5FD] flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-[#2563EB]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#061C3D] leading-tight">
              8
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Completed Rentals
            </div>
          </div>
        </motion.div>

        {/* Money Saved */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4 p-4.5 bg-white rounded-[20px] border border-slate-100/90 shadow-soft hover:shadow-card transition-shadow cursor-default"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FDF0F1] flex items-center justify-center shrink-0">
            <span className="text-[#DC2626] font-bold text-2xl leading-none font-sans">
              ₹
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#061C3D] leading-tight">
              ₹2,450
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Money Saved
            </div>
          </div>
        </motion.div>

        {/* Waste Avoided */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center gap-4 p-4.5 bg-white rounded-[20px] border border-slate-100/90 shadow-soft hover:shadow-card transition-shadow cursor-default"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EDF7FD] flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-[#0284C7]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[#061C3D] leading-tight">
              12.4 kg
            </div>
            <div className="text-xs font-medium text-slate-500 mt-0.5">
              Waste Avoided
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Bottom Grid: Popular Resources (8 cols) + Sustainability Impact (4 cols) */}
      <motion.div variants={fadeUpVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Popular Resources Section */}
        <div className="lg:col-span-8 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-black text-[#061C3D] tracking-tight">
                Popular Resources
              </h2>
              <div className="h-1 w-10 bg-[#F5A623] rounded-full mt-0.5" />
            </div>

            <button
              onClick={() => navigate('/explore')}
              className="text-xs font-bold text-[#061C3D] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* 4 Cards Grid matching Mockup with Smooth Lift */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {popularResources.map((item) => {
              const isWishlisted = wishlist.has(item.id);
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={() => setActiveDetailItem(item)}
                  className="bg-white rounded-[20px] border border-slate-100/90 shadow-soft hover:shadow-card transition-shadow p-3 flex flex-col justify-between cursor-pointer group relative"
                >
                  <div>
                    {/* Item Image with Heart Button */}
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50 mb-2.5">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-contain p-0.5 group-hover:scale-104 transition-transform duration-300 ease-out"
                        loading="lazy"
                      />
                      {/* Heart Button with Tactile Pop */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => toggleWishlist(item.id, item.title, e)}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 ${
                          isWishlisted
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-white text-slate-700 hover:text-rose-500 shadow-xs'
                        }`}
                        aria-label="Wishlist"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 stroke-[2] transition-transform ${
                            isWishlisted ? 'fill-rose-500 text-rose-500 scale-105' : ''
                          }`}
                        />
                      </motion.button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[13.5px] text-[#061C3D] truncate group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* Category Badge matching mockup colors */}
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.category === 'Calculator'
                            ? 'bg-[#FDF3E7] text-[#8C5E28]'
                            : item.category === 'Books'
                            ? 'bg-[#EAF2FC] text-[#2F65B9]'
                            : item.category === 'Project'
                            ? 'bg-[#FDECEB] text-[#B73838]'
                            : 'bg-[#E8F4FC] text-[#2F65B9]'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Price & Star Rating */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="text-[14px] font-black text-[#061C3D]">
                      ₹{item.pricePerDay}{' '}
                      <span className="text-[11px] font-normal text-slate-500">/ day</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#061C3D]">
                      <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Carousel Pagination Dots matching mockup with Fluid Width */}
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  carouselIndex === idx
                    ? 'w-5 h-1.5 bg-[#F5A623]'
                    : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Sustainability Impact Card with Calm Circular SVG Animation */}
        <div className="lg:col-span-4 bg-white rounded-[20px] border border-slate-100/90 shadow-soft p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#F5A623]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <h2 className="text-[18px] font-black text-[#061C3D]">
              Sustainability Impact
            </h2>
          </div>

          {/* Donut Chart + Vertical Metrics Row */}
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Donut Ring Chart with Soft Draw-in */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#EDF2F7"
                  strokeWidth="9"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F5A623"
                  strokeWidth="9"
                  strokeDasharray="238.76"
                  initial={{ strokeDashoffset: 238.76 }}
                  animate={{ strokeDashoffset: 238.76 * (1 - 0.78) }}
                  transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-[#061C3D]">78%</span>
                <span className="text-[10px] text-slate-500 font-medium">Your Contribution</span>
              </div>
            </div>

            {/* 3 Metrics Column matching mockup */}
            <div className="space-y-3.5">
              {/* Stat 1: Money Saved */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF8EC] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#E68A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
                    <path d="m7 6 5 5"/>
                    <path d="m12 6-2 8"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-[#061C3D] leading-none">₹2,450</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total Money Saved</div>
                </div>
              </div>

              {/* Stat 2: Resources Reused */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FDF0F1] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                    <path d="M11 19h8.2a1.8 1.8 0 0 0 1.565-.914 1.78 1.78 0 0 0 .034-1.783L17.5 11"/>
                    <path d="m14 14 3-3 3 3"/>
                    <path d="m3 14 3-3 3 3"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-[#061C3D] leading-none">12</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Resources Reused</div>
                </div>
              </div>

              {/* Stat 3: Waste Avoided */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF8EC] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#E68A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-black text-[#061C3D] leading-none">12.4 kg</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Estimated Waste Reduced</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
