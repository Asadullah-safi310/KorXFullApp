const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { initDB } = require('./config/db');
require('./models');

// Route imports
const authRoutes = require('./routes/authRoutes');
const publicPropertyRoutes = require('./routes/public/propertyRoutes');
const publicUserRoutes = require('./routes/public/userRoutes');
const protectedPropertyRoutes = require('./routes/protected/propertyRoutes');
const protectedDealRoutes = require('./routes/protected/dealRoutes');
const protectedProfileRoutes = require('./routes/protected/profileRoutes');
const personRoutes = require('./routes/personRoutes');
const locationRoutes = require('./routes/locationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const path = require('path');

app.use(cors({
  origin: true, 
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initDB();

app.use('/api/auth', authRoutes);
app.use('/api/public/properties', publicPropertyRoutes);
app.use('/api/public/users', publicUserRoutes);
app.use('/api/properties', protect, protectedPropertyRoutes);
app.use('/api/deals', protect, protectedDealRoutes);
app.use('/api/profile', protect, protectedProfileRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
