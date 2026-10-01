import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, Check, ClipboardList, Loader2, Pencil, X } from 'lucide-react';
import { APP_NAME, LOGO_NEGRO } from '../../app/constants';
import { PublicExamen } from '../../services/publicExamen';
import StepHeader from '../../components/stepper/StepHeader';
import OptionCard from '../../components/stepper/OptionCard';
import MediaView from '../../components/media/MediaView';

const MIN_LETRAS = 5;
const AUTO_AVANCE_MS = 350;

const contarLetras = (texto) => (String(texto || '').match(/\p{L}/gu) || []).length;
const storageKey = (libro, sesion) => `edm:${libro}:${sesion}`;
const letra = (i) => String.fromCharCode(65 + i);

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};
const writeStorage = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado: el examen funciona igual, sólo sin recuperar avance */
  }
};

const seleccion = (pregunta, value) => {
  if (pregunta.tipo === 'multiple') return Array.isArray(value?.opcion_ids) ? value.opcion_ids : [];
  return value?.opcion_id ? [value.opcion_id] : [];
};
const respondida = (pregunta, value) => seleccion(pregunta, value).length > 0;

const formatCalificacion = (valor) => Number(valor).toFixed(1).replace(/\.0$/, '');

const mensajePorCalificacion = (c) => {
  if (c >= 9) return { emoji: '🏆', titulo: '¡Excelente!' };
  if (c >= 7) return { emoji: '🎉', titulo: '¡Muy bien!' };
  if (c >= 6) return { emoji: '👍', titulo: '¡Bien hecho!' };
  return { emoji: '💪', titulo: '¡Sigue practicando!' };
};

/** Contenedor de cada pantalla, con animación según la dirección. */
const Screen = ({ stepKey, direction, children, className = '' }) => (
  <main
    key={stepKey}
    className={`edm-step mx-auto w-full max-w-xl flex-1 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] ${className}`}
    style={{ '--edm-step-from': direction < 0 ? '-24px' : '24px' }}
  >
    {children}
  </main>
);

const CenteredMessage = ({ title, text }) => (
  <div className="edm-brand flex flex-col items-center justify-center gap-4 px-6 text-center">
    <AlertCircle size={44} className="text-[var(--brand-orange)]" />
    {title && <h1 className="text-2xl font-extrabold">{title}</h1>}
    <p className="max-w-sm text-lg text-[var(--brand-ink-soft)]">{text}</p>
  </div>
);

