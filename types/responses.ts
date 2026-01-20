export interface LocalizedProductResponse {
  categoryProductId: number;
  price: number;
  categoryName: string;
  productName: string;
  langCode: string;
}

export interface ProductListItem {
  categoryProductId: number;
  productName: string;   // Seçilen dile göre eşleşmiş isim
  categoryName: string;  // Seçilen dile göre kategori adı
  brandName: string;
  price: number;
  ext_id: string;
  imageUrl: string | null;
}