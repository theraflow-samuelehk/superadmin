export type LeadStatus = string;

export interface Lead {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  phone: string;
  website: string;
  has_website: string;
  rating: string;
  total_reviews: string;
  negative_reviews: string;
  worst_review_text: string;
  worst_review_rating: string;
  worst_review_author: string;
  google_maps_url: string;
  google_place_id: string;
  oldest_review_date: string;
  business_types: string;
  photos_count: string;
  price_level: string;
  business_status: string;
  category: string;
  city: string;
  province: string;
  region: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
