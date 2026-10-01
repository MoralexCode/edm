import { Check } from 'lucide-react';
import MediaView from '../media/MediaView';

const letra = (i) => String.fromCharCode(65 + i);

/**
 * Tarjeta grande de opción. El medio (emoji/imagen) ocupa un cuadrado a
 * todo el alto de la tarjeta; sin medio se muestra la letra (A, B, C…).
 * Círculo = selección única · cuadro = selección múltiple.
 */
const OptionCard = ({ opcion, index, multiple, checked, disabled, onSelect }) => (
  <button
    type="button"
    role={multiple ? 'checkbox' : 'radio'}
    aria-checked={checked}
    aria-disabled={disabled || undefined}
    disabled={disabled}
    onClick={onSelect}
    className={`edm-option ${disabled ? 'opacity-50' : ''}`}
  >
    <span className="edm-option-media">
      {opcion.media ? (
        <MediaView media={opcion.media} alt={opcion.texto} emojiSize="2.9rem" />
      ) : (
        <span className="edm-option-letter" aria-hidden>
          {letra(index)}
        </span>
      )}
    </span>
    <span className="flex-1 self-center py-3 text-lg leading-snug font-medium sm:text-xl">
      {opcion.texto}
    </span>
    <span className="edm-check" data-shape={multiple ? 'square' : 'circle'} aria-hidden>
      {checked && <Check size={18} strokeWidth={3.5} />}
    </span>
  </button>
);

export default OptionCard;
