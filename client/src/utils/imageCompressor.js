const DEFAULT_MAX_SIDE = 1600;
const TARGET_WEBP_QUALITY = 0.82;

const createImageBitmapSafe = async (file) => {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen.'));
    };
    image.src = objectUrl;
  });
};

const getScaledSize = (width, height, maxSide) => {
  const largestSide = Math.max(width, height);
  if (largestSide <= maxSide) {
    return { width, height };
  }

  const ratio = maxSide / largestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};

const blobFromCanvas = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar la imagen comprimida.'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });

/**
 * @param {File} file
 * @param {{ maxSide?: number }} [options]
 */
export const compressImage = async (file, options = {}) => {
  const maxSide =
    Number.isFinite(options.maxSide) && options.maxSide >= 320
      ? Math.min(options.maxSide, 4096)
      : DEFAULT_MAX_SIDE;

  if (!file.type.startsWith('image/')) {
    return file;
  }

  const source = await createImageBitmapSafe(file);
  const { width, height } = getScaledSize(source.width, source.height, maxSide);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { alpha: true });
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  let mimeType = 'image/webp';
  let blob;

  try {
    blob = await blobFromCanvas(canvas, mimeType, TARGET_WEBP_QUALITY);
  } catch {
    const keepsTransparency = file.type === 'image/png' || file.type === 'image/webp';
    mimeType = keepsTransparency ? 'image/png' : 'image/jpeg';
    blob = await blobFromCanvas(canvas, mimeType, 0.85);
  }

  const extension =
    mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
  const nameWithoutExtension = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${nameWithoutExtension}.${extension}`, {
    type: mimeType,
  });
};
