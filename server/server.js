const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Trip Planner API is running.");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch(err => console.error("❌ DB connection error:", err));
