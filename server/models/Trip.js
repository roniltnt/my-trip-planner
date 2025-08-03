const mongoose = require('mongoose');
const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String, required: true }, // עיר/מדינה
  type: { type: String, enum: ['hike', 'bike'], required: true },
  route: [
    {
      day: Number,
      distanceKm: Number,
      points: [
        {
          lat: Number,
          lng: Number,
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', tripSchema);
