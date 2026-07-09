import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { uploadPostImage, createPost, updatePost } from '~/api/postApi';

const DEFAULT_THUMBNAIL_URL =
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1350&q=80';

export function useSavePost({ onSuccess } = {}) {
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
    }) => {
      let finalContent = content;

      const imagesToUpload = inlineImages.filter((img) => finalContent.includes(img.base64Url));

      if (imagesToUpload.length > 0) {
        toast.info(`Đang tải lên ${imagesToUpload.length} ảnh trong nội dung...`, { autoClose: 2000 });
        for (const img of imagesToUpload) {
          const imgFormData = new FormData();
          imgFormData.append('image', img.file);

          try {
            const data = await uploadPostImage(imgFormData);
            const cloudUrl = data.url;
            finalContent = finalContent.split(img.base64Url).join(cloudUrl);
          } catch (error) {
            toast.error(` Lỗi tải ảnh ${img.file.name} lên Cloudinary!`);
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
        await updatePost(editingPostId, formData);
        toast.success('Cập nhật bài viết thành công!');
      } else {
        await createPost(formData);
        toast.success('Đăng bài viết thành công!');
      }
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
    onError: (err, variables) => {
      toast.error(
        err.response?.data?.message || (variables.isEditing ? 'Lỗi khi cập nhật bài viết!' : 'Lỗi khi đăng bài viết!'),
      );
    },
  });
}
