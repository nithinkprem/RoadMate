export type UserRole = 'customer' | 'admin' | 'worker';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export type ShopCategory =
  'tyre' | 'battery' | 'mechanic' | 'fuel' | 'towing' | 'car_wash' | 'air_filling';

export interface HoursInterval {
  open: string; // e.g. "09:00"
  close: string; // e.g. "18:00"
}

export interface WeeklyHours {
  monday?: HoursInterval[];
  tuesday?: HoursInterval[];
  wednesday?: HoursInterval[];
  thursday?: HoursInterval[];
  friday?: HoursInterval[];
  saturday?: HoursInterval[];
  sunday?: HoursInterval[];
}

export interface HoursJson {
  regular: WeeklyHours;
  holidays?: Record<string, HoursInterval[] | null>; // Date strings "YYYY-MM-DD"
}

export interface Shop {
  id: string;
  name: string;
  owner_name?: string;
  phone: string;
  category: ShopCategory;
  latitude: number;
  longitude: number;
  address: string;
  hours_json: HoursJson;
  price_range?: string; // e.g. "₹150–300"
  supports_upi: boolean;
  mobile_mechanic: boolean;
  night_service: boolean;
  languages: string[];
  source: 'google_maps' | 'manual' | 'worker_registered';
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopPhoto {
  id: string;
  shop_id: string;
  url: string;
  sort_order: number;
}

export interface Review {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number; // 1 to 5
  text?: string;
  flagged: boolean;
  created_at: string;
  user?: {
    name: string;
  };
}

export interface SearchLog {
  id: string;
  user_id?: string;
  issue_type: ShopCategory;
  latitude: number;
  longitude: number;
  result_count: number;
  created_at: string;
}
