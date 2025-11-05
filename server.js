// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const admin = require('firebase-admin');
// const axios = require('axios');
// const path = require('path');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('public'));

// // Firebase Admin Init
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// // MongoDB Connect
// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.error(err));

// // === SCHEMAS ===
// const CarAvg = mongoose.model('CarAvg', new mongoose.Schema({
//   brand: String,
//   avgMonthlyCost: Number
// }));

// const Car = mongoose.model('Car', new mongoose.Schema({
//   model: String,
//   fuelType: String,
//   mileage: Number,
//   year: Number,
//   transmission: String,
//   price: Number,
//   city: String
// }));

// const User = mongoose.model('User', new mongoose.Schema({
//   email: String,
//   referralCode: String,
//   referredBy: String,
//   points: { type: Number, default: 0 }
// }));

// // === SEED DATA ===
// async function seed() {
//   await CarAvg.deleteMany({});
//   await CarAvg.insertMany([
//     { brand: 'Toyota', avgMonthlyCost: 500 },
//     { brand: 'Honda', avgMonthlyCost: 600 },
//     { brand: 'Ford', avgMonthlyCost: 800 }
//   ]);

//   await Car.deleteMany({});
//   await Car.insertMany([
//     { model: 'Toyota Camry', fuelType: 'Petrol', mileage: 15, year: 2020, transmission: 'Auto', price: 15000, city: 'Delhi' },
//     { model: 'Honda City', fuelType: 'Petrol', mileage: 18, year: 2019, transmission: 'Manual', price: 10000, city: 'Mumbai' },
//     { model: 'Ford EcoSport', fuelType: 'Diesel', mileage: 22, year: 2018, transmission: 'Manual', price: 8000, city: 'Delhi' },
//     { model: 'Toyota Innova', fuelType: 'Diesel', mileage: 13, year: 2021, transmission: 'Auto', price: 20000, city: 'Bangalore' }
//   ]);
// }
// seed();

// // === APIs ===

// // 1. Maintenance Estimator
// app.post('/api/estimate-maintenance', async (req, res) => {
//   const { age, km, brand } = req.body;
//   const avg = await CarAvg.findOne({ brand });
//   if (!avg) return res.status(404).json({ error: 'Brand not found' });

//   let multiplier = 1;
//   if (age > 5) multiplier += 0.5;
//   if (km > 80000) multiplier += 0.5;
//   const estimatedCost = Math.round(avg.avgMonthlyCost * multiplier);

//   let insights = [];
//   if (km > 60000) insights.push('Next major service due in ~4,000 km');
//   if (km % 40000 < 5000) insights.push('Expected tire replacement soon');

//   const tag = estimatedCost > 700 ? 'High Maintenance Expected' : 'Low Maintenance';
//   res.json({ tag, estimatedCost, insights });
// });

// // 2. Push Notification
// app.post('/api/send-notification', async (req, res) => {
//   const { token, title, body } = req.body;
//   try {
//     await admin.messaging().send({ token, notification: { title, body } });
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 3. Pricing Engine
// app.post('/api/price-adjust', (req, res) => {
//   const { basePrice, carType, region, season } = req.body;
//   let multiplier = 1;

//   if (season === 'monsoon' && carType === 'SUV') multiplier += 0.1;
//   if (region === 'metro' && carType === 'hatchback') multiplier -= 0.05;

//   const recommended = Math.round(basePrice * multiplier);
//   res.json({ recommended, multiplier: multiplier.toFixed(2) });
// });

// // 4. Search with Filters & Scoring
// app.get('/api/search', async (req, res) => {
//   const { query, fuelType, mileageMin, yearMin, transmission } = req.query;
//   let filter = {};
//   if (query) filter.model = { $regex: query, $options: 'i' };
//   if (fuelType && fuelType !== 'All') filter.fuelType = fuelType;
//   if (mileageMin) filter.mileage = { $gte: parseInt(mileageMin) };
//   if (yearMin) filter.year = { $gte: parseInt(yearMin) };
//   if (transmission && transmission !== 'All') filter.transmission = transmission;

//   const cars = await Car.find(filter);
//   const scored = cars.map(car => ({
//     ...car._doc,
//     score: car.model.toLowerCase().includes(query?.toLowerCase() || '') ? 10 : 1
//   })).sort((a, b) => b.score - a.score);

