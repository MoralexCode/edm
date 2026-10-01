const QUESTION_RE = /^(\d+)\s*\.?-?\s*[.)-]?\s*(.+)$/;
const OPTION_START_RE = /^\*?[A-Ha-h]\)/;
const OPTION_SPLIT_RE = /((?:^|\s)\*?[A-Ha-h]\))/g;

const tmpId = () => `tmp-${crypto.randomUUID()}`;

// Emoji al inicio de una opción ("💼 Tengo empleo") → media emoji.
const LEADING_EMOJI_RE = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D|\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator})*)\s*/u;

const extractEmoji = (texto) => {
  const m = texto.match(LEADING_EMOJI_RE);
  if (!m) return { texto, media: null };
  return { texto: texto.slice(m[0].length).trim(), media: { tipo: 'emoji', valor: m[1] } };
};

export const RAW_PLACEHOLDER_TEXT = `Pega aquí tus preguntas (formato de los PDF de ejercicios).
Marca la respuesta correcta con un asterisco *:

1.- ¿Quién es el único camino para poder llegar al Padre?
A) La iglesia. B) Los pastores. *C) Jesucristo.

Puedes poner un emoji al inicio de cada opción:
3.- ¿Cuál es tu situación actual?
A) 💼 Tengo empleo *B) 🔍 Busco oportunidad C) 📈 Soy autónomo

2.- Él es la escalera que une el cielo con la Tierra.
*A) Jesucristo.
B) Los ángeles.
C) Los querubines.

Si una pregunta tiene varias correctas, márcalas todas y se vuelve de selección múltiple.
El título, libro y sesión del examen se llenan aparte, arriba — este cuadro es solo para las preguntas.`;

const splitOpciones = (line) => {
  const parts = line.split(OPTION_SPLIT_RE).filter((s) => s.trim() !== '');
  const opciones = [];
  for (let i = 0; i < parts.length; i++) {
    const marker = parts[i];
    if (!/[A-Ha-h]\)$/.test(marker.trim())) continue;
    let texto = (parts[i + 1] || '').trim();
    let correcta = marker.trim().startsWith('*');
    if (texto.endsWith('*')) {
      correcta = true;
      texto = texto.slice(0, -1).trim();
    }
    if (texto.startsWith('*')) {
      correcta = true;
      texto = texto.slice(1).trim();
    }
    i += 1;
    const { texto: limpio, media } = extractEmoji(texto);
    if (limpio) opciones.push({ id: tmpId(), texto: limpio, correcta, media });
  }
  return opciones;
};

/**
 * Convierte texto pegado (preguntas numeradas "1.-" y opciones "A) … B) …",
 * en una línea o en varias) en el arreglo de preguntas del builder.
 * La correcta se marca con "*".
 * @returns {{ preguntas: object[], warnings: {line: number|null, text: string}[] }}
 */
export const parseExamenRawText = (raw) => {
  const lines = String(raw || '').split(/\r?\n/);
  const preguntas = [];
  const warnings = [];
  let current = null;

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    if (current && OPTION_START_RE.test(line)) {
      current.opciones.push(...splitOpciones(line));
      return;
    }

    const qMatch = line.match(QUESTION_RE);
    if (qMatch && !OPTION_START_RE.test(line)) {
      if (current) preguntas.push(current);
      current = { id: tmpId(), texto: qMatch[2].trim(), opciones: [] };
      return;
    }

    if (!current) return;

    if (current.opciones.length === 0) {
      current.texto = `${current.texto} ${line}`;
    } else {
      warnings.push({ line: idx + 1, text: line });
    }
  });

  if (current) preguntas.push(current);

  const resolved = preguntas.map((p, i) => {
    const nCorrectas = p.opciones.filter((o) => o.correcta).length;
    if (p.opciones.length < 2) {
      warnings.push({
        line: null,
        text: `Pregunta ${i + 1} ("${p.texto.slice(0, 40)}"): tiene menos de 2 opciones, revísala.`,
      });
    }
    if (nCorrectas === 0) {
      warnings.push({
        line: null,
        text: `Pregunta ${i + 1} ("${p.texto.slice(0, 40)}"): no tiene respuesta correcta marcada con *.`,
      });
    }
    return {
      id: p.id,
      texto: p.texto,
      tipo: nCorrectas > 1 ? 'multiple' : 'unica',
      media: null,
      requerida: true,
      puntos: 1,
      max_selecciones: '',
      opciones: p.opciones,
    };
  });

  return { preguntas: resolved, warnings };
};
