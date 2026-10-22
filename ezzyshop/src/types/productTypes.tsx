export interface ProductCategory {
  id: string;
  name: string;
}

export interface MainBuyBox {
  ships_from?: string;
  seller?: string;
  seller_id?: string;
  seller_link?: string;
}

export interface ProductDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProductInformation {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProductVariationItem {
  asin?: string;
  value?: string;
  photo?: string;
  image?: string;
  [key: string]: unknown;
}

export interface ProductVariations {
  color?: ProductVariationItem[];
  size?: ProductVariationItem[];
  style?: ProductVariationItem[];
  [key: string]: ProductVariationItem[] | undefined;
}

export interface AllProductVariation {
  asin?: string;
  product_title?: string;
  product_photo?: string;
  product_price?: string;
  product_original_price?: string | null;
  [key: string]: unknown;
}

export interface ProductVideo {
  title?: string;
  url?: string;
  video_url?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  [key: string]: unknown;
}

export interface ProductReview {
  review_id?: string;
  review_title?: string;
  review_comment?: string;
  review_star_rating?: string | number;
  user_name?: string;
  user_profile?: string;
  review_date?: string;
  verified_purchase?: boolean;
  helpful_vote_statement?: string;
  [key: string]: unknown;
}

export interface RatingDistribution {
  [rating: string]: number;
}

export interface Product {
  asin: string;
  product_title: string;
  product_photo: string;
  product_photos: string[];
  product_star_rating: string;
  product_price: string;
  product_original_price: string | null;
  product_url: string;

  about_product?: string[];
  product_description?: string | null;
  product_item_highlight?: string | null;

  product_details?: ProductDetails;
  product_information?: ProductInformation;

  parent_asin?: string;
  landing_asin?: string;
  product_slug?: string;

  product_byline?: string;
  product_byline_link?: string;
  product_byline_links?: string[];

  category?: ProductCategory;
  category_path?: unknown[];

  currency?: string;
  deal_badge?: string | null;

  product_num_ratings?: number;
  rating_distribution?: RatingDistribution;

  product_availability?: string;
  product_condition?: string;
  product_num_offers?: number;
  minimum_order_quantity?: number | null;

  sales_volume?: string;

  delivery?: string;
  delivery_price?: string;
  delivery_time?: string;
  primary_delivery_time?: string;

  is_prime?: boolean;
  is_amazon_choice?: boolean;
  is_best_seller?: boolean;
  climate_pledge_friendly?: boolean;

  main_buy_box?: MainBuyBox | null;
  buy_boxes?: MainBuyBox[];

  product_variations?: ProductVariations;
  product_variations_dimensions?: string[];
  all_product_variations?: Record<string, AllProductVariation>;

  has_aplus?: boolean;
  aplus_text?: string | null;
  aplus_images?: string[];
  has_brandstory?: boolean;

  has_video?: boolean;
  product_videos?: ProductVideo[];
  user_uploaded_videos?: ProductVideo[];
  video_thumbnail?: string;

  top_reviews?: ProductReview[];
  top_reviews_global?: ProductReview[];

  frequently_bought_together?: Product[];

  country?: string;
  domain?: string;
}
