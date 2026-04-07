require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const contactHandler = require('./api/contact');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/contact', (req, res) => contactHandler(req, res));

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande.' });
  }
  res.status(500).json({ error: 'Erro interno.' });
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Portfolio rodando em http://localhost:${PORT}\n`);
});
