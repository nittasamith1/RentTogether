import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Tag,
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { useCreateListing, usePriceRecommendation, useCategories } from '../../hooks/useListings';
import { Category } from '../../services/marketplace';

interface CreateListingWizardProps {
  onSuccess?: (createdItemId: string) => void;
  onCancel?: () => void;
}

export const CreateListingWizard: React.FC<CreateListingWizardProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  // Data State
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');

  const [condition, setCondition] = useState<'BRAND_NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'>('LIKE_NEW');
  const [originalPrice, setOriginalPrice] = useState<string>('1200');
  const [itemAgeMonths, setItemAgeMonths] = useState<string>('6');

  const [images, setImages] = useState<File[]>([]);

  const [rentalPrice, setRentalPrice] = useState<string>('35');
  const [securityDeposit, setSecurityDeposit] = useState<string>('150');
  const [minRentalDays, setMinRentalDays] = useState<string>('1');
  const [maxRentalDays, setMaxRentalDays] = useState<string>('30');

  const [pickupLocation, setPickupLocation] = useState<string>('Central Library Ground Floor Counter');
  const [pickupInstructions, setPickupInstructions] = useState<string>('');

  const [stepError, setStepError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateListing();
  const priceAiMutation = usePriceRecommendation();

  // Set default category once categories load
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Campus Pickup Spots available at Aditya University
  const campusPickupSpots = [
    'Central Library Ground Floor Counter',
    'Main Campus Canteen Reception',
    'Campus Gate 1 Security Desk',
    'Department of Computer Science Lab B',
    'Student Activity Center Hub',
    'Mechanical Workshop Main Desk',
    'Hostel 4 Ground Floor Reception',
  ];

  // AI Fair Price Auto-Trigger or Manual Request
  const handleGetAiRecommendation = () => {
    const orig = parseFloat(originalPrice);
    const age = parseInt(itemAgeMonths, 10);
    if (!orig || orig <= 0) {
      setStepError('Please enter a valid original purchase price first.');
      return;
    }

    setStepError(null);
    priceAiMutation.mutate(
      {
        category_id: categoryId || (categories[0]?.id ?? ''),
        condition,
        original_price: orig,
        item_age_months: isNaN(age) ? 6 : age,
      },
      {
        onSuccess: (data) => {
          setRentalPrice(Math.round(data.recommended_price).toString());
          // Suggest standard 15-20% deposit
          if (!securityDeposit || securityDeposit === '0') {
            setSecurityDeposit(Math.round(orig * 0.15).toString());
          }
        },
      }
    );
  };

  // Step validation before moving forward
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!title.trim()) {
        setStepError('Please provide a title for your resource.');
        return;
      }
      if (!description.trim()) {
        setStepError('Please enter a short description to help other students.');
        return;
      }
      if (!categoryId) {
        setStepError('Please select a category.');
        return;
      }
    } else if (currentStep === 2) {
      const orig = parseFloat(originalPrice);
      if (isNaN(orig) || orig <= 0) {
        setStepError('Original purchase price must be greater than zero.');
        return;
      }
      const age = parseInt(itemAgeMonths, 10);
      if (isNaN(age) || age < 0) {
        setStepError('Item age in months cannot be negative.');
        return;
      }
    } else if (currentStep === 3) {
      if (images.length === 0) {
        setStepError('Please upload at least 1 authentic photograph of your item.');
        return;
      }
    } else if (currentStep === 4) {
      const dailyPrice = parseFloat(rentalPrice);
      if (isNaN(dailyPrice) || dailyPrice <= 0) {
        setStepError('Daily rental price must be at least ₹1.');
        return;
      }
      const deposit = parseFloat(securityDeposit);
      if (isNaN(deposit) || deposit < 0) {
        setStepError('Security deposit cannot be negative.');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Form Submission
  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category_id', categoryId);
    formData.append('condition', condition);
    formData.append('original_price', originalPrice);
    formData.append('item_age_months', itemAgeMonths);
    formData.append('rental_price_per_day', rentalPrice);
    formData.append('security_deposit', securityDeposit);
    formData.append('min_rental_days', minRentalDays);
    formData.append('max_rental_days', maxRentalDays);
    formData.append('pickup_location', pickupLocation);
    if (brand.trim()) formData.append('brand', brand.trim());
    if (modelName.trim()) formData.append('model_name', modelName.trim());
    if (pickupInstructions.trim()) formData.append('pickup_instructions', pickupInstructions.trim());

    images.forEach((file) => {
      formData.append('images', file);
    });

    createMutation.mutate(formData, {
      onSuccess: (data) => {
        if (onSuccess) onSuccess(data.id);
      },
      onError: (err: any) => {
        const errorDetail = err.response?.data?.detail;
        if (typeof errorDetail === 'object') {
          const firstKey = Object.keys(errorDetail)[0];
          setStepError(`${firstKey}: ${errorDetail[firstKey]}`);
        } else {
          setStepError(errorDetail || 'Failed to publish listing. Please check your inputs.');
        }
      },
    });
  };

  const conditionOptions = [
    {
      value: 'BRAND_NEW',
      title: 'Brand New',
      desc: 'Never used, original box or packaging intact.',
    },
    {
      value: 'LIKE_NEW',
      title: 'Like New',
      desc: 'Immaculate condition with no scratches or wear.',
    },
    {
      value: 'GOOD',
      title: 'Good',
      desc: 'Minor cosmetic signs, 100% functional and tested.',
    },
    {
      value: 'FAIR',
      title: 'Fair',
      desc: 'Visible wear, perfectly usable for college coursework.',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden max-w-3xl mx-auto">
      {/* Top Wizard Navigation Header */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2D2468] to-[#1E1B4B] text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-indigo-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Campus Resource Listing Wizard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              List an Item for Rent
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Share your equipment with fellow students safely and earn money every week.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-indigo-200">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="w-32 h-2 rounded-full bg-white/20 mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="grid grid-cols-5 gap-2 pt-6 text-center text-[11px] font-semibold">
          {[
            { step: 1, label: 'Basics' },
            { step: 2, label: 'Condition' },
            { step: 3, label: 'Photos' },
            { step: 4, label: 'AI Pricing' },
            { step: 5, label: 'Handover' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              disabled={s.step > currentStep}
              onClick={() => setCurrentStep(s.step)}
              className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                currentStep === s.step
                  ? 'bg-white text-[#1E1B4B] font-bold shadow-xs'
                  : currentStep > s.step
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 cursor-not-allowed'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {stepError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{stepError}</span>
          </div>
        )}

        {/* STEP 1: CATEGORY & TITLE */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Select Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {categories.map((cat: Category) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'border-[#5B4DFF] bg-indigo-50/60 ring-2 ring-[#5B4DFF]/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Tag
                        className={`w-4 h-4 ${
                          isSelected ? 'text-[#5B4DFF]' : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-[#5B4DFF]' : 'text-slate-800'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                2. Resource Title *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="e.g. Casio fx-991EX Scientific Calculator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {title.length}/150 characters
              </span>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Casio, Drafter Pro, Sony"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Model / Edition (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. fx-991EX Classwiz, 5th Edition"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                3. Description & Usage Notes *
              </label>
              <textarea
                required
                rows={3}
                maxLength={2000}
                placeholder="Describe condition, included accessories (e.g. cover, battery, manual), and coursework suitability."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF] resize-none"
              />
            </div>
          </motion.div>
        )}

        {/* STEP 2: CONDITION & ORIGINAL PURCHASE */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Item Condition *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {conditionOptions.map((opt) => {
                  const isSelected = condition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCondition(opt.value as any)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#5B4DFF] bg-indigo-50/60 ring-2 ring-[#5B4DFF]/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{opt.title}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#5B4DFF] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Original Purchase Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Original Purchase Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1200"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used by our AI to compute fair campus rental rates.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Age in Months *
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  placeholder="6"
                  value={itemAgeMonths}
                  onChange={(e) => setItemAgeMonths(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g., 2 for two months ago, 12 for one year.
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: PHOTO UPLOADS */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload Authentic Photographs</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Students trust listings with clear, unedited photos showing item condition.
              </p>
            </div>

            <ImageUploader
              files={images}
              onChange={setImages}
              maxFiles={5}
              maxSizeMB={5}
            />
          </motion.div>
        )}

        {/* STEP 4: AI FAIR PRICING & DEPOSIT */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* AI Fair Price Engine Card */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-indigo-100/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#5B4DFF] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1E1B4B]">
                      AI Fair Rental Price Engine
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Trained on student demand, item age, and category wear factors.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetAiRecommendation}
                  disabled={priceAiMutation.isPending}
                  className="px-3.5 py-1.5 rounded-xl bg-[#5B4DFF] hover:bg-[#4E3FE6] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {priceAiMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Ask AI Engine</span>
                  )}
                </button>
              </div>

              {priceAiMutation.data && (
                <div className="p-4 rounded-xl bg-white border border-indigo-200/60 shadow-xs space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-500">AI Suggested Rate:</span>
                      <div className="text-xl font-extrabold text-[#5B4DFF]">
                        ₹{Math.round(priceAiMutation.data.recommended_price)}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ day</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Suggested Range:</span>
                      <div className="text-xs font-bold text-slate-700">
                        ₹{Math.round(priceAiMutation.data.min_price)} – ₹{Math.round(priceAiMutation.data.max_price)}
                      </div>
                    </div>
                  </div>

                  {priceAiMutation.data.explanation_factors && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                      {priceAiMutation.data.explanation_factors.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Price & Deposit Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Daily Rental Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Refundable Security Deposit (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                  />
                </div>
              </div>
            </div>

            {/* Rental Duration Boundaries */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={minRentalDays}
                  onChange={(e) => setMinRentalDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maximum Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={maxRentalDays}
                  onChange={(e) => setMaxRentalDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CAMPUS PICKUP & FINAL REVIEW */}
        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Pickup Spot Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Designated Campus Handover Location *
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              >
                {campusPickupSpots.map((spot) => (
                  <option key={spot} value={spot}>
                    {spot}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Handover & Timing Instructions (Optional)
              </label>
              <input
                type="text"
                maxLength={500}
                placeholder="e.g., Available between 4 PM – 6 PM outside the main library."
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5B4DFF]/20 focus:border-[#5B4DFF]"
              />
            </div>

            {/* Review Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Listing Review Summary
              </h4>

              <div className="flex items-start gap-4">
                {images.length > 0 && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                    <img
                      src={URL.createObjectURL(images[0])}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-900 truncate">{title}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-extrabold text-[#5B4DFF]">
                      ₹{rentalPrice} / day
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600">Deposit: ₹{securityDeposit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{pickupLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <div />
            )}
          </div>

          <div>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#5B4DFF] hover:bg-[#4E3FE6] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={createMutation.isPending}
                className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish to Campus</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
