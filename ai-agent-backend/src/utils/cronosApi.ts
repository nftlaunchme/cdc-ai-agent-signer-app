// src/utils/cronosApi.ts

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CRONOS_API_URL = process.env.CRONOS_API_URL || 'https://cronos.org/explorer/api';

if (!CRONOS_API_URL) {
  throw new Error('CRONOS_API_URL is not defined in environment variables.');
}

const cronosApi = axios.create({
  baseURL: CRONOS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Makes a GET request to the Cronos API with given parameters.
 * @param params Query parameters for the API call.
 */
export const getCronosData = async (params: Record<string, string | number | boolean>) => {
  try {
    const response = await cronosApi.get('', { params });
    return response.data;
  } catch (error: any) {
    console.error('Cronos API GET Error:', error.message);
    throw error;
  }
};

/**
 * Makes a POST request to the Cronos API with given parameters.
 * @param params Query parameters for the API call.
 */
export const postCronosData = async (params: Record<string, string | number | boolean>, data?: any) => {
  try {
    const response = await cronosApi.post('', data, { params });
    return response.data;
  } catch (error: any) {
    console.error('Cronos API POST Error:', error.message);
    throw error;
  }
};
