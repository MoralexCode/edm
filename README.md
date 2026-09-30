# EDM — Exámenes (ejercicios de reafirmación)

MVP para aplicar los ejercicios de reafirmación en línea. Es una copia del módulo
**Encuestas** del proyecto *comunidad* (mismos estilos, tokens y componentes),
convertido a **preguntas de opción múltiple con calificación** y usando **MongoDB**.

> MVP sin login, sin rate limit y sin permisos: el panel `/admin/examenes` es público.

- `client/` — React 19 + Vite + Tailwind 4 (copiado de comunidad).
- `server/` — Express 5 + Mongoose. En producción también sirve `client/dist`.

## URLs

| Quién | URL |
|---|---|
| Alumno | `https://edm.moralexcode.com/{libro}/{sesion}` — ej. `/quien-es-jesus/1` |
| Admin | `https://edm.moralexcode.com/admin/examenes` |

## Correr en local

```bash
# 1. API
cd server
cp .env.example .env        # pon tu MONGODB_URI de Atlas
npm install
npm run seed:quien-es-jesus # carga las 7 sesiones de "¿Quién es Jesús?"
npm run dev                 # http://localhost:3023

# 2. Cliente (otra terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxy /api → 3023)
```

## Poner en línea (un solo proceso Node)

```bash
cd client && npm install && npm run build   # genera client/dist
cd ../server && npm install && npm start    # sirve API + client/dist en :3023
```

Nginx para `edm.moralexcode.com` (todo al proceso Node):

```nginx
server {
    server_name edm.moralexcode.com;
    location / {
        proxy_pass http://127.0.0.1:3023;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Luego `certbot --nginx -d edm.moralexcode.com` y `pm2 start src/edm-api.js --name edm-api` dentro de `server/`.

## Calificación

- Se califica **en el servidor**; la API pública nunca envía las respuestas correctas.
- Pregunta acertada = lo seleccionado coincide exactamente con las correctas.
- Calificación = puntos obtenidos / puntos posibles × 10 (un decimal).
- Si "Mostrar calificación al alumno" está activo, al enviar ve su calificación y qué
  preguntas acertó (sin revelar la respuesta correcta).

## Seed de "¿Quién es Jesús?"

`server/src/scripts/seed-quien-es-jesus.js` trae las 7 sesiones transcritas de los PDF.
Los PDF son la versión de alumnos (sin clave), así que **la clave es una propuesta**:
revísala en el panel (Editar → marcar "Correcta") antes de aplicar el examen.
`--force` sobrescribe los exámenes existentes.

## Importar preguntas (botón RAW)

En el builder, "RAW" acepta el formato de los PDF; marca la correcta con `*`:

```
1.- ¿Quién es el único camino para poder llegar al Padre?
A) La iglesia. B) Los pastores. *C) Jesucristo.
```
