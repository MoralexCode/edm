import api from './api';
import { compressImage } from '../utils/imageCompressor';

/** Comprime (salvo SVG/GIF) y sube a Cloudflare R2. Devuelve la URL pública. */
export const uploadImagen = async (file) => {
  const keepAsIs = ['image/svg+xml', 'image/gif'].includes(file.type);
  const toUpload = keepAsIs ? file : await compressImage(file, { maxSide: 1200 });
  const formData = new FormData();
  formData.append('image', toUpload);
  const { data } = await api.post('/uploads/imagen', formData, {
    headers: { 'Content-Type': undefined },
    timeout: 2 * 60 * 1000,
  });
  return data.url;
};
