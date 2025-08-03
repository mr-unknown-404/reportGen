import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Customer } from './models/Customer.js';
import { Vulnerability } from './models/Vulnerability.js';

import multer from 'multer';
// import path from 'path';
import fs from 'fs';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(console.error);



// Ensure /public/uploads exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Upload API
app.post('/upload', upload.single('image'), (req, res) => {
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// POST: Add new customer

app.post('/api/customers', async (req, res) => {
  try {
    // Get the highest SrNo from existing records
    const lastCustomer = await Customer.findOne().sort({ SrNo: -1 });
    const nextSrNo = lastCustomer?.SrNo ? lastCustomer.SrNo + 1 : 1;

    const newCustomer = new Customer({
      SrNo: nextSrNo,
      ...req.body
    });

    await newCustomer.save();
    res.status(200).json({ message: 'Customer added' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add customer');
  }
});

// Get single customer
app.get('/api/customers/:id', async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  res.json(customer);
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ message: 'Updated' });
  } catch (err) {
    res.status(500).send('Update failed');
  }
});


// GET: Paginated and searchable customer list
app.get('/api/customers', async (req, res) => {
  const { page = 1, search = '' } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  const query = {
    $or: [
      { companyName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { contactPerson: new RegExp(search, 'i') },
    ]
  };

  const customers = await Customer.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ SrNo: 1 }); // 🔁 ascending order by SrNo

  const count = await Customer.countDocuments(query);

  res.json({ customers, totalPages: Math.ceil(count / limit) });
});

// Delete Customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).send('Delete failed');
  }
});

// 
app.get('/api/vulnerabilities', async (req, res) => {
  const vulns = await Vulnerability.find({}, 'title'); // only titles for dropdown
  res.json(vulns);
});

app.get('/api/vulnerabilities/:id', async (req, res) => {
  const vuln = await Vulnerability.findById(req.params.id);
  res.json(vuln);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
