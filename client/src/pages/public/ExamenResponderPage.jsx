import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Loader2,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useTheme } from '../../app/theme/ThemeProvider';
import { APP_NAME, LOGO_BLANCO, LOGO_NEGRO, THEME_MODES } from '../../app/constants';
import DottedGlowBackground from '../../components/registro/DottedGlowBackground';
import ExamenPreguntaField from '../../components/registro/ExamenPreguntaField';
import HouseTreeIcon from '../../components/icons/HouseTreeIcon';
import { PublicExamen } from '../../services/publicExamen';
import { Loading } from '../../components/ui/States';

// El gradiente del título usa background-clip: text, que aplana el emoji
// nativo a una silueta sin detalle. Se reemplaza por un ícono SVG propio.
const ICONO_POR_EMOJI = { '🏡': HouseTreeIcon };
const EMOJI_PATTERN = new RegExp(`(${Object.keys(ICONO_POR_EMOJI).join('|')})`, 'gu');

const renderTituloConIconos = (titulo) =>
  String(titulo || '')
    .split(EMOJI_PATTERN)
    .filter((parte) => parte !== '')
    .map((parte, i) => {
      const Icono = ICONO_POR_EMOJI[parte];
      return Icono ? <Icono key={i} size="0.85em" /> : <span key={i}>{parte}</span>;
    });

const emptyAnswer = (tipo) => (tipo === 'multiple' ? { opcion_ids: [] } : { opcion_id: null });

const formatCalificacion = (valor) => Number(valor).toFixed(1).replace(/\.0$/, '');

