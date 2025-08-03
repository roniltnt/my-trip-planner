const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Trip = require('../models/Trip');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, location, type, route } = req.body;

    const newTrip = new Trip({
      userId: req.userId,
      name,
      description,
      location,
      type,
      route
    });

    await newTrip.save();
    res.status(201).json({ message: 'Trip saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trip' });
  }
});

// שליפת כל המסלולים של המשתמש המחובר
router.get('/', authMiddleware, async (req, res) => {
    try {
      const trips = await Trip.find({ userId: req.userId });
      res.json(trips);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });  

  // שליפת מסלול בודד לפי ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      res.json(trip);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch trip' });
    }
  });  

module.exports = router;