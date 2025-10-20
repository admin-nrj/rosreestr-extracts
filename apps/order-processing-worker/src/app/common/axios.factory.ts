import axios, { AxiosInstance } from 'axios';
import https from 'https';

/**
 * Creates a new Axios instance with disabled SSL verification for Rosreestr API
 * Each service should create its own instance
 * @returns AxiosInstance configured for Rosreestr API
 */
export function createAxiosInstance(): AxiosInstance {
  return axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });
}
