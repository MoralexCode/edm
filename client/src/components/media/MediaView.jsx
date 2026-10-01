/**
 * Muestra un medio { tipo: 'emoji' | 'imagen', valor }.
 * Las imágenes (incl. SVG) siempre van en <img>: nunca se inyecta SVG al DOM.
 */
const MediaView = ({ media, alt = '', emojiSize = '3rem', className = '', imgClassName = '' }) => {
  if (!media?.valor) return null;
  if (media.tipo === 'emoji') {
    return (
      <span
        className={`select-none leading-none ${className}`}
        style={{
          fontSize: emojiSize,
          fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Android Emoji', sans-serif",
        }}
        role="img"
        aria-label={alt || media.valor}
      >
        {media.valor}
      </span>
    );
  }
  return (
    <img
      src={media.valor}
      alt={alt}
      loading="lazy"
      draggable={false}
      className={`h-full w-full object-cover ${imgClassName} ${className}`}
    />
  );
};

export default MediaView;
