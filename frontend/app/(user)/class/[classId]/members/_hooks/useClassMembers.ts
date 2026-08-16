'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getClassById } from '@/app/apis/classApi';
import {
  getMembersByClass,
  getPendingByClass,
  approveMember,
  approveAllMembers,
  removeMember,
} from '@/app/apis/classMemberApi';
import type { ClassMemberActionRequest, ClassMemberResponse, MessageResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const classMemberKeys = {
  info: (classId: string) => ['class-info', classId],
  members: (classId: string) => ['class-members', classId],
  pending: (classId: string) => ['class-pending', classId],
};

const normalizeList = (data: ClassMemberResponse[]): ClassMemberResponse[] =>
  (Array.isArray(data) ? data : ((data as any)?.content ?? []));

export function useClassMembers(classId: string) {
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

  const approveMemberMutation = useMutation<MessageResponse, any, ClassMemberActionRequest>({
    mutationFn: approveMember,
    onSuccess: invalidateMembers,
  });

  const approveAllMutation = useMutation<MessageResponse, any, string>({
    mutationFn: approveAllMembers,
    onSuccess: invalidateMembers,
  });

  const removeMemberMutation = useMutation<void, any, ClassMemberActionRequest>({
    mutationFn: removeMember,
    onSuccess: invalidateMembers,
  });

  return {
    classInfo: infoQuery.data ?? null,
    allMembers: membersQuery.data ?? EMPTY_LIST,
    pendingMembers: pendingQuery.data ?? EMPTY_LIST,
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
