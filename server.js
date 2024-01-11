const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const port = 9000;
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cors = require('cors')
const uuid = require('uuid');
require('dotenv').config();

app.use(cors());

const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);        
        process.exit(1);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});


//EndPoint of Certificate
app.post('/saved/certificate', upload.single('image'), (req, res) => {
    const idImg = uuid.v4();
    const imagen = req.file.buffer;
    const nombreImg = req.file.originalname;
    db.query('INSERT INTO Imagen (ID, nombre, img) VALUES (?,?,?)', [idImg, nombreImg, imagen], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'No se ha guardado la imagen' })
        }
    });

    const id = uuid.v4();
    const nombre = req.body.nombre;
    const descripcion = req.body.descripcion;
    const query = 'INSERT INTO Certificado (ID, nombre, descripcion, img) VALUES (?, ?, ?, ?)';
    db.query(query, [id, nombre, descripcion, idImg], (err, result) => {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            console.log('Datos insertados correctamente');
            res.status(200).json({ message: 'Datos insertados correctamente' });
        }
    });
});

app.get('/get/certificate', (req, res) => {
    console.log("Conectado");
    const query = 'select C.ID, C.nombre, C.descripcion, I.img from Certificado as C, Imagen as I where C.img = I.ID;';
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener datos de la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {            
            res.status(200).json(result);
        }
    });
});

//EndPoint Projects
app.post('/saved/project', upload.fields([
    { name: 'file1', maxCount: 1 },
    { name: 'file2', maxCount: 1 },
    { name: 'file3', maxCount: 1 },
    { name: 'file4', maxCount: 1 },    
]), (req, res) => {
    const file1 = req.files['file1'][0];
    const file2 = req.files['file2'][0];
    const file3 = req.files['file3'][0];
    const file4 = req.files['file4'][0];    
    const files = [file1, file2, file3, file4];

    let promises = [];

    const IDProject = uuid.v4();
    const nombre = req.body.nombre;
    const descripcionBreve = req.body.descripcionBreve;
    const descripcionLarga = req.body.descripcionLarga;
    const tecnologia = req.body.tecnologia;
    const url = req.body.url;    

    let IDs = [];

    files.forEach((file) => {
        const id = uuid.v4();
        const query = "INSERT INTO Imagen (ID, nombre, img) VALUES (?, ?, ?)";
        const promise = new Promise((resolve, reject) => {
            db.query(query, [id, file.originalname, file.buffer], (err, result) => {
                if (err) {
                    console.log("No se ha guardado la imagen");
                    reject(err);
                } else {                    
                    IDs.push(id);
                    resolve();
                }
            });
        });
        promises.push(promise);
    });

    console.log(IDs);    

    db.query('INSERT INTO Proyecto (id, nombre, descripcionBreve, descripcionLarga, tecnologia, urlTexto) VALUES (?, ?, ?, ?, ?, ?)', [IDProject, nombre, descripcionBreve, descripcionLarga, tecnologia, url], (err, result) => {
        if(err){
            console.log("Error al guardar el proyecto", err);
        }        
    })

    Promise.all(promises)
        .then(() => {
            
            IDs.forEach((ID)=>{
                const idN = uuid.v4();
                db.query('INSERT INTO ImgProyecto (ID, IDProyecto, IDImagen) VALUES (?, ?, ?)', [idN, IDProject, ID], (err, result)=>{
                    if(err){
                        res.status(500).json({ message: 'Error al guardar en ImgProyecto' });
                    }
                });
            })
            
            res.status(200).json({ message: 'Datos y archivos recibidos con éxito' });
        })
        .catch((error) => {
            console.error("Error al guardar las imágenes:", error);
            res.status(500).json({ error: 'Error interno del servidor' });
        });


});

app.get('/get/projects', (req, res) => {
    const datas = [];
    const query = 'select * from Proyecto';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener datos de la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            results.map((result)=>{
                datas.push(result);
            })
            res.send(datas);
        }
    });
})

app.get('/get/project/:id', (req, res) => {
    const IDImagenes = [];
    const ID = req.params.id;
    const query = 'select * from ImgProyecto where IDProyecto = ?';
    db.query(query, [ID], (err, results) => {
        if (err) {
            console.error('Error al obtener datos de la base de datos:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            results.map((result)=>{
                IDImagenes.push(result);
            })
            res.send(IDImagenes);
        }
    });
})


app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
