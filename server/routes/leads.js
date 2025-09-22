import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Lead from '../models/Lead.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation rules for lead creation/update
const leadValidation = [
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  body('source')
    .isIn(['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'])
    .withMessage('Invalid source value'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'lost', 'won'])
    .withMessage('Invalid status value'),
  body('score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('lead_value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Lead value cannot be negative'),
  body('is_qualified')
    .optional()
    .isBoolean()
    .withMessage('is_qualified must be a boolean'),
  body('last_activity_at')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for last_activity_at')
];

// Build filter query
const buildFilterQuery = (filters, userId) => {
  const query = { user_id: userId };

  Object.keys(filters).forEach(key => {
    if (key.includes('_')) {
      const [field, operator] = key.split('_');
      const value = filters[key];

      if (!query[field]) query[field] = {};

      switch (operator) {
        case 'equals':
          query[field] = value;
          break;
        case 'contains':
          query[field] = { $regex: value, $options: 'i' };
          break;
        case 'in':
          query[field] = { $in: Array.isArray(value) ? value : [value] };
          break;
        case 'gt':
          query[field].$gt = Number(value);
          break;
        case 'lt':
          query[field].$lt = Number(value);
          break;
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            query[field].$gte = Number(value[0]);
            query[field].$lte = Number(value[1]);
          }
          break;
        case 'before':
          query[field].$lt = new Date(value);
          break;
        case 'after':
          query[field].$gt = new Date(value);
          break;
        case 'on':
          const startOfDay = new Date(value);
          const endOfDay = new Date(value);
          endOfDay.setHours(23, 59, 59, 999);
          query[field] = { $gte: startOfDay, $lte: endOfDay };
          break;
      }
    } else {
      // Simple equality for fields without operators
      if (['status', 'source', 'is_qualified'].includes(key)) {
        query[key] = filters[key];
      }
    }
  });

  return query;
};

// Get all leads with pagination and filtering
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Extract filters from query parameters
    const filters = { ...req.query };
    delete filters.page;
    delete filters.limit;

    // Build filter query
    const filterQuery = buildFilterQuery(filters, req.user._id);

    // Get leads with pagination
    const [leads, total] = await Promise.all([
      Lead.find(filterQuery)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'first_name last_name email'),
      Lead.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch leads'
    });
  }
});

// Get single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      user_id: req.user._id 
    }).populate('user_id', 'first_name last_name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Get lead error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Unable to fetch lead'
    });
  }
});

// Create new lead
router.post('/', leadValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if lead with same email exists for this user
    const existingLead = await Lead.findOne({ 
      email: req.body.email,
      user_id: req.user._id 
    });

    if (existingLead) {
      return res.status(400).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }

    const lead = new Lead({
      ...req.body,
      user_id: req.user._id
    });

    await lead.save();

    // Populate user details for response
    await lead.populate('user_id', 'first_name last_name email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Unable to create lead'
    });
  }
});

// Update lead
router.put('/:id', leadValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if another lead with same email exists (excluding current lead)
    if (req.body.email) {
      const existingLead = await Lead.findOne({ 
        email: req.body.email,
        user_id: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingLead) {
        return res.status(400).json({
          success: false,
          message: 'Another lead with this email already exists'
        });
      }
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('user_id', 'first_name last_name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A lead with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Unable to update lead'
    });
  }
});

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ 
      _id: req.params.id, 
      user_id: req.user._id 
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete lead error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Unable to delete lead'
    });
  }
});

export default router;