const ExamenResponderPage = () => {
  const { libro, sesion } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const key = storageKey(libro, sesion);

  const [examen, setExamen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nombre, setNombre] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const autoTimer = useRef(null);
  const prevStepRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    PublicExamen.get(libro, sesion)
      .then((data) => {
        if (cancelled) return;
        setExamen(data);
        const saved = readStorage(key);
        if (saved?.examenId === data.id_examen) {
          const ids = new Set((data.preguntas || []).map((p) => p.id));
          setNombre(saved.nombre || '');
          setAnswers(Object.fromEntries(Object.entries(saved.answers || {}).filter(([id]) => ids.has(id))));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Este examen no está disponible.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [libro, sesion, key]);

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  // Guarda el avance en el celular para no perderlo si recarga o se va la señal.
  useEffect(() => {
    if (!examen || submitted) return;
    writeStorage(key, { examenId: examen.id_examen, nombre, answers });
  }, [examen, nombre, answers, submitted, key]);

  const preguntas = useMemo(() => (Array.isArray(examen?.preguntas) ? examen.preguntas : []), [examen]);
  const total = preguntas.length;
  const nombreValido = contarLetras(nombre) >= MIN_LETRAS;

  // Paso actual desde la URL (?p=3 | ?p=revisar), así funciona el "atrás" del celular.
  const p = searchParams.get('p');
  const stepIndex = p === 'revisar' ? total + 1 : Number.isInteger(Number(p)) && Number(p) >= 1 ? Math.min(Number(p), total) : 0;
  const direction = stepIndex >= prevStepRef.current ? 1 : -1;
  useEffect(() => {
    prevStepRef.current = stepIndex;
  }, [stepIndex]);

  const goTo = useCallback(
    (step, { replace = false, fromReview = false } = {}) => {
      clearTimeout(autoTimer.current);
      const search = step === 0 ? '' : `?p=${step === total + 1 ? 'revisar' : step}`;
      navigate({ search }, { replace, state: { stepper: true, fromReview } });
    },
    [navigate, total]
  );

  // Sin nombre válido no se puede estar dentro del examen (ej. recarga en ?p=4).
  useEffect(() => {
    if (!loading && examen && !submitted && stepIndex > 0 && !nombreValido) goTo(0, { replace: true });
  }, [loading, examen, submitted, stepIndex, nombreValido, goTo]);

  const goBack = () => {
    clearTimeout(autoTimer.current);
    if (location.state?.stepper) navigate(-1);
    else goTo(Math.max(stepIndex - 1, 0), { replace: true });
  };

  const goNextFrom = (index) => {
    const fromReview = Boolean(location.state?.fromReview);
    const todas = preguntas.every((q) => !q.requerida || respondida(q, answers[q.id]) || q.id === preguntas[index].id);
    if (fromReview && todas) goTo(total + 1);
    else goTo(index + 2 > total ? total + 1 : index + 2, { fromReview });
  };

  const selectOption = (pregunta, index, opcionId) => {
    if (pregunta.tipo === 'multiple') {
      const ids = seleccion(pregunta, answers[pregunta.id]);
      const isOn = ids.includes(opcionId);
      const max = pregunta.max_selecciones != null ? Number(pregunta.max_selecciones) : null;
      if (!isOn && max != null && ids.length >= max) return;
      setAnswers((prev) => ({
        ...prev,
        [pregunta.id]: { opcion_ids: isOn ? ids.filter((id) => id !== opcionId) : [...ids, opcionId] },
      }));
      return;
    }
    setAnswers((prev) => ({ ...prev, [pregunta.id]: { opcion_id: opcionId } }));
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => goNextFrom(index), AUTO_AVANCE_MS);
  };

  const primeraSinResponder = preguntas.findIndex((q) => !respondida(q, answers[q.id]));
  const faltantes = preguntas.filter((q) => q.requerida && !respondida(q, answers[q.id]));

  const handleStart = (e) => {
    e.preventDefault();
    if (!nombreValido) return;
    goTo(primeraSinResponder === -1 ? total + 1 : primeraSinResponder + 1);
  };

  const handleSubmit = async () => {
    if (faltantes.length) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const respuestas = Object.fromEntries(
        preguntas.map((q) => [
          q.id,
          q.tipo === 'multiple' ? { opcion_ids: seleccion(q, answers[q.id]) } : { opcion_id: answers[q.id]?.opcion_id || null },
        ])
      );
      const data = await PublicExamen.responder(libro, sesion, { nombre: nombre.trim(), respuestas });
      setResultado(data?.resultado || null);
      setSubmitted(true);
      writeStorage(key, null);
      navigate({ search: '?p=resultado' }, { replace: true });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edm-brand flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[var(--brand-orange)]" />
      </div>
    );
  }
  if (error || !examen) return <CenteredMessage title="Examen no encontrado" text={error} />;
  if (!examen.activo && !submitted) {
    return <CenteredMessage title={examen.titulo} text="Este examen ya no está disponible." />;
  }

  // ───────────── Resultado (retroalimentación estilo Duolingo) ─────────────
  if (submitted) {
    if (!resultado) {
      return (
        <div className="edm-brand flex flex-col">
          <Screen stepKey="fin" direction={1} className="flex flex-col items-center justify-center text-center">
            <div className="edm-pop mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-yellow)]">
              <Check size={48} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-extrabold">¡Gracias, {nombre.trim().split(/\s+/)[0]}!</h1>
            <p className="mt-2 text-lg text-[var(--brand-ink-soft)]">Tus respuestas quedaron registradas.</p>
          </Screen>
        </div>
      );
    }
    const msg = mensajePorCalificacion(resultado.calificacion);
    return (
      <div className="edm-brand flex flex-col">
        <Screen stepKey="resultado" direction={1} className="pt-8">
          <section className="text-center">
            <div className="edm-pop text-7xl" role="img" aria-hidden>
              {msg.emoji}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold">{msg.titulo}</h1>
            <p className="mt-1 text-lg text-[var(--brand-ink-soft)]">{nombre.trim()}</p>

            <div className="mx-auto mt-6 flex max-w-xs items-stretch overflow-hidden rounded-3xl border-2 border-[var(--brand-orange)]">
              <div className="flex flex-1 flex-col items-center justify-center bg-[var(--brand-yellow)] py-4">
                <span className="text-xs font-bold tracking-widest uppercase">Calificación</span>
                <span className="text-5xl leading-tight font-extrabold tabular-nums">
                  {formatCalificacion(resultado.calificacion)}
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center bg-white py-4">
                <span className="text-xs font-bold tracking-widest text-[var(--brand-ink-soft)] uppercase">Aciertos</span>
                <span className="text-4xl leading-tight font-extrabold tabular-nums">
                  {resultado.aciertos}/{resultado.total_preguntas}
                </span>
              </div>
            </div>
          </section>

          <h2 className="mt-10 mb-4 text-xl font-extrabold">Revisa tus respuestas</h2>
          <ol className="space-y-4">
            {preguntas.map((q, i) => {
              const ok = Boolean(resultado.resultados?.[q.id]);
              const elegidas = seleccion(q, answers[q.id]);
              const correctas = resultado.correctas?.[q.id] || [];
              const opcionesDe = (ids) =>
                ids
                  .map((id) => {
                    const idx = q.opciones.findIndex((o) => o.id === id);
                    return idx >= 0 ? { ...q.opciones[idx], idx } : null;
                  })
                  .filter(Boolean);
              return (
                <li
                  key={q.id}
                  className="overflow-hidden rounded-3xl border-2 bg-white"
                  style={{ borderColor: ok ? 'var(--brand-correct)' : 'var(--brand-wrong)' }}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white"
                    style={{ background: ok ? 'var(--brand-correct)' : 'var(--brand-wrong)' }}
                  >
                    {ok ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                    {ok ? '¡Correcto!' : 'Incorrecto'}
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-base font-semibold">
                      {i + 1}. {q.texto}
                    </p>
                    <div>
                      <p className="text-xs font-bold tracking-wider text-[var(--brand-ink-soft)] uppercase">Tu respuesta</p>
                      {opcionesDe(elegidas).length === 0 ? (
                        <p className="text-[var(--brand-ink-soft)]">Sin responder</p>
                      ) : (
                        opcionesDe(elegidas).map((o) => (
                          <p
                            key={o.id}
                            className={`flex items-center gap-2 ${ok ? '' : 'text-[var(--brand-wrong)] line-through decoration-2'}`}
                          >
                            {o.media && <MediaView media={o.media} emojiSize="1.25rem" className="!h-6 !w-6 rounded" />}
                            {letra(o.idx)}) {o.texto}
                          </p>
                        ))
                      )}
                    </div>
                    {!ok && correctas.length > 0 && (
                      <div className="rounded-2xl bg-[color-mix(in_srgb,var(--brand-correct)_12%,white)] p-3">
                        <p className="text-xs font-bold tracking-wider text-[var(--brand-correct)] uppercase">
                          Respuesta correcta
                        </p>
                        {opcionesDe(correctas).map((o) => (
                          <p key={o.id} className="flex items-center gap-2 font-semibold text-[var(--brand-correct)]">
                            {o.media && <MediaView media={o.media} emojiSize="1.25rem" className="!h-6 !w-6 rounded" />}
                            {letra(o.idx)}) {o.texto}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-10 text-center text-xs text-[var(--brand-ink-soft)]">
            &copy; {new Date().getFullYear()} Comunidad
          </p>
        </Screen>
      </div>
    );
  }

  // ───────────── Inicio ─────────────
  if (stepIndex === 0) {
    const tieneAvance = Object.keys(answers).length > 0;
    return (
      <div className="edm-brand flex flex-col">
        <Screen stepKey="inicio" direction={direction} className="pt-[max(1.5rem,env(safe-area-inset-top))]">
          <header className="mb-6 flex h-10 items-center">
            {logoError ? (
              <span className="text-2xl font-extrabold tracking-tight">{APP_NAME}</span>
            ) : (
              <img src={LOGO_NEGRO} alt="Comunidad" className="h-10 w-auto object-contain" onError={() => setLogoError(true)} />
            )}
          </header>

          {examen.imagen_url && (
            <img
              src={examen.imagen_url}
              alt={examen.libro_titulo || examen.titulo}
              className="mb-6 aspect-[16/10] w-full rounded-3xl object-cover"
            />
          )}

          <span className="inline-flex rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-xs font-bold tracking-widest uppercase">
            Ejercicio de reafirmación
          </span>
          <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight">
            {examen.libro_titulo || examen.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--brand-card-border)] bg-white px-3 py-1.5 font-semibold">
              <BookOpen size={16} className="text-[var(--brand-orange)]" /> Sesión {examen.sesion}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--brand-card-border)] bg-white px-3 py-1.5 font-semibold">
              <ClipboardList size={16} className="text-[var(--brand-orange)]" /> {total} pregunta{total === 1 ? '' : 's'}
            </span>
          </div>

          {examen.descripcion && (
            <p className="mt-4 text-lg leading-relaxed text-[var(--brand-ink-soft)]">{examen.descripcion}</p>
          )}

          <form onSubmit={handleStart} className="mt-8 space-y-3" noValidate>
            <label htmlFor="edm-nombre" className="block text-lg font-bold">
              ¿Cómo te llamas?
            </label>
            <input
              id="edm-nombre"
              className="edm-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="go"
              aria-describedby="edm-nombre-hint"
            />
            <p id="edm-nombre-hint" className="text-sm text-[var(--brand-ink-soft)]">
              {nombreValido
                ? '¡Listo!'
                : `Escribe al menos ${MIN_LETRAS} letras (${contarLetras(nombre)}/${MIN_LETRAS})`}
            </p>
            <button type="submit" className="edm-cta mt-2" disabled={!nombreValido}>
              {tieneAvance ? 'Continuar' : 'Comenzar'} <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </form>
        </Screen>
      </div>
    );
  }

  // ───────────── Revisión ─────────────
  if (stepIndex === total + 1) {
    return (
      <div className="edm-brand flex flex-col">
        <StepHeader current={total} total={total} onBack={goBack} label="Revisión" />
        <Screen stepKey="revisar" direction={direction} className="pt-4">
          <h1 className="text-center text-3xl font-extrabold">Revisa antes de enviar</h1>
          <p className="mt-2 text-center text-[var(--brand-ink-soft)]">Toca una pregunta para cambiar tu respuesta.</p>
          <ol className="mt-6 space-y-3">
            {preguntas.map((q, i) => {
              const elegidas = seleccion(q, answers[q.id]);
              const textos = elegidas
                .map((id) => {
                  const idx = q.opciones.findIndex((o) => o.id === id);
                  return idx >= 0 ? `${letra(idx)}) ${q.opciones[idx].texto}` : null;
                })
                .filter(Boolean);
              const falta = q.requerida && elegidas.length === 0;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i + 1, { fromReview: true })}
                    className="flex w-full items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left"
                    style={{ borderColor: falta ? 'var(--brand-orange)' : 'var(--brand-card-border)' }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-yellow)] font-bold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{q.texto}</span>
                      <span
                        className={`mt-1 block text-sm ${falta ? 'font-semibold text-[var(--brand-orange)]' : 'text-[var(--brand-ink-soft)]'}`}
                      >
                        {textos.length ? textos.join(', ') : 'Sin responder'}
                      </span>
                    </span>
                    <Pencil size={18} className="mt-1 shrink-0 text-[var(--brand-ink-soft)]" />
                  </button>
                </li>
              );
            })}
          </ol>

          {submitError && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[color-mix(in_srgb,var(--brand-wrong)_12%,white)] px-4 py-3 text-sm font-medium text-[var(--brand-wrong)]">
              <AlertCircle size={18} className="shrink-0" /> {submitError}
            </p>
          )}
          {faltantes.length > 0 && (
            <p className="mt-4 text-center text-sm font-semibold text-[var(--brand-orange)]">
              Te falta{faltantes.length === 1 ? '' : 'n'} {faltantes.length} pregunta
              {faltantes.length === 1 ? '' : 's'} por responder.
            </p>
          )}
          <div className="sticky bottom-0 -mx-5 mt-6 bg-[var(--brand-ivory)] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="edm-cta edm-cta--dark"
              disabled={submitting || faltantes.length > 0}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  Enviar examen <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </Screen>
      </div>
    );
  }

  // ───────────── Pregunta ─────────────
  const index = stepIndex - 1;
  const pregunta = preguntas[index];
  const multiple = pregunta.tipo === 'multiple';
  const elegidas = seleccion(pregunta, answers[pregunta.id]);
  const max = pregunta.max_selecciones != null ? Number(pregunta.max_selecciones) : null;

  return (
    <div className="edm-brand flex flex-col">
      <StepHeader current={stepIndex} total={total} onBack={goBack} />
      <Screen stepKey={`q-${pregunta.id}`} direction={direction} className="flex flex-col pt-4">
        <div className="flex min-h-[28vh] flex-col items-center justify-center py-4 text-center">
          {pregunta.media && (
            <div
              className={`mb-5 flex items-center justify-center overflow-hidden ${
                pregunta.media.tipo === 'imagen' ? 'max-h-56 w-full rounded-3xl' : ''
              }`}
            >
              <MediaView
                media={pregunta.media}
                alt={pregunta.texto}
                emojiSize="5.5rem"
                imgClassName="max-h-56 !w-auto max-w-full rounded-3xl object-contain"
              />
            </div>
          )}
          <h1 className="text-[1.85rem] leading-tight font-extrabold tracking-tight sm:text-4xl">{pregunta.texto}</h1>
          {multiple && (
            <p className="mt-3 text-base text-[var(--brand-ink-soft)]">
              {max != null ? `Elige hasta ${max}` : 'Elige todas las que apliquen'}
            </p>
          )}
        </div>

        <div className="space-y-4" role={multiple ? 'group' : 'radiogroup'} aria-label={pregunta.texto}>
          {pregunta.opciones.map((opcion, i) => {
            const checked = elegidas.includes(opcion.id);
            return (
              <OptionCard
                key={opcion.id}
                opcion={opcion}
                index={i}
                multiple={multiple}
                checked={checked}
                disabled={multiple && !checked && max != null && elegidas.length >= max}
                onSelect={() => selectOption(pregunta, index, opcion.id)}
              />
            );
          })}
        </div>

        {multiple && (
          <div className="sticky bottom-0 -mx-5 mt-auto bg-[var(--brand-ivory)] px-5 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="edm-cta"
              disabled={pregunta.requerida && elegidas.length === 0}
              onClick={() => goNextFrom(index)}
            >
              Siguiente <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </Screen>
    </div>
  );
};

export default ExamenResponderPage;
