export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  updatedAt: string;
  readingTime?: number;
  author?: { name: string | null } | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  createdAt: string;
  readingTime: number;
}

export interface BlogListResponse {
  success: boolean;
  data: BlogPostSummary[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface BlogDetailResponse {
  success: boolean;
  data: BlogPostDetail;
  related: BlogPostSummary[];
}
