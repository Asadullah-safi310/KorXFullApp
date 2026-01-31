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
const publicApartmentRoutes = require('./routes/public/apartmentRoutes');
const protectedPropertyRoutes = require('./routes/protected/propertyRoutes');
const protectedDealRoutes = require('./routes/protected/dealRoutes');
const protectedProfileRoutes = require('./routes/protected/profileRoutes');
const protectedApartmentRoutes = require('./routes/protected/apartmentRoutes');
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

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/public/properties', publicPropertyRoutes);
app.use('/api/public/users', publicUserRoutes);
app.use('/api/public/apartments', publicApartmentRoutes);
app.use('/api/properties', protect, protectedPropertyRoutes);
app.use('/api/deals', protect, protectedDealRoutes);
app.use('/api/profile', protect, protectedProfileRoutes);
app.use('/api/apartments', protect, protectedApartmentRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  // Health check - refreshed v4 - Final attempt at 404
  res.json({ message: 'Server is running - Apartment CRUD Fix v4' });
});

// 404 handler for API routes
app.use((req, res) => {
  if (req.url.startsWith('/api/')) {
    console.log(`404 at ${req.originalUrl} - ${req.method}`);
    return res.status(404).json({ 
      error: 'API route not found', 
      path: req.originalUrl, 
      method: req.method 
    });
  }
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const startServer = async () => {
  try {
    await initDB();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
