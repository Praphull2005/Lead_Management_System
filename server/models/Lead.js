import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    maxlength: [50, 'City cannot exceed 50 characters'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    maxlength: [50, 'State cannot exceed 50 characters'],
    trim: true
  },
  source: {
    type: String,
    required: [true, 'Lead source is required'],
    enum: {
      values: ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'],
      message: 'Source must be one of: website, facebook_ads, google_ads, referral, events, other'
    }
  },
  status: {
    type: String,
    required: [true, 'Lead status is required'],
    enum: {
      values: ['new', 'contacted', 'qualified', 'lost', 'won'],
      message: 'Status must be one of: new, contacted, qualified, lost, won'
    },
    default: 'new'
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be less than 0'],
    max: [100, 'Score cannot be greater than 100'],
    default: 0
  },
  lead_value: {
    type: Number,
    min: [0, 'Lead value cannot be negative'],
    default: 0
  },
  last_activity_at: {
    type: Date,
    default: null
  },
  is_qualified: {
    type: Boolean,
    default: false
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Create indexes for better performance
leadSchema.index({ user_id: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ created_at: -1 });

export default mongoose.model('Lead', leadSchema);