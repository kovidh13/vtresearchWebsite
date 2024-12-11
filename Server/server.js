// server.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');


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
  console.log('Authorization Header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  console.log('Token:', token);
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
mongoose.connect(MONGODB_URI)
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
      originalName: { type: String, required: true },
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

app.get('/api/download-cv/:filename', authenticate, async (req, res) => {
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
app.post('/api/upload-cv', authenticate, upload.single('cv'), async (req, res) => {
  try {
      console.log('Received request to upload CV');

      // Check if a file was uploaded
      if (!req.file) {
          console.error('No file uploaded');
          return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = path.join(__dirname, 'uploads/cvs', req.file.filename);
      console.log('File path for processing:', filePath);

      // Send the file to the Python API
      const pythonApiResponse = await axios.post('http://127.0.0.1:5000/process-resume', {
          filePath: filePath,
      });

      console.log('Response from Python API:', pythonApiResponse.data);

      const { skills, recommended_job } = pythonApiResponse.data;

      // Debugging the extracted data
      console.log('Extracted skills:', skills);
      console.log('Extracted recommended job:', recommended_job);

      // Fetch matching opportunities
      const opportunities = await ResearchOpportunity.find({
          $or: [
              { title: { $regex: recommended_job, $options: 'i' } },
              { description: { $regex: recommended_job, $options: 'i' } },
              { description: { $regex: skills.join('|'), $options: 'i' } },
          ],
      }).populate('postedBy', 'username');

      console.log('Matched opportunities:', opportunities);

      // **New Lines to Save CV Details**
      await User.findByIdAndUpdate(req.user.userId, { 
          $push: { 
              cvs: { 
                  originalName: req.file.originalname, // Save original filename
                  filename: req.file.filename,         // Save stored filename
                  uploadedAt: new Date(),
              } 
          } 
      });

      // Send the response
      res.status(200).json({
          message: 'CV processed successfully',
          opportunities,
      });
  } catch (err) {
      // Log the error for debugging
      console.error('Error processing CV:', err);
      res.status(500).json({ message: 'An error occurred', error: err.message });
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

app.get('/api/professor/applications', authenticate, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Only professors can view applications' });
  }

  try {
    // Find all opportunities posted by the professor
    const opportunities = await ResearchOpportunity.find({ postedBy: req.user.userId });

    // Extract opportunity IDs
    const opportunityIds = opportunities.map(opp => opp._id);

    // Fetch applications related to these opportunities
    const applications = await Application.find({ opportunity: { $in: opportunityIds } })
      .populate('student', 'username email')
      .populate('opportunity', 'title department');

    res.json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});



app.get('/api/applications/:id/download-cv', authenticate, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Forbidden: Only professors can download CVs' });
  }

  const applicationId = req.params.id;

  try {
    const application = await Application.findById(applicationId).populate('opportunity');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.opportunity.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden: You can only access applications for your opportunities' });
    }

    const filePath = path.join(__dirname, 'uploads/cvs', application.cv.filename);
    res.download(filePath, application.cv.filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Failed to download CV' });
      }
    });
  } catch (err) {
    console.error('Error fetching application or CV:', err);
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
  console.log('Login route accessed');
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(token);

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

// Get Student's Applications
app.get('/api/student/applications', authenticate, async (req, res) => {
  // Ensure that only students can access this endpoint
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Forbidden: Only students can access their applications.' });
  }

  try {
    // Fetch all applications where the student field matches the logged-in user's ID
    const applications = await Application.find({ student: req.user.userId })
      .populate('opportunity', 'title department') // Populate opportunity details
      .sort({ appliedAt: -1 }); // Sort by most recent applications

    res.status(200).json({ applications });
  } catch (err) {
    console.error('Error fetching student applications:', err);
    res.status(500).json({ message: 'Server Error: Unable to retrieve applications.' });
  }
});

app.get('/api/recommended-opportunities', authenticate, (req, res) => {
  try {
      // Check if there are stored recommended opportunities
      const opportunities = req.user.recommendedOpportunities || [];
      res.status(200).json({ opportunities });
  } catch (err) {
      console.error('Error fetching recommended opportunities:', err);
      res.status(500).json({ message: 'Failed to fetch recommended opportunities' });
  }
});

app.post('/api/applications/bulk-decision', authenticate, async (req, res) => {
  try {
    const user = req.user; // Assuming `authenticate` attaches user info to req.user

    // Authorize only professors
    if (user.role !== 'professor') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only professors can perform this action.' });
    }

    const { applicationIds, decision } = req.body;

    // Validate input
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No application IDs provided.' });
    }

    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision. Must be "accept" or "reject".' });
    }

    // Define the new status based on the decision
    const newStatus = decision === 'accept' ? 'accepted' : 'rejected';

    // Fetch all opportunities posted by the professor
    const opportunities = await ResearchOpportunity.find({ postedBy: user.userId }).select('_id');
    const opportunityIds = opportunities.map(opp => opp._id);

    // Fetch applications that belong to the professor's opportunities and are pending
    const validApplications = await Application.find({
      _id: { $in: applicationIds },
      opportunity: { $in: opportunityIds },
      status: 'pending' // Assuming only pending applications can be decided upon
    }).select('_id');

    const validApplicationIds = validApplications.map(app => app._id);

    if (validApplicationIds.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid applications found to update.' });
    }

    // Update the applications
    const result = await Application.updateMany(
      { _id: { $in: validApplicationIds } },
      { $set: { status: newStatus } }
    );

    res.status(200).json({ success: true, message: `Applications have been successfully ${newStatus}ed.` });
  } catch (error) {
    console.error('Error in bulk-decision:', error);
    res.status(500).json({ success: false, message: 'Server Error: Unable to process your request.' });
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
