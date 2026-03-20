const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from current directory
app.use(express.static(path.join(__dirname, '')));

// Connect to MongoDB
// For local MongoDB: mongodb://127.0.0.1:27017/ai_assistant
// For MongoDB Atlas, replace with your connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_assistant';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } // In production, hash this password!
});

const User = mongoose.model('User', userSchema);

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Backend is running, but MongoDB is not connected! Please check your MONGO_URI in Render and allow 0.0.0.0/0 in MongoDB Atlas.' });
    }

    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
    const newUser = new User({ name, email, password });
    await newUser.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Backend is running, but MongoDB is not connected! Please check your MONGO_URI in Render and allow 0.0.0.0/0 in MongoDB Atlas.' });
    }

    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(200).json({ 
      message: 'Login successful',
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Catch-all to serve index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
