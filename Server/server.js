// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs').promises; // Import fs with promises API

const app = express();
const PORT = 3000;

// Middleware Setup
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies

// JWT Secret Key (Use environment variables in production)
const JWT_SECRET = 'secret_key';

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No authorization header or Bearer prefix.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Authenticated User:', req.user.username, 'Role:', req.user.role);
    next();
  } catch (err) {
    console.error('Invalid token:', err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Set up storage engine for multer
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

// Initialize upload with multer
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
const MONGODB_URI = 'mongodb+srv://ivan1424:aisr1400@vtresearch.oow2p.mongodb.net/vtresearchdatabase?retryWrites=true&w=majority&appName=vtresearch';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schemas and Models

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // Ensure email field exists
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor'], required: true },
  cvs: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Ensure _id exists
      filename: String,
      originalName: String, // Add originalName for display
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});


const User = mongoose.model('User', userSchema);

// Research Opportunity Schema
const researchOpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String },
  department: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const ResearchOpportunity = mongoose.model('ResearchOpportunity', researchOpportunitySchema, 'researchopportunities');

// Application Schema
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

// Get all research opportunities with populated 'postedBy' field
app.get('/api/opportunities', async (req, res) => {
  try {
    const opportunities = await ResearchOpportunity.find().populate('postedBy', 'username email');
    res.json(opportunities);
  } catch (err) {
    console.error('Error fetching opportunities:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a single research opportunity by ID with populated 'postedBy' field
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await ResearchOpportunity.findById(req.params.id).populate('postedBy', 'username email');
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opportunity);
  } catch (err) {
    console.error('Error fetching opportunity:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Protected route for professors to fetch applications
app.get('/api/professor/applications', authenticate, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Only professors can access this' });
  }

  try {
    // Find all research opportunities posted by the professor
    const opportunities = await ResearchOpportunity.find({ postedBy: req.user.userId });

    const opportunityIds = opportunities.map(op => op._id);

    // Find all applications related to these opportunities
    const applications = await Application.find({ opportunity: { $in: opportunityIds } })
      .populate('student', 'username email')
      .populate('opportunity', 'title department');

    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Fetch CVs uploaded by the authenticated student
app.get('/api/my-cvs', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can access this' });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.cvs);
  } catch (err) {
    console.error('Error fetching CVs:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Download CV
app.get('/download-cv/:filename', authenticate, async (req, res) => {
  const filename = req.params.filename;
  console.log(`User ${req.user.userId} is attempting to download CV: ${filename}`);

  try {
    // Verify that the user owns the CV
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User with ID ${req.user.userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    const cv = user.cvs.find(cv => cv.filename === filename);
    if (!cv) {
      console.error(`CV with filename ${filename} not found for user ${req.user.userId}`);
      return res.status(403).json({ message: 'Forbidden: You do not have access to this CV' });
    }

    const filePath = path.resolve(__dirname, 'uploads', 'cvs', filename);
    console.log(`Attempting to send file at path: ${filePath}`);

    // Check if the file exists before sending
    try {
      await fs.access(filePath);
      console.log(`File exists: ${filePath}`);
      res.sendFile(filePath);
    } catch (fileErr) {
      console.error(`File does not exist: ${filePath}`, fileErr);
      return res.status(404).json({ message: 'CV file not found on server' });
    }
  } catch (err) {
    console.error('Error downloading CV:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Protected route for students to upload their CV
app.post('/api/upload-cv', authenticate, function (req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can upload CVs' });
  }
  upload.single('cv')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
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

// POST Route to Create a New Research Opportunity
app.post('/api/opportunities', authenticate, async (req, res) => {
  // Ensure the user is a professor
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Access denied. Only professors can post opportunities.' });
  }

  const { title, description, fullDescription, department } = req.body;

  // Basic validation
  if (!title || !description || !department) {
    return res.status(400).json({ message: 'Title, description, and department are required.' });
  }

  try {
    // Create a new ResearchOpportunity document
    const newOpportunity = new ResearchOpportunity({
      title,
      description,
      fullDescription,
      department,
      postedBy: req.user.userId, // Associate with the professor's user ID
      createdAt: new Date(),
    });

    await newOpportunity.save();

    res.status(201).json({ message: 'Research opportunity posted successfully.', opportunity: newOpportunity });
  } catch (err) {
    console.error('Error posting research opportunity:', err);
    res.status(500).json({ message: 'Server Error: Could not post research opportunity.' });
  }
});



// Protected route to delete a CV by CV ID (Students only)
app.delete('/api/delete-cv/:cvId', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    console.error(`User ${req.user.userId} with role ${req.user.role} attempted to delete a CV`);
    return res.status(403).json({ message: 'Forbidden: Only students can delete CVs' });
  }

  const cvId = req.params.cvId;
  console.log(`User ${req.user.userId} is attempting to delete CV with ID: ${cvId}`);

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.error(`User with ID ${req.user.userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the CV by cvId
    const cv = user.cvs.id(cvId);
    if (!cv) {
      console.error(`CV with ID ${cvId} not found for user ${req.user.userId}`);
      return res.status(404).json({ message: 'CV not found' });
    }

    const filename = cv.filename;
    console.log(`Deleting CV file: ${filename}`);

    // Remove the CV from the user's cvs array
    cv.remove();
    await user.save();
    console.log(`Removed CV with ID ${cvId} from user ${req.user.userId}`);

    // Delete the file from the filesystem
    const filePath = path.resolve(__dirname, 'uploads', 'cvs', filename);
    console.log(`Attempting to delete file at path: ${filePath}`);

    try {
      await fs.unlink(filePath);
      console.log(`Deleted file at path: ${filePath}`);
    } catch (fileErr) {
      console.error(`Error deleting file ${filePath}:`, fileErr);
      // Optionally, revert the database change if file deletion fails
      return res.status(500).json({ message: 'Server Error: Could not delete the CV file' });
    }

    res.json({ message: 'CV deleted successfully' });
  } catch (err) {
    console.error('Error deleting CV:', err);
    res.status(500).json({ message: 'Server Error: Could not delete the CV' });
  }
});

app.use(express.static(path.join(__dirname, '../Client')));
app.use('/uploads/cvs', express.static(path.join(__dirname, 'uploads', 'cvs')));


// 404 Handler
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
