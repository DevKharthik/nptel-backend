const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3005;

mongoose.connect('mongodb+srv://dev:06-Aug-03@cluster0.p4dqn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

const studentSchema = new mongoose.Schema({
  email: String,
  name: String,
  rollno: String,
  year: String,
  department: String,
  phone: String,
  academicYear: String,
  courses: [String],
});

const Prefinal = mongoose.model('Prefinal', studentSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post('/submit', async (req, res) => {
  var { email, name, rollno, year, department, phone, academicYear, courses } = req.body;
  function validateRollno(rollno) {
    const pattern = /^[RL](\d{2}[1-9]|\d{3})$/;
    const match = rollno.match(pattern);
    if (match) {
        const numberPart = parseInt(rollno.substring(1), 10);  // Extract and convert the numeric part
        return numberPart >= 1 && numberPart <= 280;
    }
    return false;
  }
  if(!validateRollno(rollno)){
    const alertMessage = "Please Enter a valid rollno";
    return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
  }
  rollno="23CS" + rollno;
  if (courses === undefined || courses === null) {
    const alertMessage = "Please select atleast one course.";
    return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
  }

  // Validate mobile number
  if (phone.length !== 10) {
    const alertMessage = "Please provide a valid mobile number.";
    return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
  }

  try {
    const existingStudentByRoll = await Prefinal.findOne({ rollno: rollno });
    if (existingStudentByRoll) {
      const alertMessage = "Roll number is already Registered. Thank You.";
      return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
    }

    const existingStudentByEmail = await Prefinal.findOne({ email: email });
    if (existingStudentByEmail) {
      const alertMessage = "You are already registered. Check your Registration.";
      return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
    }

    const newStudent = new Prefinal({ email, name, rollno, year, department, phone, academicYear, courses });
    await newStudent.save();

    const alertMessage = "Course registration successful. Check your Registration.";
    return res.send(`<script>alert('${alertMessage}'); window.location.href='http://3.82.71.210:3006/';</script>`);
  } catch (error) {
    console.error(error);
    const alertMessage = "Error saving to the database. Please try again later.";
    return res.send(`<script>alert('${alertMessage}'); window.history.back();</script>`);
  }
});

app.get('/getTotalEnrollment', async (req, res) => {
  try {
    const courseCounts = await Prefinal.aggregate([
      { $unwind: '$courses' },
      { $group: { _id: '$courses', count: { $sum: 1 } } }
    ]);
    res.json(courseCounts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error getting total enrollment data');
  }
});

app.post('/confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    const registration = await Prefinal.findOne({ email });

    if (registration) {
      console.log('Registration details fetched successfully:', registration);
      res.json({
        registered: true,
        ...registration._doc,
      });
    } else {
      console.log('No registration details found for email:', email);
      res.json({ registered: false });
    }
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