//   res.json(scored);
// });

// // 5. Geo-Fencing Search
// app.post('/api/geo-search', async (req, res) => {
//   const { lat, lng, query } = req.body;
//   try {
//     const geoRes = await axios.get(
//       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
//     );
//     const city = geoRes.data.results[0]?.address_components
//       .find(c => c.types.includes('locality'))?.long_name || 'Unknown';

//     let filter = { city };
//     if (query) filter.model = { $regex: query, $options: 'i' };
//     const cars = await Car.find(filter);

//     res.json({ city, cars, nearbyServices: [`Service center in ${city}`, `Pickup point near you`] });
//   } catch (err) {
//     res.status(500).json({ error: 'Geo failed' });
//   }
// });

// // 6. Referral System
// app.post('/api/refer', async (req, res) => {
//   const { email, referredByCode } = req.body;
//   const code = Math.random().toString(36).substr(2, 8);
//   let points = 50;

//   if (referredByCode) {
//     const referrer = await User.findOne({ referralCode: referredByCode });
//     if (referrer) {
//       referrer.points += 100;
//       await referrer.save();
//       points += 50;
//     }
//   }

//   const user = new User({ email, referralCode: code, points });
//   await user.save();
//   res.json({ code, points });
// });

// app.post('/api/redeem', async (req, res) => {
//   const { email, amount } = req.body;
//   const user = await User.findOne({ email });
//   if (!user || user.points < amount) return res.status(400).json({ error: 'Insufficient points' });
//   user.points -= amount;
//   await user.save();
//   res.json({ success: true, points: user.points });
// });

// // Start Server
// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

/********************************************************************
 *  cars24-clone – server.js
 *  ---------------------------------------------------------------
 *  1. Loads .env (and prints if values are missing)
 *  2. Connects to MongoDB with a 5-second timeout (fails fast)
 *  3. Seeds data only after a successful connection
 *  4. Starts Express on port 3000
 ********************************************************************/

console.log('>>> server.js is loading <<<');

// ---- 1. Load environment variables --------------------------------
require('dotenv').config();

console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('GOOGLE_MAPS_API_KEY present:', !!process.env.GOOGLE_MAPS_API_KEY);
console.log('FIREBASE_PROJECT_ID present:', !!process.env.FIREBASE_PROJECT_ID);

// ---- 2. Imports ----------------------------------------------------
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ---- 3. Firebase Admin (only if key exists) ------------------------
if (require('fs').existsSync('./serviceAccountKey.json')) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized');
} else {
  console.warn('serviceAccountKey.json NOT FOUND – push notifications disabled');
}

// ---- 4. MongoDB connection (fail-fast) ----------------------------
console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000   // 5 sec timeout
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection FAILED:', err.message);
    process.exit(1);   // stop the process – you will see the error
  });

// ---- 5. Mongoose models --------------------------------------------
const CarAvg = mongoose.model(
  'CarAvg',
  new mongoose.Schema({ brand: String, avgMonthlyCost: Number })
);

const Car = mongoose.model(
  'Car',
  new mongoose.Schema({
    model: String,
    fuelType: String,
    mileage: Number,
    year: Number,
    transmission: String,
    price: Number,
    city: String
  })
);

const User = mongoose.model(
  'User',
  new mongoose.Schema({
    email: String,
    referralCode: String,
    referredBy: String,
    points: { type: Number, default: 0 }
  })
);

// ---- 6. Seed data (runs after successful connection) -------------
async function seedData() {
  try {
    await CarAvg.deleteMany({});
    await CarAvg.insertMany([
      { brand: 'Toyota', avgMonthlyCost: 500 },
      { brand: 'Honda', avgMonthlyCost: 600 },
      { brand: 'Ford', avgMonthlyCost: 800 }
    ]);

    await Car.deleteMany({});
    await Car.insertMany([
      { model: 'Toyota Camry', fuelType: 'Petrol', mileage: 15, year: 2020, transmission: 'Auto', price: 15000, city: 'Delhi' },
      { model: 'Honda City', fuelType: 'Petrol', mileage: 18, year: 2019, transmission: 'Manual', price: 10000, city: 'Mumbai' },
      { model: 'Ford EcoSport', fuelType: 'Diesel', mileage: 22, year: 2018, transmission: 'Manual', price: 8000, city: 'Delhi' },
      { model: 'Toyota Innova', fuelType: 'Diesel', mileage: 13, year: 2021, transmission: 'Auto', price: 20000, city: 'Bangalore' }
    ]);

    console.log('Seed data inserted');
  } catch (e) {
    console.error('Seed failed:', e.message);
  }
}

