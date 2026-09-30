import QRCode from 'qrcode';
import { PUBLIC_BASE_URL } from '../app/constants';

export const examenPublicPath = (examen) => `/${examen.libro_slug}/${examen.sesion}`;

export const examenPublicUrl = (examen) => `${PUBLIC_BASE_URL}${examenPublicPath(examen)}`;

export const downloadExamenQr = async (examen) => {
  const url = examenPublicUrl(examen);
  const filename = `qr-${examen.libro_slug}-sesion-${examen.sesion}.png`;

  const dataUrl = await QRCode.toDataURL(url, {
    width: 2048,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};
