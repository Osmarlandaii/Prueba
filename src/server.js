const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API corriendo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});

module.exports = app;
