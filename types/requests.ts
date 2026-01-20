// Request Model
export interface ProductFilterRequest {
  brandId: number | null;
  categoryId: number | null;
  searchKeyword: string;
  languageId: number; // Frontend'den 1 (TR), 2 (EN) gibi gelecek
}

export interface CategoryFilterRequest {
  languageId: number;
  searchKeyword?: string | null;
}