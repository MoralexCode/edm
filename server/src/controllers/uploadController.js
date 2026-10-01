import multer from 'multer';
import { buildExamenObjectKey, isR2Configured, putObject } from '../services/r2Storage.service.js';

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (MIME_EXT[String(file.mimetype || '').toLowerCase()]) return cb(null, true);
    cb(new Error('Solo se permiten imágenes JPG, PNG, WebP, GIF o SVG'));
  },
});

export const imageUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Archivo demasiado grande (máx. 5 MB)'
          : err.message || 'Error al procesar el archivo';
      return res.status(400).json({ message });
    }
    next();
  });
};

/**
 * POST /uploads/imagen — multipart: image (file)
 * Sube a Cloudflare R2 y devuelve la URL pública.
 */
export const uploadImagen = async (req, res) => {
  if (!isR2Configured()) {
    return res.status(503).json({ message: 'Almacenamiento R2 no configurado (revisa server/.env)' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Se requiere una imagen (campo image)' });
  }

  const mime = String(req.file.mimetype).toLowerCase();
  const key = buildExamenObjectKey({ extension: MIME_EXT[mime] });
  const uploaded = await putObject({ body: req.file.buffer, key, contentType: mime });
  res.status(201).json({ url: uploaded.url, key: uploaded.key });
};
