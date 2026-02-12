const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Neu: Mongoose importieren

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// MongoDB-Verbindung (ersetze mit deiner Connection-String)
mongoose.connect('mongodb://localhost:27017/mywebsite', { // Oder Atlas-URL
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB-Verbindungsfehler:', err));

// Schemas und Modelle definieren (wie in Tutorials)<grok-card data-id="7aa2e1" data-type="citation_card" data-plain-type="render_inline_citation" ></grok-card>
const uploadSchema = new mongoose.Schema({
    description: { type: String, default: 'Keine Beschreibung' },
    files: [String] // Array von Dateipfaden
});
const Upload = mongoose.model('Upload', uploadSchema);

const postSchema = new mongoose.Schema({
    user: { type: String, default: 'Anonym' },
    content: String
});
const Post = mongoose.model('Post', postSchema);

// Statische Dateien serven
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer-Konfiguration (unverändert)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Nur Bilder und Videos erlaubt!'));
    }
};
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: uploadFilter
});

// Routes (unverändert)
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/chat', (req, res) => res.sendFile(__dirname + '/chat.html'));
app.get('/forum', (req, res) => res.sendFile(__dirname + '/forum.html'));
app.get('/upload', (req, res) => res.sendFile(__dirname + '/upload.html'));

// API für Forum: Posts abrufen (nun aus DB)
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API für Forum: Post hinzufügen (in DB speichern)
app.use(express.json());
app.post('/api/posts', async (req, res) => {
    try {
        const newPost = new Post({ user: req.body.user || 'Anonym', content: req.body.content });
        await newPost.save();
        res.json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API für Uploads: Abrufen (aus DB)
app.get('/api/uploads', async (req, res) => {
    try {
        const uploads = await Upload.find();
        res.json(uploads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API für Uploads: Hochladen (Metadaten in DB speichern)
app.post('/api/upload', upload.array('files', 5), async (req, res) => {
    try {
        const description = req.body.description || 'Keine Beschreibung';
        const filePaths = req.files.map(file => '/uploads/' + file.filename);
        const newUpload = new Upload({ description, files: filePaths });
        await newUpload.save();
        res.json(newUpload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// WebSocket für Chat (unverändert)
wss.on('connection', (ws) => {
    console.log('Neuer Chat-Client verbunden');
    ws.on('message', (message) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});