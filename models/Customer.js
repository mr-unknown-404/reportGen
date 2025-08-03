import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  SrNo: { type: Number, unique: true },
  companyName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  contactPerson: { type: String },
  inScope: { type: String }, // multi-line textarea input
  outScope: { type: String } // multi-line textarea input
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
