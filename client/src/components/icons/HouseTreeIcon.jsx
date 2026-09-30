/**
 * Reemplazo del emoji 🏡 para títulos con gradiente (background-clip: text
 * aplana el emoji nativo a una silueta sin detalle). Casa y árbol como
 * formas separadas, cada una con su propio trazo, para que la casa "corte"
 * una línea visible donde se monta sobre el árbol.
 */
const HouseTreeIcon = ({ size = '1em', className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block align-[-0.12em] ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="houseTreeIconGradient" x1="4" y1="10" x2="58" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--accent-strong)" />
        <stop offset="100%" stopColor="#5eead4" />
      </linearGradient>
    </defs>

    <g stroke="var(--bg-main)" strokeWidth="2.5" strokeLinejoin="round">
      <circle cx="8" cy="34" r="8" fill="url(#houseTreeIconGradient)" />
      <circle cx="22" cy="34" r="8" fill="url(#houseTreeIconGradient)" />
      <circle cx="15" cy="27" r="11" fill="url(#houseTreeIconGradient)" />
      <rect x="12" y="40" width="6" height="16" rx="1.5" fill="url(#houseTreeIconGradient)" />
    </g>

    <g stroke="var(--bg-main)" strokeWidth="2.5" strokeLinejoin="round">
      <polygon points="22,32 40,13 58,32" fill="url(#houseTreeIconGradient)" />
      <rect x="26" y="31" width="28" height="25" rx="2" fill="url(#houseTreeIconGradient)" />
    </g>

    <rect x="36" y="42" width="8" height="14" rx="1" fill="var(--bg-main)" />
  </svg>
);

export default HouseTreeIcon;
