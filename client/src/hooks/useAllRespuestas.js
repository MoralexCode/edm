import { useCallback, useEffect, useState } from 'react';
import { Examenes } from '../services/examenes';

/**
 * Trae TODAS las respuestas de un examen en una sola carga, para
 * alimentar en memoria las gráficas, el filtro, el mapa de calor y la
 * tabla — sin volver a pedir nada al servidor al cambiar de pestaña o
 * de filtro.
 */
export const useAllRespuestas = (id) => {
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Examenes.listRespuestas(id);
      setRespuestas(data.items || []);
    } catch (err) {
      setError(err);
      setRespuestas([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { respuestas, loading, error, reload: load };
};
