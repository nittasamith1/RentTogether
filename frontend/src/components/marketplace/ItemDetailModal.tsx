import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Star,
  MapPin,
  Heart,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Edit3,
  Pause,
  Play,
  Layers,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { marketplaceService, ItemSummary } from '../../services/marketplace';
import { useWishlist } from '../../hooks/useWishlist';
import { bookingService } from '../../services/bookingService';
import { listingService } from '../../services/listingService';
import { ItemAvailabilityCalendar } from '../availability/ItemAvailabilityCalendar';
import { useItemAvailability, AVAILABILITY_KEYS } from '../../hooks/useAvailability';

interface ItemDetailModalProps {
  itemId: string;
  onClose: () => void;
  onSelectRelated?: (item: ItemSummary) => void;
  onEditListing?: (itemId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  itemId,
  onClose,
  onSelectRelated,
  onEditListing,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { toggleWishlist } = useWishlist();
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  // Helper date formatter: YYYY-MM-DD (local timezone aware)
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  }, []);

  const [startDate, setStartDate] = useState<string>(tomorrow);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>(tomorrow);
  const [endTime, setEndTime] = useState<string>('14:00');
  const [messageToOwner, setMessageToOwner] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState<boolean>(true);

  // Fetch real-time item availability blocks
  const { data: availabilityData } = useItemAvailability(itemId);
  const availabilityBlocks = availabilityData?.availability || [];

  // Real-time pre-flight conflict calculation against server availability blocks
  const availabilityConflict = useMemo(() => {
    if (!availabilityBlocks || availabilityBlocks.length === 0) return null;
    if (!startDate || !endDate || !startTime || !endTime) return null;

    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start.getTime() >= end.getTime()) return null;

    for (const block of availabilityBlocks) {
      const blockStart = block.start_datetime
        ? new Date(block.start_datetime)
        : new Date(`${block.start_date}T00:00:00`);
      const blockEnd = block.end_datetime
        ? new Date(block.end_datetime)
        : new Date(`${block.end_date}T00:00:00`);

      // Half-open interval overlap [start, end) and [blockStart, blockEnd)
      // Conflict exists iff start < blockEnd && end > blockStart
      if (start.getTime() < blockEnd.getTime() && end.getTime() > blockStart.getTime()) {
        const reasonDesc =
          block.reason === 'BOOKED'
            ? 'an active booking reservation'
            : block.reason === 'MAINTENANCE'
            ? 'scheduled maintenance'
            : 'owner personal schedule block';
        return `Selected time overlaps with ${reasonDesc} (${block.start_date} to ${block.end_date}). Please choose another date or time slot.`;
      }
    }
    return null;
  }, [availabilityBlocks, startDate, endDate, startTime, endTime]);

  const handleToggleStatus = async () => {
    if (!item) return;
    setIsTogglingStatus(true);
    try {
      const nextStatus = item.availability_status === 'AVAILABLE' ? 'PAUSED' : 'ACTIVE';
      await listingService.updateStatus(item.id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: ['item-detail', itemId] });
      await queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      await queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      await queryClient.invalidateQueries({ queryKey: ['marketplace-categories'] });
    } catch (err: any) {
      console.error('Failed to update listing status', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Prevent background scroll and allow Escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item-detail', itemId],
    queryFn: () => marketplaceService.getItemDetail(itemId),
    staleTime: 1000 * 60 * 3,
  });

  // Calculate rental duration in hours and days: [start_datetime, end_datetime)
  const { totalHours, formattedDuration, durationDays } = useMemo(() => {
    if (!startDate || !endDate || !startTime || !endTime) {
      return { totalHours: 0, formattedDuration: '0 hours', durationDays: 0 };
    }
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) {
      return { totalHours: 0, formattedDuration: 'Invalid duration (end must be after start)', durationDays: 0 };
    }

    const hours = Math.round((diffMs / (1000 * 3600)) * 100) / 100;
    const days = Math.floor(hours / 24);
    const remHours = Math.round((hours % 24) * 10) / 10;

    let desc = '';
    if (days > 0 && remHours > 0) {
      desc = `${days} day${days > 1 ? 's' : ''} ${remHours} hr${remHours !== 1 ? 's' : ''}`;
    } else if (days > 0) {
      desc = `${days} day${days > 1 ? 's' : ''}`;
    } else {
      desc = `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return { totalHours: hours, formattedDuration: desc, durationDays: Math.max(1, Math.ceil(hours / 24)) };
  }, [startDate, endDate, startTime, endTime]);

  const dailyRate = item ? parseFloat(String(item.daily_rental_price)) : 0;
  const hourlyRate = Math.round((dailyRate / 24) * 100) / 100;
  const totalAmount = Math.round(hourlyRate * totalHours * 100) / 100;

  const handleRequestBooking = async () => {
    if (!item) return;
    setBookingError(null);

    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setBookingError('Please select valid pickup and return dates and times.');
      return;
    }

    if (start.getTime() >= end.getTime()) {
      setBookingError('Return time must be strictly after pickup time.');
      return;
    }

    const now = new Date();
    if (start.getTime() < now.getTime() - 5 * 60 * 1000) {
      setBookingError('Rental pickup time cannot be in the past. Please select an upcoming date and time.');
      return;
    }

    if (totalHours <= 0) {
      setBookingError('Return time must be strictly after pickup time.');
      return;
    }

    if (availabilityConflict) {
      setBookingError(availabilityConflict);
      return;
    }

    setIsSubmitting(true);
    try {
      const startDt = start.toISOString();
      const endDt = end.toISOString();
      await bookingService.createBooking({
        item_id: item.id,
        start_datetime: startDt,
        end_datetime: endDt,
        start_date: startDate,
        end_date: endDate,
        message_to_owner: messageToOwner.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
      await queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      await queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });

      onClose();
      navigate('/rentals');
    } catch (err: any) {
      const data = err.response?.data;
      let msg = '';
      if (typeof data === 'string') {
        msg = data;
      } else if (data?.detail) {
        msg = Array.isArray(data.detail) ? data.detail.join(', ') : String(data.detail);
      } else if (data?.non_field_errors) {
        msg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : String(data.non_field_errors);
      } else if (data && typeof data === 'object') {
        const messages: string[] = [];
        for (const [key, val] of Object.entries(data)) {
          if (key === 'error') continue;
          if (Array.isArray(val)) {
            messages.push(`${key}: ${val.join(', ')}`);
          } else if (typeof val === 'string') {
            messages.push(`${key}: ${val}`);
          } else if (typeof val === 'object' && val !== null) {
            messages.push(`${key}: ${JSON.stringify(val)}`);
          }
        }
        msg = messages.length > 0 ? messages.join(' | ') : (data.error || 'Unable to request booking.');
      } else {
        msg = err.message || 'Unable to request booking. Please check date/time availability.';
      }
      setBookingError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#303653]/60 backdrop-blur-sm p-4">
        <div
          className="rounded-3xl p-8 max-w-lg w-full flex flex-col items-center gap-4 border shadow-2xl"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="w-8 h-8 border-3 border-[#7563D9] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold" style={{ color: '#303653' }}>Loading campus resource details...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (isError || !item) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#303653]/60 backdrop-blur-sm p-4">
        <div
          className="rounded-3xl p-6 max-w-md w-full flex flex-col items-center text-center gap-3 border shadow-2xl"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-base font-bold" style={{ color: '#303653' }}>Resource Unavailable</h3>
          <p className="text-xs" style={{ color: '#85899B' }}>
            This item could not be loaded or is not accessible within your campus network.
          </p>
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm cursor-pointer"
            style={{ backgroundColor: '#7563D9' }}
          >
            Back to Marketplace
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const galleryImages =
    item.images && item.images.length > 0
      ? item.images.map((img) => img.image_url)
      : [item.primary_image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'];

  const currentDisplayImage = galleryImages[activeImageIndex] || galleryImages[0];

  const conditionLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    BRAND_NEW: { label: 'Brand New', bg: '#DDF3E7', text: '#2D7A5B', border: '#B8E5CC' },
    LIKE_NEW: { label: 'Like New', bg: '#DFEDFF', text: '#3A6BB5', border: '#C5DCFA' },
    GOOD: { label: 'Good', bg: '#E9E3FF', text: '#7563D9', border: '#D8D0F5' },
    FAIR: { label: 'Fair', bg: '#FFE5D6', text: '#C45C20', border: '#FCD3BE' },
  };

  const conditionInfo = conditionLabels[item.condition] || {
    label: item.condition,
    bg: '#FFF8ED',
    text: '#85899B',
    border: '#EAE6E1',
  };

  const isAvailable = item.availability_status === 'AVAILABLE';
  const retailPrice = item.original_purchase_price ? parseFloat(String(item.original_purchase_price)) : null;
  const estimatedSavings = retailPrice ? Math.max(0, retailPrice - dailyRate * (durationDays || 3)) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#303653]/70 backdrop-blur-sm p-3 sm:p-6 md:p-8 flex items-start justify-center overscroll-contain"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-bold border"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
            >
              {item.category_name}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
              style={{
                backgroundColor: conditionInfo.bg,
                borderColor: conditionInfo.border,
                color: conditionInfo.text,
              }}
            >
              {conditionInfo.label}
            </span>
            {item.is_own_item ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
                style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Your Listing (Owner)
              </span>
            ) : isAvailable ? (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#42A879' }} />
                Available on Campus
              </span>
            ) : (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#85899B' }}
              >
                <Clock className="w-3.5 h-3.5" />
                Currently Borrowed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!item.is_own_item && (
              <button
                onClick={() => toggleWishlist(item)}
                aria-label={item.is_wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="p-2 rounded-xl border transition-transform active:scale-80 hover:scale-110 duration-150 shadow-xs cursor-pointer"
                style={{
                  backgroundColor: item.is_wishlisted ? '#FFE5D6' : '#FFFCF7',
                  borderColor: item.is_wishlisted ? '#F5CDB8' : '#EAE6E1',
                  color: item.is_wishlisted ? '#F28B82' : '#85899B',
                }}
                title={item.is_wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-4 h-4 transition-colors ${item.is_wishlisted ? 'fill-[#F28B82] text-[#F28B82]' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl border transition shadow-xs cursor-pointer hover:bg-black/5"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#85899B' }}
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Modal Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Photos Gallery & Details (5 cols) */}
          <div className="min-w-0 md:col-span-5 flex flex-col gap-3">
            <div
              className="aspect-4/3 rounded-2xl overflow-hidden border relative"
              style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
            >
              <img
                src={currentDisplayImage}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Thumbnail list if multiple */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className="w-16 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer"
                    style={{
                      borderColor: activeImageIndex === idx ? '#7563D9' : '#EAE6E1',
                      opacity: activeImageIndex === idx ? 1 : 0.7,
                    }}
                  >
                    <img src={src} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Price & Deposit Summary Card */}
            <div
              className="rounded-2xl p-4 flex flex-col gap-2 border"
              style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl font-black" style={{ color: '#303653' }}>₹{dailyRate}</span>
                  <span className="text-xs font-semibold" style={{ color: '#85899B' }}>/day</span>
                  <span className="text-xs font-semibold" style={{ color: '#85899B' }}>•</span>
                  <span className="text-base font-black" style={{ color: '#7563D9' }}>₹{hourlyRate.toFixed(2)}</span>
                  <span className="text-xs font-semibold" style={{ color: '#85899B' }}>/hour</span>
                </div>
              </div>

              {retailPrice && estimatedSavings && estimatedSavings > 0 && (
                <div
                  className="text-[11px] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border font-semibold"
                  style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#2D7A5B' }}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#42A879' }} />
                  <span>
                    Save approx <strong>₹{estimatedSavings.toFixed(0)}</strong> vs buying new (₹{retailPrice})
                  </span>
                </div>
              )}
            </div>

            {/* Owner Profile Card */}
            <div
              className="border rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: '#7563D9' }}
                >
                  {item.owner.display_name ? item.owner.display_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold truncate" style={{ color: '#303653' }}>
                      {item.owner.display_name || 'Campus Student'}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0"
                      style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
                    >
                      {item.owner.badge || 'Verified Member'}
                    </span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: '#85899B' }}>
                    {item.owner.department ? `${item.owner.department} • ` : ''}
                    {item.owner.year_of_study ? `Year ${item.owner.year_of_study}` : 'Student'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {item.owner.review_count > 0 ? (
                  <>
                    <div className="flex items-center justify-end gap-1 text-xs font-bold" style={{ color: '#E8A447' }}>
                      <Star className="w-4 h-4 fill-[#E8A447]" />
                      <span>{item.owner.reputation.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: '#85899B' }}>{item.owner.review_count} peer reviews</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-end gap-1 text-xs font-bold" style={{ color: '#42A879' }}>
                      <span>New Member</span>
                    </div>
                    <span className="text-[10px]" style={{ color: '#85899B' }}>No reviews yet</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Information, Date Selection & Booking (7 cols) */}
          <div className="min-w-0 md:col-span-7 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: '#303653' }}>
                  {item.title}
                </h2>
                {item.brand && (
                  <p className="text-xs font-medium mt-1" style={{ color: '#85899B' }}>
                    Brand: <strong style={{ color: '#303653' }}>{item.brand}</strong>{' '}
                    {item.model_name ? `• Model: ${item.model_name}` : ''}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#303653' }}>
                  Resource Description
                </h4>
                <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#85899B' }}>
                  {item.description}
                </p>
              </div>

              {/* Campus Pickup Spots */}
              {item.pickup_locations && item.pickup_locations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#303653' }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
                    Campus Handover Locations
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.pickup_locations.map((spot, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold border"
                        style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                      >
                        {spot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Time Selection Box */}
              {!item.is_own_item && isAvailable && (
                <div
                  className="rounded-2xl p-4 border space-y-3.5 shadow-xs"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#303653' }}>
                      <Calendar className="w-4 h-4" style={{ color: '#7563D9' }} />
                      Rental Schedule (Hourly & Daily)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer hover:bg-white"
                        style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
                      >
                        {showCalendar ? 'Hide Calendar' : 'View Calendar'}
                      </button>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}>
                        ₹{hourlyRate.toFixed(2)}/hr
                      </span>
                    </div>
                  </div>

                  {/* Interactive Visual Item Availability Calendar */}
                  {showCalendar && (
                    <div className="pt-1">
                      <ItemAvailabilityCalendar
                        itemId={item.id}
                        pricePerDay={dailyRate}
                        selectedStartDate={startDate}
                        selectedEndDate={endDate}
                        onSelectDateRange={(s, e) => {
                          setStartDate(s);
                          setEndDate(e);
                        }}
                      />
                    </div>
                  )}

                  {/* Pickup and Return Date-Time Pickers */}
                  <div className="space-y-2.5">
                    {/* Pickup */}
                    <div>
                      <label className="text-[11px] font-bold block mb-1 flex items-center gap-1" style={{ color: '#303653' }}>
                        <span>Pickup Date & Time</span>
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        <input
                          type="date"
                          min={formatYMD(new Date())}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="col-span-3 text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                        />
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="col-span-2 text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                        />
                      </div>
                    </div>

                    {/* Return */}
                    <div>
                      <label className="text-[11px] font-bold block mb-1 flex items-center gap-1" style={{ color: '#303653' }}>
                        <span>Return Date & Time</span>
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        <input
                          type="date"
                          min={startDate || formatYMD(new Date())}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="col-span-3 text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                        />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="col-span-2 text-xs font-semibold p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                          style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Duration Badge */}
                  {totalHours > 0 ? (
                    <div
                      className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl border"
                      style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#303653' }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: '#7563D9' }} />
                        Rental Duration:
                      </span>
                      <span className="font-bold" style={{ color: '#7563D9' }}>
                        {formattedDuration} ({totalHours} {totalHours === 1 ? 'hr' : 'hrs'})
                      </span>
                    </div>
                  ) : (
                    <div
                      className="text-xs font-medium p-2 rounded-xl border text-center"
                      style={{ backgroundColor: '#FFE5D6', borderColor: '#F28B82', color: '#E87575' }}
                    >
                      Return time must be strictly after pickup time.
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold block mb-1" style={{ color: '#303653' }}>
                      Note to Owner (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Need for final exam lab experiment on Thursday morning..."
                      value={messageToOwner}
                      onChange={(e) => setMessageToOwner(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#7563D9]"
                      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                    />
                  </div>

                  {/* Pricing Breakdown Card - Exact Hourly / Daily Formula */}
                  <div
                    className="p-3.5 rounded-xl border text-xs space-y-2"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                  >
                    <div className="flex justify-between" style={{ color: '#85899B' }}>
                      <span>Hourly Rate (₹{dailyRate}/24)</span>
                      <span className="font-semibold" style={{ color: '#303653' }}>₹{hourlyRate.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#85899B' }}>
                      <span>Rental Duration</span>
                      <span className="font-semibold" style={{ color: '#303653' }}>{totalHours} hrs</span>
                    </div>
                    <div className="flex justify-between" style={{ color: '#85899B' }}>
                      <span>Rental Fee ({totalHours} hrs × ₹{hourlyRate.toFixed(2)})</span>
                      <span className="font-bold" style={{ color: '#303653' }}>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center" style={{ color: '#85899B' }}>
                      <span>Payment Method</span>
                      <span className="font-semibold px-2 py-0.5 rounded-md text-[11px] border" style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#7563D9' }}>
                        In-Person Offline Cash
                      </span>
                    </div>
                    <div
                      className="pt-2 flex justify-between items-baseline font-black text-sm"
                      style={{ borderTop: '1px solid #EAE6E1', color: '#303653' }}
                    >
                      <span className="text-xs uppercase tracking-wider">Total Cash Payable:</span>
                      <span className="text-base" style={{ color: '#7563D9' }}>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Real-time Pre-Flight Overlap / Unavailability Banner */}
                  {availabilityConflict && (
                    <div
                      className="p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 border"
                      style={{ backgroundColor: '#FFE5D6', borderColor: '#F28B82', color: '#E87575' }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Time Slot Unavailable</p>
                        <p className="text-[11px] mt-0.5 font-normal opacity-90">{availabilityConflict}</p>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <div
                      className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border"
                      style={{ backgroundColor: '#FFE5D6', borderColor: '#F28B82', color: '#E87575' }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Owner Management Console or Rental Request Actions */}
            <div className="pt-2">
              {item.is_own_item ? (
                <div
                  className="rounded-2xl p-4 sm:p-5 border space-y-4 shadow-xs"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
                      style={{ backgroundColor: '#7563D9', color: '#fff' }}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: '#303653' }}>
                        Owner Management Console
                      </h4>
                      <p className="text-[11px]" style={{ color: '#85899B' }}>
                        Manage this resource's availability, status, and bookings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border bg-white" style={{ borderColor: '#EAE6E1' }}>
                    <span className="font-semibold" style={{ color: '#85899B' }}>Campus Visibility:</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5"
                      style={{
                        backgroundColor: isAvailable ? '#DDF3E7' : '#FFE5D6',
                        borderColor: isAvailable ? '#B8E5CC' : '#FCD3BE',
                        color: isAvailable ? '#2D7A5B' : '#C45C20',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isAvailable ? '#42A879' : '#C45C20' }} />
                      {isAvailable ? 'Active on Campus' : 'Paused / Hidden'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onEditListing) {
                          onEditListing(item.id);
                        } else {
                          navigate('/listings');
                        }
                      }}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition shadow-xs cursor-pointer hover:bg-white active:scale-98"
                      style={{ backgroundColor: '#FFFCF7', borderColor: '#D8D0F5', color: '#7563D9' }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Listing</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={isTogglingStatus}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition shadow-xs cursor-pointer hover:opacity-90 active:scale-98"
                      style={{
                        backgroundColor: isAvailable ? '#FFE5D6' : '#DDF3E7',
                        borderColor: isAvailable ? '#FCD3BE' : '#B8E5CC',
                        color: isAvailable ? '#C45C20' : '#2D7A5B',
                      }}
                    >
                      {isTogglingStatus ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isAvailable ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Listing</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume Listing</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/bookings');
                      }}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition shadow-xs cursor-pointer hover:bg-white active:scale-98"
                      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#7563D9]" />
                      <span>Manage Availability</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/bookings');
                      }}
                      className="py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition shadow-xs cursor-pointer hover:bg-white active:scale-98"
                      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                    >
                      <Layers className="w-3.5 h-3.5 text-[#7563D9]" />
                      <span>View Booking Requests</span>
                    </button>
                  </div>
                </div>
              ) : isAvailable ? (
                <button
                  type="button"
                  disabled={isSubmitting || durationDays <= 0 || Boolean(availabilityConflict)}
                  onClick={handleRequestBooking}
                  className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: availabilityConflict ? '#E87575' : '#7563D9' }}
                  onMouseEnter={(e) => {
                    if (!availabilityConflict && !isSubmitting && durationDays > 0) {
                      e.currentTarget.style.backgroundColor = '#6552C5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!availabilityConflict) {
                      e.currentTarget.style.backgroundColor = '#7563D9';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : availabilityConflict ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Dates/Times Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Request Rental ({durationDays} days · ₹{totalAmount.toFixed(2)})
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-6 rounded-2xl text-xs font-bold cursor-not-allowed border"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#85899B' }}
                >
                  Currently Borrowed by Another Peer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related Items Section */}
        {item.related_items && item.related_items.length > 0 && (
          <div
            className="px-6 py-5 border-t"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#303653' }}>
              Other {item.category_name} items on campus
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {item.related_items.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    if (onSelectRelated) onSelectRelated(rel);
                  }}
                  className="rounded-xl p-2.5 border hover:border-[#7563D9] cursor-pointer transition shadow-xs group"
                  style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
                >
                  <div
                    className="aspect-16/10 rounded-lg overflow-hidden mb-2 border"
                    style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5' }}
                  >
                    <img
                      src={rel.primary_image_url}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <h5 className="text-[11px] font-bold line-clamp-1 group-hover:text-[#7563D9]" style={{ color: '#303653' }}>
                    {rel.title}
                  </h5>
                  <p className="text-[11px] font-extrabold mt-0.5" style={{ color: '#303653' }}>
                    ₹{parseFloat(String(rel.daily_rental_price))}{' '}
                    <span className="text-[9px] font-normal" style={{ color: '#85899B' }}>/day</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
};