// Run seed **after** MongoDB is connected
mongoose.connection.once('open', seedData);

// -------------------------------------------------------------------
// --------------------------- APIs ----------------------------------
// -------------------------------------------------------------------

// 1. Maintenance Estimator
app.post('/api/estimate-maintenance', async (req, res) => {
  const { age, km, brand } = req.body;
  const avg = await CarAvg.findOne({ brand });
  if (!avg) return res.status(404).json({ error: 'Brand not found' });

  let multiplier = 1;
  if (age > 5) multiplier += 0.5;
  if (km > 80000) multiplier += 0.5;
  const estimatedCost = Math.round(avg.avgMonthlyCost * multiplier);

  const insights = [];
  if (km > 60000) insights.push('Next major service due in ~4,000 km');
  if (km % 40000 < 5000) insights.push('Expected tire replacement soon');

  const tag = estimatedCost > 700 ? 'High Maintenance Expected' : 'Low Maintenance';
  res.json({ tag, estimatedCost, insights });
});

// 2. Push Notification
app.post('/api/send-notification', async (req, res) => {
  const { token, title, body } = req.body;
  try {
    await admin.messaging().send({ token, notification: { title, body } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Pricing Engine
app.post('/api/price-adjust', (req, res) => {
  const { basePrice, carType, region, season } = req.body;
  let multiplier = 1;
  if (season === 'monsoon' && carType === 'SUV') multiplier += 0.1;
  if (region === 'metro' && carType === 'hatchback') multiplier -= 0.05;
  const recommended = Math.round(basePrice * multiplier);
  res.json({ recommended, multiplier: multiplier.toFixed(2) });
});

// 4. Search
app.get('/api/search', async (req, res) => {
  const { query, fuelType, mileageMin, yearMin, transmission } = req.query;
  const filter = {};
  if (query) filter.model = { $regex: query, $options: 'i' };
  if (fuelType && fuelType !== 'All') filter.fuelType = fuelType;
  if (mileageMin) filter.mileage = { $gte: parseInt(mileageMin) };
  if (yearMin) filter.year = { $gte: parseInt(yearMin) };
  if (transmission && transmission !== 'All') filter.transmission = transmission;

  const cars = await Car.find(filter);
  const scored = cars
    .map(c => ({
      ...c._doc,
      score: c.model.toLowerCase().includes((query || '').toLowerCase()) ? 10 : 1
    }))
    .sort((a, b) => b.score - a.score);

  res.json(scored);
});

// 5. Geo-Fencing
app.post('/api/geo-search', async (req, res) => {
  const { lat, lng, query } = req.body;
  try {
    const geo = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const city =
      geo.data.results[0]?.address_components.find(c => c.types.includes('locality'))?.long_name ||
      'Unknown';

    const filter = { city };
    if (query) filter.model = { $regex: query, $options: 'i' };
    const cars = await Car.find(filter);

    res.json({ city, cars, nearbyServices: [`Service center in ${city}`, 'Pickup point near you'] });
  } catch (e) {
    res.status(500).json({ error: 'Geo failed' });
  }
});

// 6. Referral System
app.post('/api/refer', async (req, res) => {
  const { email, referredByCode } = req.body;
  const code = Math.random().toString(36).substr(2, 8);
  let points = 50;

  if (referredByCode) {
    const referrer = await User.findOne({ referralCode: referredByCode });
    if (referrer) {
      referrer.points += 100;
      await referrer.save();
      points += 50;
    }
  }

  await new User({ email, referralCode: code, points }).save();
  res.json({ code, points });
});

app.post('/api/redeem', async (req, res) => {
  const { email, amount } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.points < amount) return res.status(400).json({ error: 'Insufficient points' });
  user.points -= amount;
  await user.save();
  res.json({ success: true, points: user.points });
});

// -------------------------------------------------------------------
// --------------------------- START SERVER --------------------------
// -------------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});