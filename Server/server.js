// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
// app.use(express.static(path.join(__dirname, '../Client'))); // Serve static files from Client 

// MongoDB Connection String with Database Name
const MONGODB_URI = 'mongodb+srv://ivan1424:aisr1400@vtresearch.oow2p.mongodb.net/vtresearchdatabase?retryWrites=true&w=majority&appName=vtresearch';

// JWT Secret Key
const JWT_SECRET = 'secret_key';

const authenticate = (req, res, next) => {
  // ... your existing authentication code ...
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Invalid token:', err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/cvs/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Use the user's ID to prevent filename conflicts
    cb(null, req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit files to 5MB
  fileFilter: function (req, file, cb) {
    // Accept PDF and TXT files only
    const filetypes = /pdf|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed.'));
    }
  }
});


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
  email: { type: String, required: true, unique: true }, // Ensure email field exists
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor'], required: true },
  cvs: [
    {
      filename: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
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
const ResearchOpportunity = mongoose.model('ResearchOpportunity', researchOpportunitySchema, 'researchopportunities');

// Place the Application Schema and Model here
const applicationSchema = new mongoose.Schema({
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchOpportunity', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cv: {
    filename: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
  },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
});

const Application = mongoose.model('Application', applicationSchema);

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client', 'researchIndex.html'));
});

// API Routes

// Get all research opportunities with populated 'postedBy' field
app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await ResearchOpportunity.find().populate('postedBy', 'username');
    res.json(opportunities);
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a single research opportunity by ID with populated 'postedBy' field
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await ResearchOpportunity.findById(req.params.id).populate('postedBy', 'username');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (err) {
    console.error('Error fetching opportunity:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});
// returns the list of CVs uploaded by the user
app.get('/api/my-cvs', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can access this' });
  }

  try {
    const user = await User.findById(req.user.userId);
    res.json(user.cvs);
  } catch (err) {
    console.error('Error fetching CVs:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/download-cv/:filename', authenticate, async (req, res) => {
  const filename = req.params.filename;

  try {
    // Verify that the user owns the CV
    const user = await User.findById(req.user.userId);
    const cv = user.cvs.find(cv => cv.filename === filename);

    if (!cv) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this CV' });
    }

    const filePath = path.join(__dirname, 'uploads/cvs', filename);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error downloading CV:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Protected route for students to upload their CV
app.post('/api/upload-cv', authenticate, function (req, res, next) {
  upload.single('cv')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can upload CVs' });
  }

  try {
    // Add the new CV to the user's 'cvs' array
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { cvs: { filename: req.file.filename, uploadedAt: new Date() } },
    });
    res.status(200).json({ message: 'CV uploaded successfully' });
  } catch (err) {
    console.error('Error uploading CV:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/opportunities/:id/apply', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can apply to opportunities' });
  }

  const opportunityId = req.params.id;
  const studentId = req.user.userId;

  try {
    // Check if the opportunity exists
    const opportunity = await ResearchOpportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    // Check if the student has already applied
    const existingApplication = await Application.findOne({ opportunity: opportunityId, student: studentId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this opportunity' });
    }

    // Fetch the student's resumes
    const student = await User.findById(studentId);
    if (!student.cvs || student.cvs.length === 0) {
      return res.status(400).json({ message: 'Please upload a CV before applying.' });
    }

    // Use the most recently uploaded resume
    const latestResume = student.cvs.sort((a, b) => b.uploadedAt - a.uploadedAt)[0];

    // Create a new application with the resume
    const newApplication = new Application({
      opportunity: opportunityId,
      student: studentId,
      cv: {
        filename: latestResume.filename,
        uploadedAt: latestResume.uploadedAt,
      },
    });

    await newApplication.save();

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// User Registration with Password Hashing
app.post('/api/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(400).json({ message: 'Username or email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
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
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

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
      department,
      postedBy: req.user.userId, // Correctly assign to 'postedBy'
    });
    const savedOpportunity = await newOpportunity.save();
    res.status(201).json(savedOpportunity);
  } catch (err) {
    console.error('Error creating opportunity:', err);
    res.status(400).json({ message: 'Invalid data' });
  }
});

app.use(express.static(path.join(__dirname, '../Client')));

// 404 Handler
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});