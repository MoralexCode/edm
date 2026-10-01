import { useState } from 'react';
import toast from '../toast/toast';
import { toastApiError } from '../../utils/toastApiError';
import Modal from '../ui/Modal';
import { Examenes } from '../../services/examenes';
import { PUBLIC_BASE_URL } from '../../app/constants';
import PreguntaBuilder, { emptyPregunta } from './PreguntaBuilder';
import MediaPicker from '../media/MediaPicker';

const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildForm = (examen) => ({
  libro_titulo: examen?.libro_titulo ?? '',
  libro_slug: examen?.libro_slug ?? '',
  sesion: examen?.sesion ?? '',
  titulo: examen?.titulo ?? '',
  subtitulo: examen?.subtitulo ?? '',
  descripcion: examen?.descripcion ?? '',
  imagen_url: examen?.imagen_url ?? '',
  activo: examen?.activo ?? true,
  mostrar_calificacion: examen?.mostrar_calificacion ?? true,
  preguntas: Array.isArray(examen?.preguntas)
    ? examen.preguntas.map((p) => {
        const correctas = new Set(p.correctas || []);
        return {
          ...p,
          puntos: p.puntos ?? 1,
          max_selecciones: p.max_selecciones ?? '',
          opciones: (p.opciones || []).map((o) => ({ ...o, correcta: correctas.has(o.id) })),
        };
      })
    : [emptyPregunta()],
});

const ExamenFormModal = ({ examen, hasRespuestas = false, onClose, onSaved }) => {
  const isEdit = Boolean(examen);
  const [form, setForm] = useState(() => buildForm(examen));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.libro_slug.trim()) return toast.error('El libro es obligatorio');
    if (!Number(form.sesion)) return toast.error('La sesión es obligatoria');
    if (!form.titulo.trim()) return toast.error('El título es obligatorio');

    for (let i = 0; i < form.preguntas.length; i++) {
      const p = form.preguntas[i];
      if (!p.texto.trim()) return toast.error(`La pregunta ${i + 1} necesita texto`);
      const opts = (p.opciones || []).filter((o) => o.texto.trim());
      if (opts.length < 2) return toast.error(`La pregunta ${i + 1} necesita al menos 2 opciones`);
      if (!opts.some((o) => o.correcta)) {
        return toast.error(`Marca la respuesta correcta de la pregunta ${i + 1}`);
      }
    }

    setSaving(true);
    try {
      const preguntas = form.preguntas.map((p) => {
        const out = {
          id: String(p.id || '').startsWith('tmp-') ? undefined : p.id,
          texto: p.texto.trim(),
          media: p.media || null,
          tipo: p.tipo,
          requerida: Boolean(p.requerida),
          puntos: Number(p.puntos) || 1,
          opciones: (p.opciones || [])
            .filter((o) => o.texto.trim())
            .map((o) => ({
              id: String(o.id || '').startsWith('tmp-') ? undefined : o.id,
              texto: o.texto.trim(),
              correcta: Boolean(o.correcta),
              media: o.media || null,
            })),
        };
        if (p.tipo === 'multiple' && p.max_selecciones !== '' && p.max_selecciones != null) {
          out.max_selecciones = Number(p.max_selecciones);
        }
        return out;
      });

      const payload = {
        libro_titulo: form.libro_titulo.trim() || null,
        libro_slug: slugify(form.libro_slug),
        sesion: Number(form.sesion),
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo.trim() || null,
        descripcion: form.descripcion.trim() || null,
        imagen_url: form.imagen_url || null,
        activo: Boolean(form.activo),
        mostrar_calificacion: Boolean(form.mostrar_calificacion),
        // El stepper siempre pide sólo el nombre (mín. 5 letras); el teléfono está oculto.
        pedir_nombre: true,
        nombre_requerido: true,
        pedir_telefono: false,
        telefono_requerido: false,
        preguntas,
      };

      if (isEdit) {
        await Examenes.update(examen.id_examen, payload);
        toast.success('Examen actualizado');
      } else {
        await Examenes.create(payload);
        toast.success('Examen creado');
      }
      onSaved();
    } catch (err) {
      toastApiError(toast, err, 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const urlPreview = `${PUBLIC_BASE_URL}/${slugify(form.libro_slug) || 'libro'}/${form.sesion || 'N'}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar examen' : 'Crear examen'}
      wide
      footer={
        <>
          <button type="button" className="c-btn c-btn-ghost px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="c-btn px-4 py-2 text-sm" disabled={saving} onClick={submit}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="c-label" htmlFor="ex-libro-titulo">
              Libro
            </label>
            <input
              id="ex-libro-titulo"
              className="c-input"
              value={form.libro_titulo}
              onChange={(e) => {
                const libro_titulo = e.target.value;
                setForm((f) => ({
                  ...f,
                  libro_titulo,
                  libro_slug: slugTouched ? f.libro_slug : slugify(libro_titulo),
                }));
              }}
              placeholder="¿Quién es Jesús?"
            />
          </div>
          <div>
            <label className="c-label" htmlFor="ex-sesion">
              Sesión
            </label>
            <input
              id="ex-sesion"
              type="number"
              min={1}
              inputMode="numeric"
              className="c-input"
              value={form.sesion}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sesion: e.target.value,
                  titulo: !f.titulo || /^Sesión \d*$/.test(f.titulo) ? `Sesión ${e.target.value}` : f.titulo,
                }))
              }
              placeholder="1"
            />
          </div>
        </div>
        <div>
          <label className="c-label" htmlFor="ex-libro-slug">
            Libro en la URL
          </label>
          <input
            id="ex-libro-slug"
            className="c-input font-mono"
            value={form.libro_slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, libro_slug: e.target.value }));
            }}
            placeholder="quien-es-jesus"
          />
          <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{urlPreview}</p>
        </div>
        <div>
          <label className="c-label" htmlFor="ex-titulo">
            Título
          </label>
          <input
            id="ex-titulo"
            className="c-input"
            value={form.titulo}
            onChange={upd('titulo')}
            placeholder="Sesión 1"
          />
        </div>
        <div>
          <label className="c-label" htmlFor="ex-subtitulo">
            Subtítulo
          </label>
          <input id="ex-subtitulo" className="c-input" value={form.subtitulo} onChange={upd('subtitulo')} />
        </div>
        <div>
          <label className="c-label" htmlFor="ex-descripcion">
            Descripción / instrucciones
          </label>
          <textarea
            id="ex-descripcion"
            className="c-input min-h-24"
            value={form.descripcion}
            onChange={upd('descripcion')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={Boolean(form.activo)}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            Examen activo (acepta respuestas)
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={Boolean(form.mostrar_calificacion)}
              onChange={(e) => setForm((f) => ({ ...f, mostrar_calificacion: e.target.checked }))}
            />
            Mostrar calificación al alumno al enviar
          </label>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
          <MediaPicker
            label="Imagen de portada (pantalla de inicio)"
            tipos={['imagen']}
            value={form.imagen_url ? { tipo: 'imagen', valor: form.imagen_url } : null}
            onChange={(media) => setForm((f) => ({ ...f, imagen_url: media?.valor || '' }))}
          />
        </div>

        <PreguntaBuilder
          preguntas={form.preguntas}
          hasRespuestas={hasRespuestas}
          onChange={(preguntas) => setForm((f) => ({ ...f, preguntas }))}
        />
      </div>
    </Modal>
  );
};

export default ExamenFormModal;
