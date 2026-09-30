export const APP_NAME = 'EDM';
export const APP_TAGLINE = 'Ejercicios de reafirmación.';

export const APP_ROUTES = {
  examenes: '/admin/examenes',
  examenDetalle: '/admin/examenes/:id',
  examenResponder: '/:libro/:sesion',
};

export const NAV_ITEMS = [{ label: 'Exámenes', to: APP_ROUTES.examenes, icon: 'examenes' }];

// Barra inferior (mobile first): accesos más frecuentes.
export const BOTTOM_NAV_ITEMS = [{ label: 'Exámenes', to: APP_ROUTES.examenes, icon: 'examenes' }];

// URL pública base para los QR: https://edm.moralexcode.com/{libro}/{sesion}
export const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL || 'https://edm.moralexcode.com').replace(
  /\/+$/,
  ''
);

export const LOGO_NEGRO =
  import.meta.env.VITE_LOGO_NEGRO ||
  'https://comunidad.moralexcode.com/uploads/banners/logo-comunidad-oficial-negro.png';
export const LOGO_BLANCO =
  import.meta.env.VITE_LOGO_BLANCO ||
  'https://comunidad.moralexcode.com/uploads/banners/logo-comunidad-oficial-blanco.png';

export const THEME_STORAGE_KEY = 'edm-theme';

export const THEME_MODES = {
  light: 'light',
  dark: 'dark',
};
