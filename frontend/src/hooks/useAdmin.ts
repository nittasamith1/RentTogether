import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export function useAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isStaff = Boolean(user?.is_staff);

  const useAnalytics = () => {
    return useQuery({
      queryKey: ['admin-platform-analytics'],
      queryFn: () => adminService.getAnalytics(),
      enabled: isStaff,
      staleTime: 0,
      refetchInterval: 15000,
    });
  };

  const useDisputes = (status?: string, search?: string) => {
    return useQuery({
      queryKey: ['admin-disputes', status, search],
      queryFn: () => adminService.getDisputes(status, search),
      enabled: isStaff,
      staleTime: 0,
      refetchInterval: 10000,
    });
  };

  const usePendingVerifications = (status: string = 'PENDING', search?: string) => {
    return useQuery({
      queryKey: ['admin-pending-verifications', status, search],
      queryFn: () => adminService.getPendingVerifications(status, search),
      enabled: isStaff,
      staleTime: 0,
      refetchInterval: 10000,
    });
  };

  const useFraudAlerts = () => {
    return useQuery({
      queryKey: ['admin-fraud-alerts'],
      queryFn: () => adminService.getFraudAlerts(),
      enabled: isStaff,
      staleTime: 0,
      refetchInterval: 10000,
    });
  };

  const resolveDisputeMutation = useMutation({
    mutationFn: ({
      id,
      decision,
      notes,
      refundAmount,
    }: {
      id: string;
      decision: 'FULL_REFUND_RENTER' | 'FORFEIT_DEPOSIT_TO_OWNER' | 'SPLIT';
      notes: string;
      refundAmount?: number;
    }) =>
      adminService.resolveDispute(id, {
        resolution_decision: decision,
        admin_notes: notes,
        refund_amount: refundAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-analytics'] });
    },
  });

  const verifyStudentMutation = useMutation({
    mutationFn: ({
      id,
      action,
      rejectionReason,
    }: {
      id: string;
      action: 'APPROVE' | 'REJECT';
      rejectionReason?: string;
    }) => adminService.verifyStudent(id, action, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-analytics'] });
    },
  });

  const reviewFraudAlertMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: 'DISMISSED' | 'ACTION_TAKEN';
      notes: string;
    }) => adminService.reviewFraudAlert(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-analytics'] });
    },
  });

  return {
    isStaff,
    useAnalytics,
    useDisputes,
    usePendingVerifications,
    useFraudAlerts,
    resolveDispute: resolveDisputeMutation.mutateAsync,
    isResolvingDispute: resolveDisputeMutation.isPending,
    verifyStudent: verifyStudentMutation.mutateAsync,
    isVerifyingStudent: verifyStudentMutation.isPending,
    reviewFraudAlert: reviewFraudAlertMutation.mutateAsync,
    isReviewingFraudAlert: reviewFraudAlertMutation.isPending,
  };
}
