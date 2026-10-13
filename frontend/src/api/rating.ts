import { postRequest } from './request';
import { reating_create } from './apiUrls';

export interface RatingRequest {
  service: number;
  value: number; // 1-5 orasida
  comment: string;
}

export interface RatingResponse {
  id: number;
  service: number;
  value: number;
  comment: string;
  created_at: string;
}

export const createRating = async (data: RatingRequest): Promise<RatingResponse> => {
  const response = await postRequest(reating_create, data);
  return response as RatingResponse;
};