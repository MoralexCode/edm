/**
 * Carga los 7 ejercicios de reafirmación del libro "¿Quién es Jesús?".
 *
 *   npm run seed:quien-es-jesus            → crea sólo los que no existen
 *   npm run seed:quien-es-jesus -- --force → sobrescribe preguntas de los existentes
 *
 * La clave (letra correcta) es una PROPUESTA: los PDF de alumnos no la traen.
 * Verifícala en el panel (Editar → marcar correcta) antes de aplicar el examen.
 */
import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import Examen from '../models/Examen.js';

const LIBRO_SLUG = 'quien-es-jesus';
const LIBRO_TITULO = '¿Quién es Jesús?';

// [pregunta, [A, B, C], letraCorrecta]
const SESIONES = {
  1: [
    ['¿Qué es lo que causó la separación de Dios con la humanidad?', ['La obediencia.', 'El pecado.', 'La distancia física del cielo a la Tierra.'], 'B'],
    ['¿Quién es el que vino a quitar la división, la destitución y la separación de Dios con el hombre por causa del pecado?', ['Los discípulos.', 'Adán y Eva.', 'Jesucristo.'], 'C'],
    ['¿Quién es el único camino para poder llegar al Padre?', ['La iglesia.', 'Los pastores.', 'Jesucristo/Jesús.'], 'C'],
    ['¿Quién es el que nos revela a Jesús como el Hijo de Dios?', ['Dios Padre.', 'Los pastores.', 'Los discípulos.'], 'A'],
    ['¿Qué necesitamos para poder entrar y disfrutar del Reino de Dios?', ['Recibir las llaves del conocimiento de la Palabra de Dios.', 'Necesitamos tener valores.', 'Necesitamos tener buenos sentimientos.'], 'A'],
    ['Cuando una persona ora, los ángeles suben y descienden a la Tierra y ejecutan la Palabra de Dios cuando se hace en el nombre de...?', ['Un santo.', 'Cristo Jesús.', 'De una persona de gran influencia.'], 'B'],
    ['Él es la escalera que une el cielo con la Tierra.', ['Jesucristo.', 'Los ángeles.', 'Los querubines.'], 'A'],
    ['¿Qué se necesita para poder disfrutar más de la herencia de nuestro Padre como consecuencia de ser hijos?', ['Tener más tiempo congregándose en la iglesia.', 'Aprenderse muy bien la Biblia.', 'Crecer y ser maduros en la fe.'], 'C'],
    ['Así como nuestro Señor Jesucristo, nosotros también, como hijos de Dios, tenemos que crecer en...', ['Inteligencia.', 'Conocimiento natural.', 'Sabiduría, estatura y gracia.'], 'C'],
    ['¿Por qué una persona que anda en tinieblas no sabe a dónde va?', ['Porque las tinieblas le han cegado los ojos.', 'Porque se siente a gusto en sus circunstancias.', 'Porque está disfrutando de su manera de vivir.'], 'A'],
  ],
  2: [
    ['¿Cuáles son las acciones espirituales con las que podemos acceder a esa ciudad celestial, por las cuales tenemos acceso como hijos de Dios?', ['Realizando buenas obras.', 'La oración y la alabanza.', 'Manteniendo una vida correcta.'], 'B'],
    ['¿Quién es el que ha traído el Reino inconmovible de Dios a nosotros?', ['Jesucristo.', 'Los discípulos.', 'Los ángeles.'], 'A'],
    ['¿Cuándo nos encontramos con el Reino inconmovible de Dios?', ['Cuando participamos en obras de caridad.', 'Cuando nos compadecemos del necesitado.', 'Cuando nos arrepentimos y creemos en el evangelio del Reino.'], 'C'],
    ['¿Cómo sabemos que estamos edificando nuestra casa, nuestro refugio, sobre Jesucristo, que es la roca?', ['Cuando oímos la Palabra de Dios.', 'Cuando oímos y obedecemos la Palabra de Dios.', 'Cuando tenemos fe.'], 'B'],
    ['¿Qué significa que una persona está cavando?', ['Aquella persona que oye la Palabra.', 'Aquella persona que oye la Palabra y la hace.', 'Aquella persona que aprende la Palabra.'], 'B'],
    ['¿Qué representa la arena que sacamos al cavar?', ['Lo terrenal y lo mundano.', 'Las costumbres.', 'Los buenos hábitos.'], 'A'],
    ['¿En qué consiste el arrepentimiento?', ['Cambiar nuestra manera de pensar por la manera de pensar de Dios.', 'Es llorar con sinceridad.', 'Es pedir disculpas.'], 'A'],
    ['Es la manera de actuar de una persona que tiene una independencia con Dios.', ['Es aquella persona que busca el consejo de Dios.', 'Aquella persona que busca la dirección de Dios.', 'Es el hombre diciendo a Dios: «Puedo ser bueno aun sin conocerte y viviendo sin redención».'], 'C'],
    ['¿Qué es la casa?', ['Es un lugar que visitamos.', 'Es un hogar, un lugar de reposo, un lugar donde hay alimento, protección y refugio.', 'Es el lugar donde podemos vivir.'], 'B'],
    ['¿Quién es el mediador del nuevo pacto?', ['Jesucristo.', 'Los discípulos.', 'Los pastores.'], 'A'],
  ],
  3: [
    ['¿Estos son los atributos del carácter de Dios manifestados en Cristo Jesús?', ['Dios es severo, duro, que reprocha, vengativo y castigador.', 'Dios es amor, luz, omnipotente, omnisciente, omnipresente.', 'Dios es bueno y misericordioso.'], 'B'],
    ['Lo que le impidió al pueblo de Israel recibir al Señor Jesucristo fue…', ['Que fueron envueltos en un espíritu de sabiduría.', 'Que fueron envueltos en un espíritu de revelación.', 'Que fueron envueltos en un espíritu de estupor que les impidió reconocer la obra de gracia que el Señor venía a hacer.'], 'C'],
    ['¿Quién es la cabeza de la iglesia?', ['El apóstol Pedro.', 'Nuestro Señor Jesucristo.', 'El pastor de la iglesia.'], 'B'],
    ['¿Quién te eligió para ser parte de la iglesia del Señor Jesucristo?', ['Tus padres.', 'Dios.', 'El pastor de mi iglesia.'], 'B'],
    ['En Juan 15:5 dice que separados de Cristo Jesús…', ['Nada podemos hacer.', 'Haremos grandes proezas.', 'Todo lo podremos hacer sin Él.'], 'A'],
    ['Según Juan 15:5, ¿qué debemos hacer para dar abundante fruto?', ['Permanecer injertado en Jesús.', 'Seguir nuestras propias metas.', 'Hacer buenas obras sin depender de Cristo.'], 'A'],
    ['El deseo de Dios es manifestar su amor y su poder a través de…', ['Sus hijos.', 'Los ángeles solamente.', 'El mundo.'], 'A'],
    ['¿Cuál es el principal fruto que Dios quiere que sea mostrado en nuestra vida?', ['Su amor.', 'Su poder.', 'Su humildad.'], 'A'],
    ['Dios no nos escogió por sabios ni por inteligentes o prósperos y exitosos, sino porque…', ['Teníamos una gran necesidad de Dios.', 'Éramos los más fuertes y valientes.', 'Por ser personas con talentos muy especiales.'], 'A'],
    ['¿Por qué Jesús tenía que mostrarse a los hombres como hombre y no como Dios?', ['Porque los hombres sólo podemos ver lo terrenal y lo mundano.', 'Porque los hombres pueden comprender fácilmente las cosas divinas.', 'Porque no era necesario que se hiciera semejante a nosotros.'], 'A'],
  ],
  4: [
    ['Cuando somos injertados en Cristo Jesús, de inmediato se produce fruto. Este fruto es:', ['Buenas obras y servicio constante.', 'Arrepentimiento y fe.', 'Conocimiento y fama espiritual.'], 'B'],
    ['El término permanecer se traduce también como:', ['Durar, persistir, perdurable, perseverar, gozar, retener y vivir.', 'Estar quieto y no cambiar.', 'Guardar silencio y esperar.'], 'A'],
    ['Es la obra que actúa sobre una persona, funcionando como una armadura que cubre la mente, los ojos, los oídos, el olfato y la boca:', ['La unción.', 'La sabiduría humana.', 'La disciplina espiritual.'], 'A'],
    ['Es el poder interno de Dios en nosotros que nos libra del poder del pecado:', ['La revelación.', 'La gracia.', 'La fortaleza mental.'], 'B'],
    ['¿Cuál es el precio que se pagó para ser rescatados (redimidos) del pecado?', ['30 monedas de plata.', 'El sacrificio de los machos cabríos.', 'La sangre de Cristo Jesús.'], 'C'],
    ['¿Cuál es la acción que permite que se active el poder de la gracia y la unción sobre nuestra vida?', ['Cuando oramos en el Nombre de Jesús.', 'Cuando hacemos buenas obras.', 'Cuando nos esforzamos con nuestras propias fuerzas.'], 'A'],
    ['¿Por qué motivo Nuestro Señor Jesucristo quedó sin la cobertura de Dios?', ['Por causa del pecado de la humanidad sobre Él.', 'Porque fue abandonado por sus discípulos.', 'Porque su fe se debilitó.'], 'A'],
    ['¿De qué hemos sido salvos?', ['De las pruebas y dificultades.', 'Del pecado.', 'De la enfermedad física.'], 'B'],
    ['¿Qué le permitió a Nuestro Señor Jesucristo ser obediente y fiel hasta la muerte?', ['El ser lleno de gracia.', 'Su sabiduría natural.', 'El apoyo de las multitudes.'], 'A'],
    ['¿Quién es la respuesta para una persona cuya alma es movida por el pecado?', ['Un consejero espiritual.', 'Jesucristo.', 'Un terapeuta emocional.'], 'B'],
  ],
  5: [
    ['¿Cómo le llama la Biblia a las personas que no conocen de Dios y que viven siguiendo las corrientes de este mundo?', ['Hijos de desobediencia.', 'Personas con libre pensamiento.', 'Hijos de honra, hijos con temor de Dios.'], 'A'],
    ['¿Quién es el que gobierna detrás de los vientos del pecado?', ['El corazón humano.', 'El diablo.', 'La voluntad del hombre.'], 'B'],
    ['¿Cuándo son quitados los vientos del diablo y se suelta el viento de Dios sobre una persona?', ['Ocurre cuando alguien ora.', 'Ocurre cuando una persona hace una buena obra.', 'Ocurre cuando una persona actúa obviamente en su entendimiento.'], 'A'],
    ['¿Qué es lo que necesita hacer primeramente una persona que se encuentra dormida para tomarse de la mano del Señor Jesucristo?', ['Primero debe despertar.', 'Primero debe esperar en quietud.', 'Primero debe mantenerse en comodidad.'], 'A'],
    ['¿Quién es el único que puede resolver los problemas del pecado y espirituales en una persona?', ['La psicología.', 'Solo Dios lo puede hacer.', 'La ciencia.'], 'B'],
    ['¿Quién o quiénes son hijos de Dios?', ['Todas las personas por el simple hecho de existir.', 'Las personas que han creído y recibido al Señor Jesucristo como su Señor y Salvador.', 'Las personas que hacen buenas obras.'], 'B'],
    ['¿En qué momento permitimos las fuerzas de Dios en nuestra vida?', ['Cuando decidimos seguir nuestros propios planes.', 'Cuando las fuerzas humanas se acaban.', 'Cuando nos esforzamos al máximo por cumplir nuestros propios objetivos.'], 'B'],
    ['¿Qué representa estar en el nido?', ['Estar en las respuestas del hombre.', 'Estar bajo el cuidado y dirección de Dios.', 'Estar sensibles a la guianza de Dios.'], 'B'],
    ['¿Qué es arrepentimiento?', ['Es dejar nuestra manera de pensar y aceptar la manera de pensar de Dios.', 'Es llorar amargamente.', 'Es ya no volver a cometer ninguna falla.'], 'A'],
    ['¿Qué es la fe de acuerdo a la explicación del libro en esta lección?', ['Es aceptar como ciertos, únicos y verdaderos los pensamientos de Dios.', 'Es ver en el momento que queremos que sucedan las cosas.', 'Es confiar en Dios cuando vemos sus respuestas.'], 'A'],
  ],
  6: [
    ['¿Cómo se manifiesta el poder de Dios en esta tierra?', ['Al postrarse y rezar.', 'Al declarar el nombre de Cristo Jesús.', 'Al creer que Dios es milagroso.'], 'B'],
    ['¿A través de quién viene a manifestarse el poder de Dios al invocar el Nombre de Jesús?', ['A través de la presencia del Espíritu Santo.', 'A través de la presencia de un sacerdote.', 'A través de la presencia física de un pastor.'], 'A'],
    ['Por este hombre vino la separación entre Dios y la humanidad…', ['Por los religiosos.', 'Por los maestros de la ley.', 'Por Adán.'], 'C'],
    ['¿Qué es lo que se inició por la obediencia de Jesús al ser justo?', ['Se inició un nuevo nacimiento.', 'Se inició un nuevo tiempo.', 'Se inició un nuevo mundo.'], 'A'],
    ['¿Por qué no cualquier persona podía salvar a la humanidad?', ['Porque tenía que ser concebido por una virgen.', 'Porque tenía que ser la descendencia del pueblo de Israel.', 'Porque hay características morales, espirituales y físicas que debía tener el Salvador.'], 'C'],
    ['¿Por qué era necesario que Nuestro Señor Jesucristo viniera como hombre para ejercer su llamado de sacerdote?', ['Para experimentar en sí mismo la incapacidad humana para agradar a Dios y solicitar la gracia ante Él.', 'Para prepararse en su ministerio.', 'Para conocer de cerca a la humanidad.'], 'A'],
    ['¿En dónde está Nuestro Señor Jesucristo?', ['Está en la tierra.', 'Está a la diestra de Dios, sentado en lugares celestiales.', 'Está en todo lugar.'], 'B'],
    ['¿Qué está haciendo Nuestro Señor Jesucristo?', ['Intercediendo por nosotros.', 'Disfrutando de su Reino.', 'No lo ha revelado.'], 'A'],
    ['¿Cómo conocimos a Jesús en esta lección?', ['Como Jesús mi roca.', 'Como nuestro sacerdote eterno.', 'Como la vid verdadera.'], 'B'],
    ['¿Cuáles son las virtudes que Dios dio a Jesús para constituirlo un sacerdote eterno para nosotros?', ['Santo, inocente, sin mancha, apartado de los pecadores y hecho más sublime que los cielos.', 'Omnipotente, omnipresente y omnisciente.', 'Manso y humilde.'], 'A'],
  ],
  7: [
    ['¿De quién es el llamado para ser sacerdote de Dios?', ['Es un llamado por Dios.', 'Es un llamado de los apóstoles.', 'Es un llamado de un pastor.'], 'A'],
    ['“Un Hijo nos es dado” significa…', ['Que Jesús es nacido de la virgen María.', 'Que Jesús es Dios y también es hombre.', 'Que Jesús es el Hijo de Dios.'], 'B'],
    ['¿Cuál es una de las diferencias entre el sacerdocio del antiguo testamento y el sacerdocio de Jesús?', ['El sacerdocio de Jesús es para siempre.', 'El sacerdocio de Aarón es perpetuo.', 'Que sus funciones eran totalmente diferentes.'], 'A'],
    ['¿Qué sucedía con el sumo sacerdote en el antiguo testamento cuando entraba al lugar santísimo sin ser llamado?', ['Moría.', 'Era lleno de la presencia de Dios.', 'Era santificado.'], 'A'],
    ['¿Cuál es la diferencia entre un esclavo y un hijo sobre su casa?', ['Que el hijo no permanece y el esclavo sí permanece.', 'Que el esclavo no permanece en casa para siempre y el hijo sí permanece.', 'Que ambos no permanecen.'], 'B'],
    ['¿Qué significa “Hijo de Dios”?', ['Es ser igual a Dios con todos los atributos que corresponden a Dios.', 'Es ser igual a los hombres en sus virtudes y debilidades.', 'Es ser igual a Dios, pero con los límites que tiene un hombre.'], 'A'],
    ['¿Cuál fue el motivo por el cual los judíos procuraban matar a Jesús?', ['Porque tenía muchos seguidores.', 'Porque Jesús hacía milagros en el día de descanso.', 'Porque decía que Dios era su propio Padre.'], 'C'],
    ['¿Por qué pudieron matar a Jesús?', ['Él dio su vida; nadie se la quitó.', 'Porque sus discípulos lo abandonaron.', 'Porque se quedó sin la cobertura de Dios.'], 'C'],
    ['¿Cómo demostró Jesús que era el Hijo de Dios?', ['Cuando Jesús fue clavado en la cruz.', 'Cuando Jesús resucitó.', 'Cuando Jesús se despojó de ser Dios.'], 'B'],
    ['¿Cuál es el fruto del nuevo pacto?', ['Abrogar la ley.', 'La sabiduría.', 'La Gracia.'], 'C'],
  ],
};

