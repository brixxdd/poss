const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/auth/register', (req, res) => {
    console.log('✅ RECIBÍ LA PETICIÓN!');
    console.log('Body:', req.body);
    res.json({ message: 'Test OK' });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Test server running on port 3000');
});