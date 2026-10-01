import mongoose from 'mongoose';

// Emoji (texto) o imagen (URL pública en Cloudflare R2).
const MediaSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['emoji', 'imagen'], required: true },
    valor: { type: String, required: true },
  },
  { _id: false }
);

const OpcionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    texto: { type: String, required: true },
    media: { type: MediaSchema, default: null },
  },
  { _id: false }
);

const PreguntaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    texto: { type: String, required: true },
    media: { type: MediaSchema, default: null },
    tipo: { type: String, enum: ['unica', 'multiple'], default: 'unica' },
    requerida: { type: Boolean, default: true },
    max_selecciones: { type: Number },
    puntos: { type: Number, default: 1 },
    opciones: { type: [OpcionSchema], default: [] },
    // Clave de respuestas: nunca se envía en la API pública.
    correctas: { type: [String], default: [] },
  },
  { _id: false }
);

const ExamenSchema = new mongoose.Schema(
  {
    libro_slug: { type: String, required: true, trim: true, lowercase: true },
    libro_titulo: { type: String, trim: true },
    sesion: { type: Number, required: true },
    titulo: { type: String, required: true, trim: true },
    subtitulo: { type: String, default: null },
    descripcion: { type: String, default: null },
    imagen_url: { type: String, default: null },
    preguntas: { type: [PreguntaSchema], default: [] },
    activo: { type: Boolean, default: true },
    mostrar_calificacion: { type: Boolean, default: true },
    pedir_nombre: { type: Boolean, default: true },
    nombre_requerido: { type: Boolean, default: true },
    pedir_telefono: { type: Boolean, default: false },
    telefono_requerido: { type: Boolean, default: false },
  },
  {
    collection: 'examenes',
    timestamps: { createdAt: 'creado', updatedAt: 'modificado' },
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id_examen = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

ExamenSchema.index({ libro_slug: 1, sesion: 1 }, { unique: true });

export default mongoose.model('Examen', ExamenSchema);
