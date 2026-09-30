import mongoose from 'mongoose';

const RespuestaExamenSchema = new mongoose.Schema(
  {
    examen: { type: mongoose.Schema.Types.ObjectId, ref: 'Examen', required: true, index: true },
    nombre: { type: String, default: null },
    telefono: { type: String, default: null },
    respuestas_json: { type: mongoose.Schema.Types.Mixed, default: {} },
    // { [preguntaId]: true|false }
    resultados: { type: mongoose.Schema.Types.Mixed, default: {} },
    aciertos: { type: Number, default: 0 },
    total_preguntas: { type: Number, default: 0 },
    puntaje: { type: Number, default: 0 },
    puntaje_max: { type: Number, default: 0 },
    calificacion: { type: Number, default: 0 },
  },
  {
    collection: 'respuestas_examen',
    minimize: false,
    timestamps: { createdAt: 'creado', updatedAt: false },
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id_respuesta = String(ret._id);
        ret.id_examen = String(ret.examen);
        delete ret._id;
        delete ret.examen;
        return ret;
      },
    },
  }
);

export default mongoose.model('RespuestaExamen', RespuestaExamenSchema);
