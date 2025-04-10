const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8005;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/debug-visualizer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Debug Visualizer running on port ${PORT}`);
}); 