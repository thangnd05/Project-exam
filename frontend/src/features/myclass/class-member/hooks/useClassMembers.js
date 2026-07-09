import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getClassById } from '~/shared/api/classApi';
import {
  getMembersByClass,
  getPendingByClass,
  approveMember,
  approveAllMembers,
  removeMember,
} from '~/features/myclass/api/classMemberApi';

export const classMemberKeys = {
  info: (classId) => ['class-info', classId],
  members: (classId) => ['class-members', classId],
  pending: (classId) => ['class-pending', classId],
};

const normalizeList = (data) => (Array.isArray(data) ? data : data?.content ?? []);

export function useClassMembers(classId) {
  const qc = useQueryClient();

  const infoQuery = useQuery({
    queryKey: classMemberKeys.info(classId),
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  const membersQuery = useQuery({
    queryKey: classMemberKeys.members(classId),
    queryFn: () => getMembersByClass(classId),
    enabled: !!classId,
    select: normalizeList,
  });

  const pendingQuery = useQuery({
    queryKey: classMemberKeys.pending(classId),
    queryFn: () => getPendingByClass(classId),
    enabled: !!classId,
    select: normalizeList,
  });

  useEffect(() => {
    if (infoQuery.isError) {
      console.error('Lỗi khi lấy thông tin lớp học:', infoQuery.error);
      toast.error('Không thể tải thông tin lớp học');
    }
  }, [infoQuery.isError, infoQuery.error]);

  useEffect(() => {
    if (membersQuery.isError) {
      console.error('Lỗi khi lấy danh sách thành viên:', membersQuery.error);
      toast.error('Không thể tải danh sách thành viên');
    }
  }, [membersQuery.isError, membersQuery.error]);

  useEffect(() => {
    if (pendingQuery.isError) {
      console.error('Lỗi khi lấy danh sách chờ duyệt:', pendingQuery.error);
    }
  }, [pendingQuery.isError, pendingQuery.error]);

  const invalidateMembers = () => {
    qc.invalidateQueries({ queryKey: classMemberKeys.members(classId) });
    qc.invalidateQueries({ queryKey: classMemberKeys.pending(classId) });
  };

  const refreshMembers = () =>
    Promise.all([membersQuery.refetch(), pendingQuery.refetch()]);

  const approveMemberMutation = useMutation({
    mutationFn: approveMember,
    onSuccess: invalidateMembers,
  });

  const approveAllMutation = useMutation({
    mutationFn: approveAllMembers,
    onSuccess: invalidateMembers,
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: invalidateMembers,
  });

  return {
    classInfo: infoQuery.data ?? null,
    allMembers: membersQuery.data ?? [],
    pendingMembers: pendingQuery.data ?? [],
    isLoading: infoQuery.isLoading || membersQuery.isLoading || pendingQuery.isLoading,
    actionLoading:
      approveMemberMutation.isPending ||
      approveAllMutation.isPending ||
      removeMemberMutation.isPending,
    approveMemberMutation,
    approveAllMutation,
    removeMemberMutation,
    refreshMembers,
  };
}
