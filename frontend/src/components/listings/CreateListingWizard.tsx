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
  const securityDeposit = '0';
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

  // Designated Aditya University campus handover hubs
  const campusPickupSpots = [
    'Central Library Ground Floor Counter',
    'Main Canteen & Student Food Court',
    'Campus Gate 1 Security Desk',
    'Ratan Tata Engineering Block Entrance',
    'Mechanical / Civil Workshop Porch',
    'Chemistry & Physics Lab Corridor (B-Block)',
    'Boys Hostel 1 Common Lounge',
    'Girls Hostel Reception Area',
  ];

  // Request AI price recommendation
  const handleGetAiRecommendation = () => {
    if (!categoryId) {
      setStepError('Please select a category first.');
      return;
    }
    const orig = parseFloat(originalPrice) || 1000;
    const age = parseInt(itemAgeMonths, 10) || 6;

    priceAiMutation.mutate(
      {
        category_id: categoryId,
        condition,
        original_price: orig,
        item_age_months: age,
      },
      {
        onSuccess: (data) => {
          if (data && data.recommended_price) {
            setRentalPrice(String(Math.round(data.recommended_price)));
          }
        },
      }
    );
  };

  // Step Validation & Progression
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!categoryId) {
        setStepError('Please select a resource category.');
        return;
      }
      if (!title.trim()) {
        setStepError('Please enter an item title.');
        return;
      }
      if (!description.trim()) {
        setStepError('Please enter a brief item description.');
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
    <div
      className="rounded-3xl border shadow-sm overflow-hidden max-w-3xl mx-auto"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Top Wizard Navigation Header */}
      <div
        className="text-white p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #7563D9 0%, #6552C5 100%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Campus Resource Listing Wizard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              List an Item for Rent
            </h1>
            <p className="text-xs text-white/80 mt-0.5">
              Share your equipment with fellow students safely and earn money every week.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-white/90">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="w-32 h-2 rounded-full bg-white/30 mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-300 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-6 text-center text-[10px] sm:text-[11px] font-semibold">
          {[
            { step: 1, label: 'Basics' },
            { step: 2, label: 'Condition' },
            { step: 3, label: 'Photos' },
            { step: 4, label: 'Pricing' },
            { step: 5, label: 'Handover' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              disabled={s.step > currentStep}
              onClick={() => setCurrentStep(s.step)}
              className={`py-1.5 px-1 rounded-xl transition-all cursor-pointer truncate ${
                currentStep === s.step
                  ? 'bg-white font-bold shadow-xs'
                  : currentStep > s.step
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 cursor-not-allowed'
              }`}
              style={{
                color: currentStep === s.step ? '#7563D9' : undefined,
              }}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {stepError && (
          <div
            className="p-3.5 rounded-2xl border text-xs flex items-center gap-2.5"
            style={{ backgroundColor: '#FFF0F0', borderColor: '#F28B82', color: '#E87575' }}
          >
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#303653' }}>
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
                      className="p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20"
                      style={{
                        backgroundColor: isSelected ? '#E9E3FF' : '#FFFCF7',
                        borderColor: isSelected ? '#7563D9' : '#EAE6E1',
                        color: isSelected ? '#7563D9' : '#303653',
                      }}
                    >
                      <Tag
                        className="w-4 h-4"
                        style={{ color: isSelected ? '#7563D9' : '#85899B' }}
                      />
                      <span className="text-xs font-bold truncate">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#303653' }}>
                2. Resource Title *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                placeholder="e.g. Casio fx-991EX Scientific Calculator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-hidden transition-all"
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
              <span className="text-[11px] mt-1 block" style={{ color: '#85899B' }}>
                {title.length}/150 characters
              </span>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Casio, Drafter Pro, Sony"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Model / Edition (Optional)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. fx-991EX Classwiz, 5th Edition"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#303653' }}>
                3. Description & Usage Notes *
              </label>
              <textarea
                required
                rows={3}
                maxLength={2000}
                placeholder="Describe condition, included accessories (e.g. cover, battery, manual), and coursework suitability."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-hidden resize-none"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#303653' }}>
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
                      className="p-4 rounded-2xl border text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? '#E9E3FF' : '#FFFCF7',
                        borderColor: isSelected ? '#7563D9' : '#EAE6E1',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ color: '#303653' }}>{opt.title}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#7563D9' }} />
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#85899B' }}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Original Purchase Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Original Purchase Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-sm" style={{ color: '#85899B' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="1200"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm focus:outline-hidden"
                    style={{
                      backgroundColor: '#FFF8ED',
                      border: '1px solid #EAE6E1',
                      color: '#303653',
                    }}
                  />
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: '#85899B' }}>
                  Used by our AI to compute fair campus rental rates.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
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
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
                <span className="text-[11px] mt-1 block" style={{ color: '#85899B' }}>
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
              <h3 className="text-sm font-bold" style={{ color: '#303653' }}>Upload Authentic Photographs</h3>
              <p className="text-xs mt-0.5" style={{ color: '#85899B' }}>
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
            <div
              className="rounded-2xl p-5 border shadow-xs space-y-3"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: '#7563D9' }}
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#303653' }}>
                      AI Fair Rental Price Engine
                    </h4>
                    <p className="text-[11px]" style={{ color: '#85899B' }}>
                      Trained on student demand, item age, and category wear factors.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetAiRecommendation}
                  disabled={priceAiMutation.isPending}
                  className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: '#7563D9' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
                >
                  {priceAiMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Ask AI Engine</span>
                  )}
                </button>
              </div>

              {priceAiMutation.data && (
                <div
                  className="p-4 rounded-xl border shadow-xs space-y-2"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs" style={{ color: '#85899B' }}>AI Suggested Rate:</span>
                      <div className="text-xl font-extrabold" style={{ color: '#7563D9' }}>
                        ₹{Math.round(priceAiMutation.data.recommended_price)}{' '}
                        <span className="text-xs font-normal" style={{ color: '#85899B' }}>/ day</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs" style={{ color: '#85899B' }}>Suggested Range:</span>
                      <div className="text-xs font-bold" style={{ color: '#303653' }}>
                        ₹{Math.round(priceAiMutation.data.min_price)} – ₹{Math.round(priceAiMutation.data.max_price)}
                      </div>
                    </div>
                  </div>

                  {priceAiMutation.data.explanation_factors && (
                    <div className="flex flex-wrap gap-1.5 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
                      {priceAiMutation.data.explanation_factors.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: '#E9E3FF', color: '#7563D9' }}
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
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#303653' }}>
                  Daily Rental Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-sm" style={{ color: '#85899B' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm focus:outline-hidden"
                    style={{
                      backgroundColor: '#FFF8ED',
                      border: '1px solid #EAE6E1',
                      color: '#303653',
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1.5 flex items-center gap-1 font-semibold" style={{ color: '#7563D9' }}>
                  <span>Hourly Rate:</span>
                  <span className="font-bold">
                    ₹{((parseFloat(rentalPrice) || 0) / 24).toFixed(2)}/hr
                  </span>
                  <span className="text-[10px] font-normal" style={{ color: '#85899B' }}>
                    (automatically ₹{rentalPrice || 0} ÷ 24)
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#303653' }}>
                  Security Deposit Policy
                </label>
                <div
                  className="p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between"
                  style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
                >
                  <span>Zero Deposit Campus Sharing</span>
                  <span className="font-bold">₹0.00</span>
                </div>
              </div>
            </div>

            {/* Rental Duration Boundaries */}
            <div className="grid grid-cols-2 gap-4 pt-2" style={{ borderTop: '1px solid #EAE6E1' }}>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Minimum Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={minRentalDays}
                  onChange={(e) => setMinRentalDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: '#303653' }}>
                  Maximum Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={maxRentalDays}
                  onChange={(e) => setMaxRentalDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-hidden"
                  style={{
                    backgroundColor: '#FFF8ED',
                    border: '1px solid #EAE6E1',
                    color: '#303653',
                  }}
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#303653' }}>
                Designated Campus Handover Location *
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-hidden"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
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
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#303653' }}>
                Handover & Timing Instructions (Optional)
              </label>
              <input
                type="text"
                maxLength={500}
                placeholder="e.g., Available between 4 PM – 6 PM outside the main library."
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-hidden"
                style={{
                  backgroundColor: '#FFF8ED',
                  border: '1px solid #EAE6E1',
                  color: '#303653',
                }}
              />
            </div>

            {/* Review Summary Card */}
            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#303653' }}>
                Listing Review Summary
              </h4>

              <div className="flex items-start gap-4">
                {images.length > 0 && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border" style={{ backgroundColor: '#E9E3FF', borderColor: '#EAE6E1' }}>
                    <img
                      src={URL.createObjectURL(images[0])}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold truncate" style={{ color: '#303653' }}>{title}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-extrabold" style={{ color: '#7563D9' }}>
                      ₹{rentalPrice} / day (₹{((parseFloat(rentalPrice) || 0) / 24).toFixed(2)}/hr)
                    </span>
                    <span className="text-xs" style={{ color: '#85899B' }}>·</span>
                    <span className="text-xs" style={{ color: '#85899B' }}>Deposit: ₹{securityDeposit}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: '#85899B' }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
                    <span className="truncate">{pickupLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wizard Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #EAE6E1' }}>
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                style={{ color: '#85899B' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#303653')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#85899B')}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ color: '#85899B' }}
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
                className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                style={{ backgroundColor: '#7563D9' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={createMutation.isPending}
                className="px-7 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: '#42A879' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#388E67')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#42A879')}
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
