import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Smile, X } from 'lucide-react';
import toast from '../toast/toast';
import { toastApiError } from '../../utils/toastApiError';
import { uploadImagen } from '../../services/uploads';
import MediaView from './MediaView';

const TABS = [
  { value: null, label: 'Ninguno' },
  { value: 'emoji', label: 'Emoji', icon: Smile },
  { value: 'imagen', label: 'Imagen', icon: ImagePlus },
];

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';

/**
 * Selector de medio para preguntas, opciones o portada.
 * value: { tipo: 'emoji' | 'imagen', valor } | null
 * `tipos` limita las opciones (ej. ['imagen'] para la portada).
 */
const MediaPicker = ({ value, onChange, tipos = ['emoji', 'imagen'], compact = false, label }) => {
  const [tipo, setTipo] = useState(value?.tipo || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const tabs = TABS.filter((t) => t.value === null || tipos.includes(t.value));

  const selectTipo = (next) => {
    setTipo(next);
    if (next !== value?.tipo) onChange(null);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('La imagen pesa más de 10 MB');
    setUploading(true);
    try {
      const url = await uploadImagen(file);
      onChange({ tipo: 'imagen', valor: url });
    } catch (err) {
      toastApiError(toast, err, 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const previewSize = compact ? 'h-14 w-14' : 'h-20 w-20';

  return (
    <div className="space-y-2">
      {label && <p className="c-label">{label}</p>}
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tipo === t.value;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => selectTipo(t.value)}
              className={`c-chip min-h-9 cursor-pointer gap-1 ${active ? 'font-bold' : ''}`}
              data-accent={active ? 'true' : undefined}
              aria-pressed={active}
            >
              {Icon && <Icon size={14} />} {t.label}
            </button>
          );
        })}
      </div>

      {tipo === 'emoji' && (
        <div className="flex items-center gap-3">
          <span
            className={`flex ${previewSize} shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-container)]`}
          >
            {value?.valor ? (
              <MediaView media={value} emojiSize={compact ? '2rem' : '2.75rem'} />
            ) : (
              <Smile size={22} className="text-[var(--text-secondary)]" />
            )}
          </span>
          <input
            className="c-input min-w-0 flex-1 text-xl"
            value={value?.tipo === 'emoji' ? value.valor : ''}
            maxLength={16}
            onChange={(e) => {
              const v = e.target.value.trim();
              onChange(v ? { tipo: 'emoji', valor: v } : null);
            }}
            placeholder="Pega un emoji 💼"
            aria-label="Emoji"
          />
        </div>
      )}

      {tipo === 'imagen' && (
        <div className="flex items-center gap-3">
          <span
            className={`flex ${previewSize} shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-container)]`}
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-[var(--text-secondary)]" />
            ) : value?.tipo === 'imagen' ? (
              <MediaView media={value} imgClassName="object-contain" />
            ) : (
              <ImagePlus size={22} className="text-[var(--text-secondary)]" />
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={16} /> {value?.tipo === 'imagen' ? 'Cambiar' : 'Subir imagen'}
            </button>
            {value?.tipo === 'imagen' && (
              <button
                type="button"
                className="c-btn-circle"
                aria-label="Quitar imagen"
                onClick={() => onChange(null)}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}
    </div>
  );
};

export default MediaPicker;