const LETRAS = ['A', 'B', 'C', 'D'];

const buildPreguntas = (items) =>
  items.map(([texto, opciones, correcta]) => {
    const ops = opciones.map((t) => ({ id: crypto.randomUUID(), texto: t }));
    return {
      id: crypto.randomUUID(),
      texto,
      tipo: 'unica',
      requerida: true,
      puntos: 1,
      opciones: ops,
      correctas: [ops[LETRAS.indexOf(correcta)].id],
    };
  });

const force = process.argv.includes('--force');

await connectDb();

for (const [sesion, items] of Object.entries(SESIONES)) {
  const filtro = { libro_slug: LIBRO_SLUG, sesion: Number(sesion) };
  const existente = await Examen.findOne(filtro);
  if (existente && !force) {
    console.log(`Sesión ${sesion}: ya existe, se omite (usa --force para sobrescribir)`);
    continue;
  }
  const data = {
    ...filtro,
    libro_titulo: LIBRO_TITULO,
    titulo: `Sesión ${sesion}`,
    subtitulo: `Ejercicio de reafirmación · Libro: ${LIBRO_TITULO}`,
    descripcion: 'Instrucciones: selecciona la respuesta correcta.',
    preguntas: buildPreguntas(items),
  };
  if (existente) {
    existente.set(data);
    await existente.save();
    console.log(`Sesión ${sesion}: actualizada`);
  } else {
    await Examen.create(data);
    console.log(`Sesión ${sesion}: creada`);
  }
}

await mongoose.disconnect();
