import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Lock,
  Wrench,
  UserX,
  AlertCircle,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';
import { useOwnerCalendar, useCreateManualBlock, useDeleteManualBlock } from '../../hooks/useAvailability';
import { useDialog } from '../../context/DialogContext';
import { OwnerCalendarBlock } from '../../services/availabilityService';

interface OwnerAvailabilityCalendarProps {
  items: Array<{ id: string; title: string }>;
}

export const OwnerAvailabilityCalendar: React.FC<OwnerAvailabilityCalendarProps> = ({ items }) => {
  const dialog = useDialog();
  const [selectedItemId, setSelectedItemId] = useState<string>('ALL');
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Modal State for adding a block
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalItemId, setModalItemId] = useState<string>(items[0]?.id || '');
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [modalReason, setModalReason] = useState<'OWNER_UNAVAILABLE' | 'MAINTENANCE'>('OWNER_UNAVAILABLE');
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const createBlockMutation = useCreateManualBlock();
  const deleteBlockMutation = useDeleteManualBlock();

  const queryParams = useMemo(() => {
    return {
      item_id: selectedItemId === 'ALL' ? undefined : selectedItemId,
    };
  }, [selectedItemId]);

  const { data: calendarData, refetch } = useOwnerCalendar(queryParams);
  const blocks: OwnerCalendarBlock[] = calendarData?.results || [];

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Build map of dates -> blocks
  const dateBlocksMap = useMemo(() => {
    const map = new Map<string, OwnerCalendarBlock[]>();

    blocks.forEach((b) => {
      const cur = new Date(b.start_date + 'T00:00:00');
      const end = new Date(b.end_date + 'T00:00:00');

      while (cur < end) {
        const dStr = formatDateStr(cur);
        const arr = map.get(dStr) || [];
        arr.push(b);
        map.set(dStr, arr);
        cur.setDate(cur.getDate() + 1);
      }
    });

    return map;
  }, [blocks]);

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayBlocks: OwnerCalendarBlock[];
    }> = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dateStr: `prev-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        isToday: false,
        dayBlocks: [],
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dStr = formatDateStr(curDate);
      days.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        dayBlocks: dateBlocksMap.get(dStr) || [],
      });
    }

    return days;
  }, [currentMonth, todayStr, dateBlocksMap]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!modalItemId) {
      setFormError('Please select an item.');
      return;
    }
    if (!modalStartDate || !modalEndDate) {
      setFormError('Please provide both start and end dates.');
      return;
    }
    if (modalStartDate >= modalEndDate) {
      setFormError('End date must be strictly after start date (half-open [start_date, end_date)).');
      return;
    }
    if (modalStartDate < todayStr) {
      setFormError('Cannot create availability blocks for past dates.');
      return;
    }

    try {
      await createBlockMutation.mutateAsync({
        itemId: modalItemId,
        payload: {
          start_date: modalStartDate,
          end_date: modalEndDate,
          reason: modalReason,
        },
      });

      setIsModalOpen(false);
      setModalStartDate('');
      setModalEndDate('');
      setActionSuccess('Availability block saved successfully!');
      setTimeout(() => setActionSuccess(null), 3500);
      refetch();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to create block.';
      setFormError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const handleDeleteBlock = async (block: OwnerCalendarBlock) => {
    if (block.reason === 'BOOKED') {
      await dialog.alert({
        title: 'Active Rental Protected',
        message: 'Active rental bookings cannot be removed manually. The calendar slot will automatically open when the rental is completed or returned.',
        variant: 'warning',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'Remove Calendar Block',
      message: `Are you sure you want to remove this ${block.reason.toLowerCase()} block for "${block.item_title}" and reopen these dates on the campus marketplace?`,
      confirmText: 'Remove Block',
      cancelText: 'Keep Block',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteBlockMutation.mutateAsync({ blockId: block.id, itemId: block.item_id });
      dialog.showToast('Block removed successfully.', 'success');
      refetch();
    } catch (err: any) {
      dialog.showToast(err.response?.data?.detail || 'Failed to delete block.', 'error');
    }
  };

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {actionSuccess && (
        <div
          className="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold shadow-xs"
          style={{ backgroundColor: '#DDF3E7', borderColor: '#B8E5CC', color: '#42A879' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Filter and Actions Bar */}
      <div
        className="rounded-2xl p-4 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#303653' }}>
            <Layers className="w-4 h-4" style={{ color: '#7563D9' }} />
            <span>Filter Item:</span>
          </div>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border focus:outline-hidden"
            style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
          >
            <option value="ALL">All Listed Items ({items.length})</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalItemId(selectedItemId !== 'ALL' ? selectedItemId : items[0]?.id || '');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          style={{ backgroundColor: '#7563D9' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6552C5')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7563D9')}
        >
          <Plus className="w-4 h-4" />
          <span>Block Dates / Maintenance</span>
        </button>
      </div>

      {/* Calendar Card */}
      <div
        className="rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #EAE6E1' }}>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" style={{ color: '#7563D9' }} />
            <h2 className="text-lg font-extrabold" style={{ color: '#303653' }}>
              {monthLabel}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:bg-[#E9E3FF]"
              style={{ borderColor: '#EAE6E1', color: '#303653' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:bg-[#E9E3FF]"
              style={{ borderColor: '#EAE6E1', color: '#303653' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container (Horizontally scrollable on small mobile) */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[560px]">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold" style={{ color: '#85899B' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day.isCurrentMonth) {
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="min-h-[90px] rounded-2xl border border-transparent p-2 opacity-30"
                      style={{ backgroundColor: '#F8F7F4' }}
                    />
                  );
                }

                return (
                  <div
                    key={day.dateStr}
                    className="min-h-[90px] rounded-2xl border p-2 flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: day.isToday ? '#FFF8ED' : '#FFFCF7',
                      borderColor: day.isToday ? '#7563D9' : '#EAE6E1',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold ${day.isToday ? 'px-1.5 py-0.5 rounded-md text-white' : ''}`}
                        style={{
                          color: day.isToday ? '#fff' : '#303653',
                          backgroundColor: day.isToday ? '#7563D9' : 'transparent',
                        }}
                      >
                        {day.dayNum}
                      </span>
                      {day.dayBlocks.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E9E3FF] text-[#7563D9]">
                          {day.dayBlocks.length}
                        </span>
                      )}
                    </div>

                    {/* Block badges inside date cell */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {day.dayBlocks.slice(0, 2).map((b) => {
                        let badgeBg = '#ECEEF2';
                        let badgeColor = '#85899B';
                        let icon = <Lock className="w-2.5 h-2.5" />;

                        if (b.reason === 'OWNER_UNAVAILABLE') {
                          badgeBg = '#FFE5D6';
                          badgeColor = '#E87575';
                          icon = <UserX className="w-2.5 h-2.5" />;
                        } else if (b.reason === 'MAINTENANCE') {
                          badgeBg = '#FEF3C7';
                          badgeColor = '#D97706';
                          icon = <Wrench className="w-2.5 h-2.5" />;
                        }

                        return (
                          <div
                            key={b.id}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 shadow-2xs"
                            style={{ backgroundColor: badgeBg, color: badgeColor }}
                            title={`${b.item_title} (${b.reason}) [${b.start_date} to ${b.end_date})`}
                          >
                            {icon}
                            <span className="truncate">{b.item_title}</span>
                          </div>
                        );
                      })}
                      {day.dayBlocks.length > 2 && (
                        <span className="text-[9px] font-bold block text-center" style={{ color: '#85899B' }}>
                          +{day.dayBlocks.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold"
          style={{ borderTop: '1px solid #EAE6E1', color: '#85899B' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: '#ECEEF2' }} />
            <span>Booked (Student Rental)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: '#FFE5D6' }} />
            <span>Personal Unavailability</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md" style={{ backgroundColor: '#FEF3C7' }} />
            <span>Item Maintenance</span>
          </div>
        </div>
      </div>

      {/* Active Unavailability Blocks Table */}
      <div
        className="rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
      >
        <h3 className="text-base font-extrabold" style={{ color: '#303653' }}>
          Scheduled Unavailability & Rental Holds ({blocks.length})
        </h3>

        {blocks.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: '#85899B' }}>
            No scheduled blocks or active bookings for your inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: '#EAE6E1', color: '#85899B' }}>
                  <th className="pb-3 font-bold">Item</th>
                  <th className="pb-3 font-bold">Interval [Start, End)</th>
                  <th className="pb-3 font-bold">Reason</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#EAE6E1' }}>
                {blocks.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FFF8ED] transition-colors">
                    <td className="py-3 font-bold flex items-center gap-2" style={{ color: '#303653' }}>
                      {b.item_thumbnail ? (
                        <img src={b.item_thumbnail} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#E9E3FF] flex items-center justify-center font-bold text-[#7563D9]">
                          #
                        </div>
                      )}
                      <span>{b.item_title}</span>
                    </td>
                    <td className="py-3 font-medium" style={{ color: '#303653' }}>
                      {b.start_date} → {b.end_date}
                    </td>
                    <td className="py-3 font-bold">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          backgroundColor:
                            b.reason === 'BOOKED' ? '#ECEEF2' : b.reason === 'OWNER_UNAVAILABLE' ? '#FFE5D6' : '#FEF3C7',
                          color:
                            b.reason === 'BOOKED' ? '#85899B' : b.reason === 'OWNER_UNAVAILABLE' ? '#E87575' : '#D97706',
                        }}
                      >
                        {b.reason}
                      </span>
                    </td>
                    <td className="py-3 text-[11px]" style={{ color: '#85899B' }}>
                      {b.reason === 'BOOKED' ? 'Renter Booking (Read-only)' : 'Owner Manual Block'}
                    </td>
                    <td className="py-3 text-right">
                      {b.reason !== 'BOOKED' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(b)}
                          className="p-1.5 rounded-lg border text-[#E87575] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          style={{ borderColor: '#FCA5A5' }}
                          title="Delete manual block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#85899B]">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Manual Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#303653]/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1' }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #EAE6E1' }}>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#7563D9]" />
                <h3 className="font-extrabold text-base text-[#303653]">Block Item Availability</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer hover:bg-[#FFF8ED]"
                style={{ borderColor: '#EAE6E1', color: '#85899B' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                className="p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold"
                style={{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#DC2626' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-[#303653]">Target Resource</label>
                <select
                  value={modalItemId}
                  onChange={(e) => setModalItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-[#303653]">Reason for Unavailability</label>
                <select
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden"
                  style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                >
                  <option value="OWNER_UNAVAILABLE">Personal Use / Exam Week</option>
                  <option value="MAINTENANCE">Equipment Maintenance / Servicing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#303653]">Start Date (Inclusive)</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden"
                    style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-[#303653]">End Date (Exclusive)</label>
                  <input
                    type="date"
                    min={modalStartDate || todayStr}
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-hidden"
                    style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#303653' }}
                  />
                </div>
              </div>

              <div
                className="p-3 rounded-xl border text-[11px] space-y-1"
                style={{ backgroundColor: '#FFF8ED', borderColor: '#EAE6E1', color: '#85899B' }}
              >
                <span>
                  <strong>Note:</strong> End date is exclusive under half-open intervals [start, end). The item will
                  become available again on the end date morning.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                  style={{ borderColor: '#EAE6E1', color: '#85899B' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBlockMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                  style={{ backgroundColor: '#7563D9' }}
                >
                  {createBlockMutation.isPending ? 'Saving...' : 'Confirm Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
