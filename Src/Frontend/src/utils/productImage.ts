// utils/productImage.ts
// Dùng chung cho WatchCategories và POSPage

const productImageModules = import.meta.glob('../assets/img_products/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
});

function normalizeKeyword(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const productImageList = Object.entries(productImageModules).map(([path, src]) => {
  const fileName = path.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
  return {
    src: String(src || ''),
    normalizedName: normalizeKeyword(fileName),
  };
});

/**
 * Trả về URL ảnh cho sản phẩm.
 * Chỉ match chính xác theo tên file trong DB (HINHANH).
 * Không fuzzy match — tránh nhiều sản phẩm cùng thương hiệu bị lấy nhầm ảnh.
 *
 * @param image   giá trị HINHANH từ DB (vd: 'casio_f91w.png')
 */
export function getProductImageSrc(image: string, name?: string, brand?: string): string {
  const explicitImage = String(image || '').trim();
  if (!explicitImage) return '';

  // URL tuyệt đối / data / blob → dùng thẳng
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(explicitImage)) {
    return explicitImage;
  }

  // Match chính xác theo tên file (bỏ extension, normalize)
  const normalizedExplicit = normalizeKeyword(explicitImage.replace(/\.[^.]+$/, ''));
  const matched = productImageList.find((img) => img.normalizedName === normalizedExplicit);
  return matched ? matched.src : '';
}