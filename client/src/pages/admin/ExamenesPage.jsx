import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardCheck, ChevronRight } from 'lucide-react';
import AppHeader from '../../components/layout/AppHeader';
import ExamenFormModal from '../../components/examenes/ExamenFormModal';
import { Loading, EmptyState } from '../../components/ui/States';
import { Examenes } from '../../services/examenes';

const ExamenesPage = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    Examenes.list()
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const porLibro = useMemo(() => {
    const map = new Map();
    items.forEach((e) => {
      const key = e.libro_slug;
      if (!map.has(key)) map.set(key, { titulo: e.libro_titulo || e.libro_slug, items: [] });
      map.get(key).items.push(e);
    });
    return [...map.values()];
  }, [items]);

  return (
    <>
      <AppHeader title="Exámenes" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-secondary)]">
          Crea exámenes, genera QR y revisa calificaciones.
        </p>
        <button type="button" className="c-btn min-h-11 px-4 py-2 text-sm" onClick={() => setOpen(true)}>
          <Plus size={16} /> Crear examen
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState title="Sin exámenes" description="Crea tu primer examen." />
      ) : (
        <div className="space-y-6">
          {porLibro.map((libro) => (
            <section key={libro.titulo}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                {libro.titulo}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {libro.items.map((e) => (
                  <Link
                    key={e.id_examen}
                    to={`/admin/examenes/${e.id_examen}`}
                    className="c-card flex items-center gap-3 p-4"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-[var(--text-on-accent-primary)]">
                      <ClipboardCheck size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[var(--text-primary)]">{e.titulo}</p>
                      <p className="truncate text-xs text-[var(--text-secondary)]">
                        {e.activo ? 'Activo' : 'Cerrado'}
                        {Array.isArray(e.preguntas) ? ` · ${e.preguntas.length} preguntas` : ''}
                        {` · ${e.total_respuestas || 0} respuestas`}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-[var(--text-secondary)]" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && (
        <ExamenFormModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            reload();
          }}
        />
      )}
    </>
  );
};

export default ExamenesPage;
