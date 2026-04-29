const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./utils/db');
const authRoutes = require('./routes/auth');
const growthTreeRoutes = require('./routes/growthTree');
const recordRoutes = require('./routes/records');
const goalRoutes = require('./routes/goals');
const reminderRoutes = require('./routes/reminders');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/growth-trees', growthTreeRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'GrowthOS API Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Database initialized: ${process.cwd()}/growthos.db`);
});