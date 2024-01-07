const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const port = 9000;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cors = require('cors')
require('dotenv').config();

app.use(cors());

const db = mysql.createConnection({
    host: process.env.SQLHOST,
    port: process.env.SQLPORT,
    user: process.env.SQLUSER,
    password: process.env.SQLPASSWORD,
    database: process.env.SQLDATABASE
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

app.post('/', upload.single('image'), (req, res) => {
    const nombre = req.body.nombre;
    const descripcion = req.body.descripcion;
    const imagen = req.file.buffer;
    const query = 'INSERT INTO curso (nombre, descripcion, img) VALUES (?, ?, ?)';
    db.query(query, [nombre, descripcion, imagen], (err, result) => {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            console.log('Datos insertados correctamente');
            res.status(200).json({ message: 'Datos insertados correctamente' });
        }
    });
});

app.get('/datos', (req, res) => {
    const query = 'SELECT * FROM curso';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener datos de la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            res.status(200).json(result);
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
