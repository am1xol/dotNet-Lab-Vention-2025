import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setTokens = (tokens: any) => {
  console.log('setTokens will be implemented later', tokens);
};

export const clearTokens = () => {
  console.log('clearTokens will be implemented later');
};

export const getAccessToken = () => {
  console.log('getAccessToken will be implemented later');
  return null;
};