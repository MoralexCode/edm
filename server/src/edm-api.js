import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';

const PORT = Number(process.env.PORT) || 3023;

await connectDb();
app.listen(PORT, () => console.log(`EDM API escuchando en http://localhost:${PORT}`));
