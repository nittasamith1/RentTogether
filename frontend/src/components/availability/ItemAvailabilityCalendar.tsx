import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useItemAvailability } from '../../hooks/useAvailability';

interface ItemAvailabilityCalendarProps {
  itemId: string;
  pricePerDay: number;
  securityDeposit?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  onRangeSelect?: (range: {
    startDate: string;
    endDate: string;
    days: number;
    subtotal: number;
    deposit: number;
    totalAmount: number;
  } | null) => void;
  onSelectDateRange?: (startDate: string, endDate: string) => void;
}

export const ItemAvailabilityCalendar: React.FC<ItemAvailabilityCalendarProps> = ({
  itemId,
  pricePerDay,
  securityDeposit = 0,
  minRentalDays = 1,
  maxRentalDays = 30,
  selectedStartDate: propStartDate,
  selectedEndDate: propEndDate,
  onRangeSelect,
  onSelectDateRange,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [internalStartDate, setInternalStartDate] = useState<string | null>(null);
  const [internalEndDate, setInternalEndDate] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const selectedStartDate = propStartDate !== undefined ? propStartDate : internalStartDate;
  const selectedEndDate = propEndDate !== undefined ? propEndDate : internalEndDate;

  const setStartDate = (val: string | null) => {
    setInternalStartDate(val);
  };

  const setEndDate = (val: string | null) => {
    setInternalEndDate(val);
  };

  // Fetch unavailable blocks from backend
  const { data: availabilityData } = useItemAvailability(itemId);
  const blocks = availabilityData?.availability || [];

  // Helper formatting YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Determine unavailable dates map
  // Blocks use [start_date, end_date) convention: start is blocked, end date is available
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, 'BOOKED' | 'OWNER_UNAVAILABLE' | 'MAINTENANCE'>();

    blocks.forEach((block) => {
      const cur = new Date(block.start_date + 'T00:00:00');
      const end = new Date(block.end_date + 'T00:00:00');

      while (cur < end) {
        const dStr = formatDateStr(cur);
        map.set(dStr, block.reason);
        cur.setDate(cur.getDate() + 1);
      }
    });

    return map;
  }, [blocks]);

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      blockReason?: 'BOOKED' | 'OWNER_UNAVAILABLE' | 'MAINTENANCE';
    }> = [];

    // Preceding empty/overflow days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: `prev-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isPast: true,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dStr = formatDateStr(curDate);
      const isPast = dStr < todayStr;
      const blockReason = dateStatusMap.get(dStr);

      days.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isPast,
        blockReason,
      });
    }

    return days;
  }, [currentMonth, todayStr, dateStatusMap]);

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const nowMonth = new Date();
    nowMonth.setDate(1);
    if (prev >= nowMonth) {
      setCurrentMonth(prev);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (dayStr: string, isPast: boolean, blockReason?: string) => {
    if (isPast || blockReason) return;
    setErrorNotice(null);

    // If starting a new selection or already have a full range selected
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setStartDate(dayStr);
      setEndDate(null);
      if (onSelectDateRange) onSelectDateRange(dayStr, dayStr);
      if (onRangeSelect) onRangeSelect(null);
      return;
    }

    // If selecting the end date
    if (selectedStartDate && !selectedEndDate) {
      if (dayStr < selectedStartDate) {
        // Reset and use this as the new start date
        setStartDate(dayStr);
        setEndDate(null);
        if (onSelectDateRange) onSelectDateRange(dayStr, dayStr);
        if (onRangeSelect) onRangeSelect(null);
        return;
      }

      if (dayStr === selectedStartDate) {
        // Same-day hourly rental selection
        setEndDate(dayStr);
        if (onSelectDateRange) onSelectDateRange(selectedStartDate, dayStr);
        if (onRangeSelect) {
          onRangeSelect({
            startDate: selectedStartDate,
            endDate: dayStr,
            days: 1,
            subtotal: pricePerDay,
            deposit: 0,
            totalAmount: pricePerDay,
          });
        }
        return;
      }

      // Check if any date in between is unavailable
      const start = new Date(selectedStartDate + 'T00:00:00');
      const targetEnd = new Date(dayStr + 'T00:00:00');
      let cur = new Date(start);
      let hasConflict = false;

      // Note: [start_date, end_date) - dayStr itself is exclusive checkout day!
      while (cur < targetEnd) {
        const checkStr = formatDateStr(cur);
        if (dateStatusMap.has(checkStr)) {
          hasConflict = true;
          break;
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (hasConflict) {
        setErrorNotice('Cannot reserve across unavailable dates. Please select consecutive available dates.');
        return;
      }

      // Calculate days
      const days = Math.max(1, Math.round((targetEnd.getTime() - start.getTime()) / (1000 * 3600 * 24)));

      if (days < minRentalDays) {
        setErrorNotice(`Minimum rental duration is ${minRentalDays} day${minRentalDays > 1 ? 's' : ''}.`);
        return;
      }

      if (days > maxRentalDays) {
        setErrorNotice(`Maximum rental duration is ${maxRentalDays} days.`);
        return;
      }

      setEndDate(dayStr);
      if (onSelectDateRange) onSelectDateRange(selectedStartDate, dayStr);

      const subtotal = days * pricePerDay;
      const totalAmount = subtotal;

      if (onRangeSelect) {
        onRangeSelect({
          startDate: selectedStartDate,
          endDate: dayStr,
          days,
          subtotal,
          deposit: 0,
          totalAmount,
        });
      }
    }
  };

  // Duration and financial calculations
  const rentalDetails = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return null;

    const s = new Date(selectedStartDate + 'T00:00:00');
    const e = new Date(selectedEndDate + 'T00:00:00');
    const days = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
    const subtotal = days * pricePerDay;
    const deposit = 0;
    const totalAmount = subtotal;

    return {
      days,
      subtotal,
      deposit,
      totalAmount,
    };
  }, [selectedStartDate, selectedEndDate, pricePerDay, securityDeposit]);

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      className="rounded-2xl border p-4 space-y-4 shadow-xs"
      style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
    >
      {/* Calendar Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" style={{ color: '#7563D9' }} />
          <span className="font-extrabold text-sm" style={{ color: '#303653' }}>
            {monthLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer hover:bg-[#E9E3FF]"
            style={{ borderColor: '#EAE6E1', color: '#303653' }}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer hover:bg-[#E9E3FF]"
            style={{ borderColor: '#EAE6E1', color: '#303653' }}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold" style={{ color: '#85899B' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
          <div key={wd} className="py-0.5">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (!day.isCurrentMonth) {
            return <div key={`empty-${idx}`} className="h-8 rounded-lg" />;
          }

          const isStart = day.dateStr === selectedStartDate;
          const isEnd = day.dateStr === selectedEndDate;
          const isInRange =
            selectedStartDate &&
            selectedEndDate &&
            day.dateStr > selectedStartDate &&
            day.dateStr < selectedEndDate;

          const isPast = day.isPast;
          const reason = day.blockReason;
          const isUnavailable = isPast || Boolean(reason);

          let cellBg = '#FFF8ED';
          let textColor = '#303653';
          let borderStyle = '1px solid transparent';
          let cursorStyle = 'pointer';

          if (isStart || isEnd) {
            cellBg = '#7563D9';
            textColor = '#FFFFFF';
          } else if (isInRange) {
            cellBg = '#E9E3FF';
            textColor = '#7563D9';
          } else if (reason === 'BOOKED') {
            cellBg = '#ECEEF2';
            textColor = '#85899B';
            cursorStyle = 'not-allowed';
          } else if (reason === 'OWNER_UNAVAILABLE') {
            cellBg = '#FEE2E2';
            textColor = '#E87575';
            cursorStyle = 'not-allowed';
          } else if (reason === 'MAINTENANCE') {
            cellBg = '#FEF3C7';
            textColor = '#D97706';
            cursorStyle = 'not-allowed';
          } else if (isPast) {
            cellBg = '#F8F7F4';
            textColor = '#C2C4CF';
            cursorStyle = 'not-allowed';
          }

          return (
            <button
              key={day.dateStr}
              type="button"
              disabled={isUnavailable && !isEnd}
              onClick={() => handleDateClick(day.dateStr, isPast, reason)}
              className="h-8 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all relative group"
              style={{
                backgroundColor: cellBg,
                color: textColor,
                border: borderStyle,
                cursor: cursorStyle,
              }}
              title={
                reason === 'BOOKED'
                  ? 'Booked by peer student'
                  : reason === 'OWNER_UNAVAILABLE'
                  ? 'Blocked by owner for personal use'
                  : reason === 'MAINTENANCE'
                  ? 'Item under maintenance'
                  : undefined
              }
            >
              <span>{day.dayNum}</span>
              {/* Subtle status dot if booked/unavailable */}
              {reason === 'BOOKED' && (
                <span className="w-1 h-1 rounded-full absolute bottom-1" style={{ backgroundColor: '#85899B' }} />
              )}
              {reason === 'OWNER_UNAVAILABLE' && (
                <span className="w-1 h-1 rounded-full absolute bottom-1" style={{ backgroundColor: '#E87575' }} />
              )}
              {reason === 'MAINTENANCE' && (
                <span className="w-1 h-1 rounded-full absolute bottom-1" style={{ backgroundColor: '#D97706' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div
        className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium"
        style={{ borderTop: '1px solid #EAE6E1', color: '#85899B' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#42A879' }} />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#85899B' }} />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E87575' }} />
          <span>Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7563D9' }} />
          <span>Selected</span>
        </div>
      </div>

      {/* Error / Conflict Notice */}
      {errorNotice && (
        <div
          className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold"
          style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Date Selection Prompt or Price Breakdown */}
      {selectedStartDate && !selectedEndDate ? (
        <div
          className="p-3 rounded-xl border flex items-center gap-2 text-xs font-medium"
          style={{ backgroundColor: '#E9E3FF', borderColor: '#D8D0F5', color: '#7563D9' }}
        >
          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            Selected start date: <strong>{selectedStartDate}</strong>. Click an end date (return day) to complete reservation.
          </span>
        </div>
      ) : rentalDetails ? (
        <div
          className="p-3 rounded-xl border space-y-2 text-xs"
          style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: '#85899B' }}>Rental Window:</span>
            <span className="font-bold" style={{ color: '#303653' }}>
              {selectedStartDate} → {selectedEndDate} ({rentalDetails.days} days)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: '#85899B' }}>Rental Subtotal ({rentalDetails.days} × ₹{pricePerDay}):</span>
            <span className="font-bold" style={{ color: '#303653' }}>
              ₹{rentalDetails.subtotal}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: '#85899B' }}>Security Deposit:</span>
            <span className="font-bold" style={{ color: '#42A879' }}>
              ₹0.00 (Zero Deposit)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: '#85899B' }}>Payment Mode:</span>
            <span className="font-bold" style={{ color: '#7563D9' }}>
              In-Person Offline Cash
            </span>
          </div>

          <div
            className="pt-2 flex items-center justify-between text-sm font-extrabold"
            style={{ borderTop: '1px solid #EAE6E1', color: '#303653' }}
          >
            <span>Total Payable:</span>
            <span style={{ color: '#7563D9' }}>₹{rentalDetails.totalAmount}</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-center" style={{ color: '#85899B' }}>
          Select start and return dates to preview fees and availability.
        </div>
      )}
    </div>
  );
};
