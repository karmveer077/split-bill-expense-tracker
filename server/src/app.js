const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

const corsOptions = {
   origin: process.env.CLIENT_URL || 'http://localhost:5173',
   optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Public health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is reachable and healthy.' });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
