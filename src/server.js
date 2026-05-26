const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { verifyJWT } = require('./middleware/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

// /auth — público (login, register)
app.use('/auth', authRoutes);

// /products — público (lectura)
app.use('/products', productRoutes);

// /users y /files — protegidos con JWT a nivel de router (cada ruta aplica verifyJWT internamente)
app.use('/users', userRoutes);
app.use('/files', fileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API corriendo' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});

module.exports = app;
