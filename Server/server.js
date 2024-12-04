// server.js

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000; // Directly set the port

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../Client')));

// MongoDB Connection String with Database Name
const MONGODB_URI = 'mongodb+srv://ivan1424:aisr1400@vtresearch.oow2p.mongodb.net/?retryWrites=true&w=majority&appName=vtresearch';

// JWT Secret Key
const JWT_SECRET = 'secret_key'; 

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schemas and Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed passwords
  role: { type: String, enum: ['student', 'professor'], required: true },
});

const researchOpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String },
  department: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const ResearchOpportunity = mongoose.model('ResearchOpportunity', researchOpportunitySchema);

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client', 'researchIndex.html'));
});

// API Routes

// Get all research opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await ResearchOpportunity.find();
    res.json(opportunities);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a single research opportunity by ID
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await ResearchOpportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// User Registration with Password Hashing
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// User Login with Password Verification
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Middleware to authenticate JWT tokens
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Protected route to create a new research opportunity (Professors only)
app.post('/api/opportunities', authenticate, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Only professors can post opportunities' });
  }
  const { title, description, fullDescription, department } = req.body;
  try {
    const newOpportunity = new ResearchOpportunity({
      title,
      description,
      fullDescription,
      professor: req.user.userId, // Adjust as needed
      department,
      postedBy: req.user.userId,
    });
    const savedOpportunity = await newOpportunity.save();
    res.status(201).json(savedOpportunity);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
