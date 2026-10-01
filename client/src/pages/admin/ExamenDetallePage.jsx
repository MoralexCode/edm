import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CloudDownload, Copy, Eye, Pencil, QrCode, Trash2, X } from 'lucide-react';
import toast from '../../components/toast/toast';
import { toastApiError } from '../../utils/toastApiError';
import AppHeader from '../../components/layout/AppHeader';
import Modal from '../../components/ui/Modal';
import { Loading, EmptyState } from '../../components/ui/States';
import ExamenFormModal from '../../components/examenes/ExamenFormModal';
import BarList from '../../components/examenes/resultados/BarList';
import ExamenHeatmap from '../../components/examenes/resultados/ExamenHeatmap';
import { Examenes } from '../../services/examenes';
import { downloadExamenQr, examenPublicPath, examenPublicUrl } from '../../utils/downloadExamenQr';
import { exportExamenRespuestasExcel } from '../../utils/exportExamenRespuestasExcel';
import { formatCalificacion, resolveAnswerDetail } from '../../utils/examenRespuestas';
import {
  aciertosPorPregunta,
  contarOpciones,
  distribucionCalificaciones,
  esPreguntaDeOpciones,
  filtrarPorOpcion,
  promedio,
} from '../../utils/examenStats';
import { useAllRespuestas } from '../../hooks/useAllRespuestas';

const formatFecha = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

const colorCalificacion = (valor) =>
  Number(valor) >= 8
    ? 'text-[var(--accent-success)]'
    : Number(valor) >= 6
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-500';

const TABS = [
  { key: 'calificaciones', label: 'Calificaciones' },
  { key: 'graficas', label: 'Gráficas' },
  { key: 'interactivo', label: 'Interactivo' },
  { key: 'mapa', label: 'Mapa de calor' },
  { key: 'respuestas', label: 'Todas las respuestas' },
];

const PAGE_SIZE = 20;

const ExamenDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examen, setExamen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deletingRow, setDeletingRow] = useState(false);
  const [tab, setTab] = useState('calificaciones');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtroPreguntaId, setFiltroPreguntaId] = useState('');
  const [filtroOpcionId, setFiltroOpcionId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Examenes.get(id)
      .then(setExamen)
      .catch((err) => toastApiError(toast, err, 'No se pudo cargar el examen'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const { respuestas, loading: loadingRespuestas, reload: reloadRespuestas } = useAllRespuestas(id);
  const hasRespuestas = respuestas.length > 0;

  const preguntas = useMemo(() => (Array.isArray(examen?.preguntas) ? examen.preguntas : []), [examen]);
  const preguntasOpciones = useMemo(() => preguntas.filter(esPreguntaDeOpciones), [preguntas]);
  const preguntasUnicas = useMemo(() => preguntas.filter((p) => p.tipo === 'unica'), [preguntas]);

  useEffect(() => {
    if (!filtroPreguntaId && preguntasUnicas.length > 0) {
      setFiltroPreguntaId(preguntasUnicas[0].id);
    }
  }, [preguntasUnicas, filtroPreguntaId]);

  const preguntaFiltro = preguntasUnicas.find((p) => p.id === filtroPreguntaId) || null;
  const opcionesFiltro = preguntaFiltro ? contarOpciones(respuestas, preguntaFiltro) : [];
  const respuestasFiltradas =
    preguntaFiltro && filtroOpcionId ? filtrarPorOpcion(respuestas, preguntaFiltro, filtroOpcionId) : respuestas;

  const statsPreguntas = useMemo(() => aciertosPorPregunta(respuestas, preguntas), [respuestas, preguntas]);
  const masFallada = statsPreguntas[0];
  const ranking = useMemo(
    () => [...respuestas].sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0)),
    [respuestas]
  );

  const handleExportExcel = async () => {
    if (!hasRespuestas) return toast.error('No hay respuestas para exportar');
    setExportingExcel(true);
    try {
      exportExamenRespuestasExcel(examen, respuestas);
      toast.success('Excel descargado');
    } catch (err) {
      toastApiError(toast, err, 'No se pudo generar el Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDownloadQr = async () => {
    setDownloadingQr(true);
    try {
      await downloadExamenQr(examen);
      toast.success('Código QR descargado');
    } catch {
      toast.error('No se pudo generar el código QR');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(examenPublicUrl(examen));
      toast.success('Liga copiada');
    } catch {
      toast.error(examenPublicUrl(examen));
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await Examenes.remove(examen.id_examen);
      setDeleteOpen(false);
      toast.success('Examen eliminado');
      navigate('/admin/examenes');
    } catch (err) {
      toastApiError(toast, err, 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteRow = async () => {
    setDeletingRow(true);
    try {
      await Examenes.removeRespuesta(examen.id_examen, deleteRow.id_respuesta);
      setDeleteRow(null);
      setDetailRow(null);
      toast.success('Respuesta eliminada');
      reloadRespuestas();
    } catch (err) {
      toastApiError(toast, err, 'No se pudo eliminar la respuesta');
    } finally {
      setDeletingRow(false);
    }
  };

  if (loading || !examen) {
    return (
      <>
        <AppHeader title="Examen" />
        <Loading />
      </>
    );
  }

  return (
    <>
      <AppHeader title={`${examen.libro_titulo ? `${examen.libro_titulo} · ` : ''}${examen.titulo}`} />
      <button
        type="button"
        onClick={() => navigate('/admin/examenes')}
        className="mb-3 flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--text-secondary)]"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <section className="c-card mb-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="c-chip" data-accent="true">
            {examen.activo ? 'Activo' : 'Cerrado'}
          </span>
          <span className="c-chip">{preguntas.length} preguntas</span>
          {examen.libro_titulo && <span className="c-chip">{examen.libro_titulo}</span>}
          <span className="c-chip">Sesión {examen.sesion}</span>
        </div>
        <p className="mt-3 break-all font-mono text-xs text-[var(--text-secondary)]">{examenPublicUrl(examen)}</p>
        {examen.subtitulo && (
          <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">{examen.subtitulo}</p>
        )}
        {examen.descripcion && <p className="mt-2 text-sm text-[var(--text-secondary)]">{examen.descripcion}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil size={16} /> Editar
          </button>
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            disabled={downloadingQr}
            onClick={handleDownloadQr}
          >
            <QrCode size={16} /> {downloadingQr ? 'Generando…' : 'QR'}
          </button>
          <button type="button" className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm" onClick={handleCopyLink}>
            <Copy size={16} /> Liga
          </button>
          <a
            href={examenPublicPath(examen)}
            target="_blank"
            rel="noopener noreferrer"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            aria-label="Ver examen público"
            title="Ver examen público"
          >
            <Eye size={16} /> Ver
          </a>
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            disabled={exportingExcel || !hasRespuestas}
            onClick={handleExportExcel}
          >
            <CloudDownload size={16} /> {exportingExcel ? 'Generando…' : 'Excel'}
          </button>
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      </section>

      {loadingRespuestas ? (
        <section className="c-card p-5">
          <Loading />
        </section>
      ) : !hasRespuestas ? (
        <section className="c-card p-5">
          <EmptyState title="Sin respuestas" description="Cuando alguien responda, aparecerán aquí." />
        </section>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="c-card p-4">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{respuestas.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Respuestas</p>
            </div>
            <div className="c-card p-4">
              <p className={`text-2xl font-bold ${colorCalificacion(promedio(respuestas))}`}>
                {formatCalificacion({ calificacion: promedio(respuestas) })}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Promedio del grupo</p>
            </div>
            {masFallada && (
              <div className="c-card p-4">
                <p className="truncate text-base font-bold text-[var(--text-primary)]" title={masFallada.texto}>
                  {masFallada.numero}. {masFallada.texto}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Más fallada · {masFallada.pct}% de aciertos
                </p>
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`min-h-11 shrink-0 border-b-2 px-3 py-2 text-sm font-semibold ${
                  tab === t.key
                    ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-secondary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'calificaciones' && (
            <div className="space-y-4">
              <section className="c-card p-5">
                <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Alumnos</h2>
                <div className="space-y-2">
                  {ranking.map((row) => (
                    <button
                      key={row.id_respuesta}
                      type="button"
                      onClick={() => setDetailRow(row)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-left"
                    >
                      <span className={`w-10 shrink-0 text-xl font-extrabold ${colorCalificacion(row.calificacion)}`}>
                        {formatCalificacion(row)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                          {row.nombre || 'Sin nombre'}
                        </span>
                        <span className="block truncate text-xs text-[var(--text-secondary)]">
                          {row.aciertos}/{row.total_preguntas} correctas · {formatFecha(row.creado)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="c-card p-5">
                <h2 className="mb-1 text-sm font-bold text-[var(--text-primary)]">Aciertos por pregunta</h2>
                <p className="mb-3 text-xs text-[var(--text-secondary)]">De la más fallada a la más acertada</p>
                <BarList
                  entries={statsPreguntas.map((s) => ({
                    id: s.id,
                    texto: `${s.numero}. ${s.texto}`,
                    count: s.pct,
                  }))}
                  color="var(--accent-primary)"
                />
              </section>

              <section className="c-card p-5">
                <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">Distribución de calificaciones</h2>
                <BarList
                  entries={distribucionCalificaciones(respuestas).filter((b) => b.count > 0)}
                  color="var(--accent-success)"
                />
              </section>
            </div>
          )}

          {tab === 'graficas' && (
            <div className="space-y-4">
              {preguntasOpciones.map((pregunta, i) => (
                <section key={pregunta.id} className="c-card p-5">
                  <h2 className="mb-1 text-sm font-bold text-[var(--text-primary)]">
                    {preguntas.indexOf(pregunta) + 1}. {pregunta.texto}
                  </h2>
                  <p className="mb-3 text-xs text-[var(--text-secondary)]">
                    {pregunta.tipo === 'unica' ? 'Selección única' : 'Selección múltiple'}
                  </p>
                  <BarList
                    entries={contarOpciones(respuestas, pregunta)}
                    color={i % 2 === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                  />
                </section>
              ))}
            </div>
          )}

          {tab === 'interactivo' && (
            <div className="space-y-4">
              {preguntasUnicas.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Este examen no tiene preguntas de selección única para comparar.
                </p>
              ) : (
                <>
                  <section className="c-card p-5">
                    {preguntasUnicas.length > 1 ? (
                      <div className="mb-3">
                        <label className="c-label" htmlFor="filtro-pregunta">
                          Comparar por
                        </label>
                        <select
                          id="filtro-pregunta"
                          className="c-input"
                          value={filtroPreguntaId}
                          onChange={(e) => {
                            setFiltroPreguntaId(e.target.value);
                            setFiltroOpcionId('');
                          }}
                        >
                          {preguntasUnicas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {preguntas.indexOf(p) + 1}. {p.texto}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
                        Comparar por: {preguntaFiltro?.texto}
                      </h2>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {opcionesFiltro.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setFiltroOpcionId(filtroOpcionId === o.id ? '' : o.id)}
                          className={`c-chip min-h-11 cursor-pointer ${filtroOpcionId === o.id ? 'font-bold' : ''}`}
                          data-accent={filtroOpcionId === o.id ? 'true' : undefined}
                        >
                          {o.correcta && <Check size={14} />} {o.texto} <span className="opacity-70">{o.count}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[var(--text-secondary)]">
                      {filtroOpcionId ? (
                        <>
                          Mostrando <b className="text-[var(--text-primary)]">{respuestasFiltradas.length}</b> de{' '}
                          {respuestas.length} respuestas
                        </>
                      ) : (
                        `Mostrando las ${respuestas.length} respuestas — toca una opción arriba para filtrar`
                      )}
                    </p>
                  </section>

                  {preguntasOpciones
                    .filter((p) => p.id !== preguntaFiltro?.id)
                    .map((pregunta, i) => (
                      <section key={pregunta.id} className="c-card p-5">
                        <h2 className="mb-3 text-sm font-bold text-[var(--text-primary)]">
                          {preguntas.indexOf(pregunta) + 1}. {pregunta.texto}
                        </h2>
                        <BarList
                          entries={contarOpciones(respuestasFiltradas, pregunta)}
                          color={i % 2 === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                        />
                      </section>
                    ))}
                </>
              )}
            </div>
          )}

          {tab === 'mapa' && (
            <section className="c-card p-5">
              <ExamenHeatmap preguntas={preguntas} respuestas={respuestas} />
            </section>
          )}

          {tab === 'respuestas' && (
            <section className="c-card p-5">
              <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">Respuestas</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <th className="px-2 py-2 font-semibold">Fecha</th>
                      <th className="px-2 py-2 font-semibold">Nombre</th>
                      <th className="px-2 py-2 font-semibold">Teléfono</th>
                      <th className="px-2 py-2 font-semibold">Aciertos</th>
                      <th className="px-2 py-2 font-semibold">Calificación</th>
                      <th className="px-2 py-2 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {respuestas.slice(0, visibleCount).map((row) => (
                      <tr key={row.id_respuesta} className="border-b border-[var(--border-subtle)]">
                        <td className="px-2 py-3 text-[var(--text-secondary)]">{formatFecha(row.creado)}</td>
                        <td className="px-2 py-3 text-[var(--text-primary)]">{row.nombre || '—'}</td>
                        <td className="px-2 py-3 text-[var(--text-primary)]">{row.telefono || '—'}</td>
                        <td className="px-2 py-3 text-[var(--text-secondary)]">
                          {row.aciertos}/{row.total_preguntas}
                        </td>
                        <td className={`px-2 py-3 font-bold ${colorCalificacion(row.calificacion)}`}>
                          {formatCalificacion(row)}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-xs"
                            onClick={() => setDetailRow(row)}
                          >
                            Ver todo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleCount < respuestas.length && (
                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      className="c-btn c-btn-ghost min-h-11 px-4 py-2 text-sm"
                      onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                    >
                      Cargar más ({respuestas.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {editOpen && (
        <ExamenFormModal
          examen={examen}
          hasRespuestas={hasRespuestas}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            load();
            reloadRespuestas();
          }}
        />
      )}

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Confirmar eliminación"
        footer={
          <>
            <button
              type="button"
              className="c-btn c-btn-ghost min-h-11"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="c-btn c-btn-danger min-h-11"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          ¿Eliminar <span className="font-semibold text-[var(--text-primary)]">«{examen.titulo}»</span>? Se
          borrarán también todas sus respuestas. Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleteRow)}
        onClose={() => !deletingRow && setDeleteRow(null)}
        title="Eliminar respuesta"
        footer={
          <>
            <button
              type="button"
              className="c-btn c-btn-ghost min-h-11"
              onClick={() => setDeleteRow(null)}
              disabled={deletingRow}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="c-btn c-btn-danger min-h-11"
              onClick={handleConfirmDeleteRow}
              disabled={deletingRow}
            >
              {deletingRow ? 'Eliminando…' : 'Eliminar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          ¿Eliminar la respuesta de{' '}
          <span className="font-semibold text-[var(--text-primary)]">{deleteRow?.nombre || 'sin nombre'}</span>?
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      {detailRow && !deleteRow && (
        <Modal
          open
          onClose={() => setDetailRow(null)}
          title="Detalle de respuesta"
          footer={
            <>
              <button
                type="button"
                className="c-btn c-btn-ghost px-4 py-2 text-sm"
                onClick={() => setDeleteRow(detailRow)}
              >
                <Trash2 size={16} /> Eliminar
              </button>
              <button type="button" className="c-btn px-4 py-2 text-sm" onClick={() => setDetailRow(null)}>
                Cerrar
              </button>
            </>
          }
        >
          <div className="mb-4 space-y-1 text-sm text-[var(--text-secondary)]">
            <p>Fecha: {formatFecha(detailRow.creado)}</p>
            <p>Nombre: {detailRow.nombre || '—'}</p>
            <p>Teléfono: {detailRow.telefono || '—'}</p>
            <p>
              Calificación:{' '}
              <span className={`font-bold ${colorCalificacion(detailRow.calificacion)}`}>
                {formatCalificacion(detailRow)}
              </span>{' '}
              ({detailRow.aciertos}/{detailRow.total_preguntas} correctas)
            </p>
          </div>
          <ul className="space-y-3">
            {resolveAnswerDetail(examen.preguntas, detailRow.respuestas_json, detailRow.resultados).map(
              (item, i) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.acerto ? 'bg-[var(--accent-success)]' : 'bg-red-500'
                    }`}
                  >
                    {item.acerto ? (
                      <Check className="h-3 w-3 stroke-[3] text-white" />
                    ) : (
                      <X className="h-3 w-3 stroke-[3] text-white" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {i + 1}. {item.texto}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.valor || 'Sin responder'}</p>
                    {!item.acerto && item.correcta && (
                      <p className="text-xs text-[var(--accent-success)]">Correcta: {item.correcta}</p>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        </Modal>
      )}
    </>
  );
};

export default ExamenDetallePage;
