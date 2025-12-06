import api from './api';

const SUBSCRIPTION_API_URL = import.meta.env.VITE_SUBSCRIPTION_API_URL;
if (!SUBSCRIPTION_API_URL) {
  throw new Error('VITE_SUBSCRIPTION_API_URL is not defined');
}

export interface FileUploadResponse {
  fileId: string;
  presignedUrl: string;
  message: string;
}

export const fileService = {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${SUBSCRIPTION_API_URL}/Files/Upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as FileUploadResponse;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`${SUBSCRIPTION_API_URL}/Files/${fileId}`);
  },

  async getFileUrl(fileId: string): Promise<string> {
    const response = await api.get(`${SUBSCRIPTION_API_URL}/Files/${fileId}/url`);
    return (response.data as { url: string }).url;
  },
};
