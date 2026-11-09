import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookingService,
  CreateBookingPayload,
  BookingsListResponse,
  BookingDetail
} from '../services/bookingService';
import { AVAILABILITY_KEYS } from './useAvailability';

export const BOOKING_KEYS = {
  all: ['bookings'] as const,
  rentals: (params?: Record<string, string | undefined>) =>
    [...BOOKING_KEYS.all, 'rentals', params] as const,
  incomingRequests: (params?: Record<string, string | undefined>) =>
    [...BOOKING_KEYS.all, 'incomingRequests', params] as const,
  detail: (bookingId: string) =>
    [...BOOKING_KEYS.all, 'detail', bookingId] as const,
};

export const useMyRentals = (params?: { status?: string; search?: string }) => {
  return useQuery<BookingsListResponse, Error>({
    queryKey: BOOKING_KEYS.rentals(params),
    queryFn: () => bookingService.getMyRentals(params),
    staleTime: 1000 * 30, // 30s
  });
};

export const useMyIncomingRequests = (params?: { status?: string; search?: string }) => {
  return useQuery<BookingsListResponse, Error>({
    queryKey: BOOKING_KEYS.incomingRequests(params),
    queryFn: () => bookingService.getMyIncomingRequests(params),
    staleTime: 1000 * 30,
  });
};

export const useBookingDetail = (bookingId?: string) => {
  return useQuery<BookingDetail, Error>({
    queryKey: BOOKING_KEYS.detail(bookingId || ''),
    queryFn: () => bookingService.getBookingDetail(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 1000 * 30,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingService.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.rentals() });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useAcceptBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.acceptBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useRejectBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingService.rejectBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      bookingService.cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useInitiatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.initiatePayment(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useConfirmCashPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.confirmCashPayment(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useConfirmHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, passCode }: { bookingId: string; passCode: string }) =>
      bookingService.confirmHandover(bookingId, passCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useInitiateReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes?: string }) =>
      bookingService.initiateReturn(bookingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
  });
};

export const useCompleteInspection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: { passed: boolean; notes?: string } }) =>
      bookingService.completeInspection(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

// ==============================================================================
// PHASE 08: Handover & Return Pass Hooks
// ==============================================================================

export const useHandoverPass = (bookingId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['booking-handover-pass', bookingId],
    queryFn: () => bookingService.getHandoverPass(bookingId!),
    enabled: Boolean(bookingId) && enabled,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll to refresh countdown if needed
  });
};

export const useRegenerateHandoverPass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.regenerateHandoverPass(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['booking-handover-pass', bookingId] });
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
  });
};

export const useVerifyPickup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: import('../services/bookingService').VerifyPickupPayload;
    }) => bookingService.verifyPickup(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useVerifyReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: import('../services/bookingService').VerifyReturnPayload;
    }) => bookingService.verifyReturn(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useUploadEvidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string;
      payload: { stage: 'PICKUP' | 'RETURN'; image_url: string; caption?: string };
    }) => bookingService.uploadEvidence(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
    },
  });
};

export const useDeleteBookingRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingService.deleteBookingRecord(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};

export const useClearCancelledBookings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => bookingService.clearCancelledBookings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEYS.all });
    },
  });
};
