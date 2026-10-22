'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { uploadPostImage, createPost, updatePost } from '@/app/apis/postApi';
import { getApiErrorMessage } from '@/app/utils/apiError';

const DEFAULT_THUMBNAIL_URL =
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1350&q=80';

export interface InlinePostImage {
  file: File;
  base64Url: string;
}

interface SavePostVariables {
  title: string;
  content: string;
  categoryId: string;
  thumbnailUrl?: string;
  thumbnailFile?: File | null;
  inlineImages: InlinePostImage[];
  isEditing: boolean;
  editingPostId?: string;
}

export function useSavePost({ onSuccess }: { onSuccess?: () => void } = {}) {
  const t = useTranslations('Posts.save');

  return useMutation({
    mutationFn: async ({
      title,
      content,
      categoryId,
      thumbnailUrl,
      thumbnailFile,
      inlineImages,
      isEditing,
      editingPostId,
    }: SavePostVariables) => {
      let finalContent = content;

      const imagesToUpload = inlineImages.filter((img) => finalContent.includes(img.base64Url));

      if (imagesToUpload.length > 0) {
        toast.info(t('uploadingImages', { count: imagesToUpload.length }), { autoClose: 2000 });
        for (const img of imagesToUpload) {
          const imgFormData = new FormData();
          imgFormData.append('image', img.file);

          try {
            const data = await uploadPostImage(imgFormData);
            const cloudUrl = data.url;
            finalContent = finalContent.split(img.base64Url).join(cloudUrl);
          } catch {
            toast.error(t('uploadImageError', { name: img.file.name }));
          }
        }
      }

      const postData = {
        title,
        content: finalContent,
        thumbnailUrl: thumbnailUrl || DEFAULT_THUMBNAIL_URL,
        categoryIds: [categoryId],
      };

      const formData = new FormData();
      formData.append('post', JSON.stringify(postData));

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (isEditing) {
        await updatePost(editingPostId as string, formData);
        toast.success(t('updated'));
      } else {
        await createPost(formData);
        toast.success(t('created'));
      }
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
    onError: (err, variables) => {
      toast.error(
        getApiErrorMessage(err, variables.isEditing ? t('updateError') : t('createError')),
      );
    },
  });
}
