import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ArrowRight, ArrowLeft, Upload, MapPin } from 'lucide-react';
import { Button } from './Button';

interface ListItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: (title: string, category: string, price: number) => void;
}

export const ListItemModal: React.FC<ListItemModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Electronics');
  const [originalPrice, setOriginalPrice] = useState<string>('1200');
  const [condition, setCondition] = useState<string>('Like New');
  const [rentalPrice, setRentalPrice] = useState<number>(35);
  const [pickupSpot, setPickupSpot] = useState<string>('Central Library Ground Floor');

  if (!isOpen) return null;

  // Real-time AI Suggested Price Formula simulation
  const calcAiPrice = () => {
    const orig = parseFloat(originalPrice) || 1000;
    const factor = condition === 'Brand New' ? 0.03 : condition === 'Like New' ? 0.025 : 0.02;
    return Math.max(15, Math.round(orig * factor));
  };
  const aiPrice = calcAiPrice();

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    onItemCreated(title || 'Campus Resource Item', category, rentalPrice);
    onClose();
    setStep(1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-navy-950/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-yellow-600 bg-amber-50 px-2.5 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>AI-Assisted Listing</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 font-display">
                List an Item for Rent
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? 'bg-brand-yellow text-brand-navy-950 shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}
                </div>
                <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                  {s === 1 ? 'Details' : s === 2 ? 'AI Price' : 'Handover'}
                </span>
                {s < 3 && <div className="w-8 sm:w-16 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <form onSubmit={handlePublish} className="space-y-4">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Title / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Casio fx-991EX Scientific Calculator"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    >
                      <option>Calculator</option>
                      <option>Books</option>
                      <option>Project</option>
                      <option>Electronics</option>
                      <option>Laboratory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    >
                      <option>Brand New</option>
                      <option>Like New</option>
                      <option>Good</option>
                      <option>Fair</option>
                    </select>
                  </div>
                </div>

                {/* Image Placeholder */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-brand-yellow cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-xs font-semibold text-slate-600">Drop item photos here</div>
                  <div className="text-[10px] text-slate-400">Cloudinary multi-image upload</div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="gap-2"
                  >
                    <span>Next: AI Pricing</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                </div>

                {/* AI Price Recommendation Card */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      AI Fair Price Recommendation
                    </span>
                    <span className="text-[10px] bg-amber-200/60 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                      Fair Rate
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black text-slate-900 font-display">
                        ₹{aiPrice} <span className="text-xs font-normal text-slate-600">/ day</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Suggested fair range: ₹{Math.max(10, aiPrice - 5)} – ₹{aiPrice + 10}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRentalPrice(aiPrice)}
                      className="text-xs py-1 px-3 bg-white"
                    >
                      Apply AI Price
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Daily Rental Rate: <span className="text-brand-yellow-600 font-extrabold">₹{rentalPrice} / day</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(parseInt(e.target.value))}
                    className="w-full accent-brand-yellow cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(3)}
                    className="gap-2"
                  >
                    <span>Next: Handover Spot</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-yellow-600" />
                    <span>Designated Campus Meetup Spot</span>
                  </label>
                  <select
                    value={pickupSpot}
                    onChange={(e) => setPickupSpot(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option>Central Library Ground Floor</option>
                    <option>Main Canteen Outdoor Tables</option>
                    <option>Block A Lobby (Admin Gate)</option>
                    <option>CSE Department 2nd Floor</option>
                    <option>Campus Main Gate Security Point</option>
                  </select>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Zero Shipping / 100% Campus Handover</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    You and the renting student will meet on campus to verify item condition.
                  </p>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="gap-2 shadow-glow-yellow px-6 font-bold"
                  >
                    <Check className="w-4 h-4" />
                    <span>Publish Listing</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