const ExamenResponderPage = () => {
  const { libro, sesion } = useParams();
  const { theme } = useTheme();
  const logoSrc = theme === THEME_MODES.dark ? LOGO_BLANCO : LOGO_NEGRO;
  const dotColor = theme === THEME_MODES.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const dotGlow = theme === THEME_MODES.dark ? 'rgba(108,104,255,0.35)' : 'rgba(108,104,255,0.22)';

  const [examen, setExamen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    PublicExamen.get(libro, sesion)
      .then((data) => {
        if (cancelled) return;
        setExamen(data);
        const initial = {};
        for (const p of data.preguntas || []) {
          initial[p.id] = emptyAnswer(p.tipo);
        }
        setAnswers(initial);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || 'Este examen no está disponible.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [libro, sesion]);

  const preguntas = useMemo(
    () => (Array.isArray(examen?.preguntas) ? examen.preguntas : []),
    [examen]
  );

  const validateClient = () => {
    const nextErrors = {};
    for (const pregunta of preguntas) {
      const value = answers[pregunta.id];
      if (pregunta.tipo === 'unica') {
        if (pregunta.requerida && !value?.opcion_id) nextErrors[pregunta.id] = 'Selecciona una opción';
      } else {
        const ids = value?.opcion_ids || [];
        if (pregunta.requerida && ids.length === 0) {
          nextErrors[pregunta.id] = 'Selecciona al menos una opción';
        } else if (pregunta.max_selecciones != null && ids.length > Number(pregunta.max_selecciones)) {
          nextErrors[pregunta.id] = `Máximo ${pregunta.max_selecciones} selecciones`;
        }
      }
    }
    if (examen?.pedir_nombre && examen?.nombre_requerido && !nombre.trim()) {
      nextErrors.__nombre__ = 'El nombre es obligatorio';
    }
    if (examen?.pedir_telefono && examen?.telefono_requerido && !telefono.trim()) {
      nextErrors.__telefono__ = 'El teléfono es obligatorio';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validateClient()) {
      setSubmitError('Te faltan datos por completar. Revisa los campos marcados en rojo.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await PublicExamen.responder(libro, sesion, {
        nombre: nombre.trim() || undefined,
        telefono: telefono.trim() || undefined,
        respuestas: answers,
      });
      setResultado(data?.resultado || null);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'No se pudo enviar la respuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="registro-page flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !examen) {
    return (
      <div className="registro-page flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle size={40} className="text-[var(--text-secondary)]" />
        <p className="text-lg font-semibold">{error || 'Examen no encontrado'}</p>
      </div>
    );
  }

  if (!examen.activo) {
    return (
      <div className="registro-page flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle size={40} className="text-[var(--text-secondary)]" />
        <h1 className="text-2xl font-bold">{examen.titulo}</h1>
        <p className="max-w-md text-[var(--text-secondary)]">Este examen ya no está disponible.</p>
      </div>
    );
  }

  return (
    <div className="registro-page registro-mesh registro-glow-top relative flex min-h-screen flex-col">
      <DottedGlowBackground
        gap={32}
        radius={1.2}
        color={dotColor}
        glowColor={dotGlow}
        speedScale={0.4}
        className="pointer-events-none"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        {logoError ? (
          <span className="text-2xl font-extrabold tracking-tight">{APP_NAME}</span>
        ) : (
          <img
            src={logoSrc}
            alt="Comunidad"
            className="h-10 w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-8 md:py-16">
        {!submitted ? (
          <div className="registro-landing-layout registro-landing-layout--stacked">
            <div className="registro-landing-info space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-strong)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)] px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                <span className="text-xs font-semibold tracking-wider text-[var(--accent-strong)] uppercase">
                  Ejercicio de reafirmación
                </span>
              </div>

              <h1 className="text-4xl leading-none font-extrabold tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
                <span className="registro-hero-gradient">{renderTituloConIconos(examen.titulo)}</span>
              </h1>

              {examen.subtitulo?.trim() && (
                <p className="registro-tagline max-w-lg text-sm leading-relaxed sm:text-[0.9375rem]">
                  {examen.subtitulo.trim()}
                </p>
              )}

              {examen.descripcion?.trim() && (
                <p className="registro-curso-desc max-w-lg text-base leading-relaxed sm:text-lg">
                  {examen.descripcion.trim()}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {examen.libro_titulo && (
                  <span className="registro-meta-chip inline-flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                    {examen.libro_titulo}
                  </span>
                )}
                <span className="registro-meta-chip inline-flex items-center gap-1.5">
                  <ClipboardList className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                  {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="registro-landing-form w-full">
              <div className="registro-glass relative rounded-2xl p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-wide">Responde el examen</h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Selecciona la respuesta correcta.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {preguntas.map((pregunta, i) => (
                    <ExamenPreguntaField
                      key={pregunta.id}
                      numero={i + 1}
                      pregunta={pregunta}
                      value={answers[pregunta.id]}
                      error={fieldErrors[pregunta.id]}
                      onChange={(next) => {
                        setAnswers((prev) => ({ ...prev, [pregunta.id]: next }));
                        setSubmitError(null);
                        setFieldErrors((prev) => {
                          if (!prev[pregunta.id]) return prev;
                          const copy = { ...prev };
                          delete copy[pregunta.id];
                          return copy;
                        });
                      }}
                    />
                  ))}

                  {(examen.pedir_nombre || examen.pedir_telefono) && (
                    <div className="space-y-5 border-t border-[var(--divider)] pt-5">
                      {examen.pedir_nombre && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                            Nombre {examen.nombre_requerido ? '' : '(opcional)'}
                          </label>
                          <div className="relative">
                            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-secondary)]">
                              <User className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              value={nombre}
                              onChange={(e) => {
                                setNombre(e.target.value);
                                setFieldErrors((prev) => {
                                  if (!prev.__nombre__) return prev;
                                  const copy = { ...prev };
                                  delete copy.__nombre__;
                                  return copy;
                                });
                              }}
                              placeholder="Ingresa tu nombre"
                              className="registro-input"
                              autoComplete="name"
                              aria-invalid={Boolean(fieldErrors.__nombre__)}
                            />
                          </div>
                          {fieldErrors.__nombre__ && (
                            <p className="flex items-center gap-1.5 text-xs text-red-500">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {fieldErrors.__nombre__}
                            </p>
                          )}
                        </div>
                      )}

                      {examen.pedir_telefono && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                            Teléfono {examen.telefono_requerido ? '' : '(opcional)'}
                          </label>
                          <div className="relative">
                            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--text-secondary)]">
                              <Phone className="h-4 w-4" />
                            </span>
                            <input
                              type="tel"
                              value={telefono}
                              onChange={(e) => {
                                setTelefono(e.target.value);
                                setFieldErrors((prev) => {
                                  if (!prev.__telefono__) return prev;
                                  const copy = { ...prev };
                                  delete copy.__telefono__;
                                  return copy;
                                });
                              }}
                              placeholder="55 1234 5678"
                              className="registro-input font-mono"
                              autoComplete="tel"
                              inputMode="tel"
                              aria-invalid={Boolean(fieldErrors.__telefono__)}
                            />
                          </div>
                          {fieldErrors.__telefono__ && (
                            <p className="flex items-center gap-1.5 text-xs text-red-500">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {fieldErrors.__telefono__}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {submitError && (
                    <p className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="registro-cta mt-2 flex w-full items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-xs tracking-widest uppercase">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar examen</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="registro-success-pop mx-auto w-full max-w-xl">
            <div className="registro-glass rounded-2xl p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-success)_85%,#000)] shadow-lg">
                <Check className="h-8 w-8 stroke-[3] text-white" />
              </div>

              <span className="text-xs font-semibold tracking-widest text-[var(--accent-success)] uppercase">
                ¡Gracias{nombre.trim() ? `, ${nombre.trim().split(/\s+/)[0]}` : ''}!
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-wide">Examen enviado</h2>

              {resultado ? (
                <>
                  <p className="mt-6 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                    Tu calificación
                  </p>
                  <p className="registro-hero-gradient mt-1 text-7xl leading-none font-extrabold">
                    {formatCalificacion(resultado.calificacion)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {resultado.aciertos} de {resultado.total_preguntas} respuestas correctas
                  </p>

                  <ul className="mt-6 space-y-2 text-left">
                    {preguntas.map((p, i) => {
                      const ok = resultado.resultados?.[p.id];
                      return (
                        <li
                          key={p.id}
                          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--divider)] px-3 py-2 text-sm"
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              ok ? 'bg-[var(--accent-success)]' : 'bg-red-500'
                            }`}
                            aria-label={ok ? 'Correcta' : 'Incorrecta'}
                          >
                            {ok ? (
                              <Check className="h-3 w-3 stroke-[3] text-white" />
                            ) : (
                              <X className="h-3 w-3 stroke-[3] text-white" />
                            )}
                          </span>
                          <span className="text-[var(--text-primary)]">
                            {i + 1}. {p.texto}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
                  Tus respuestas quedaron registradas correctamente.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-[var(--divider)] px-6 py-6 text-center text-xs text-[var(--text-secondary)]">
        &copy; {new Date().getFullYear()} Comunidad. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default ExamenResponderPage;
