import api from './api';

const API_BASE_URL = import.meta.env.VITE_SUBSCRIPTIONS_API_URL + '/api';

export interface FileUploadResponse {
  fileId: string;
  presignedUrl: string;
  message: string;
}

export const fileService = {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${API_BASE_URL}/Files/Upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as FileUploadResponse;
  },

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`${API_BASE_URL}/Files/${fileId}`);
  },

  async getFileUrl(fileId: string): Promise<string> {
    const response = await api.get(`${API_BASE_URL}/Files/${fileId}/url`);
    return (response.data as { url: string }).url;
  },
};
