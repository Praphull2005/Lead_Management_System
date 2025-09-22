import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Lead from '../models/Lead.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Lead.deleteMany({});
    console.log('Cleared existing data');

    // Create test user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('TestPassword123!', salt);

    const testUser = new User({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: hashedPassword
    });

    await testUser.save();
    console.log('Test user created');

    // Sample lead data
    const sampleLeads = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@techcorp.com',
        phone: '+1234567890',
        company: 'TechCorp Solutions',
        city: 'San Francisco',
        state: 'California',
        source: 'website',
        status: 'new',
        score: 85,
        lead_value: 50000,
        is_qualified: true,
        user_id: testUser._id
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@innovatetech.com',
        phone: '+1987654321',
        company: 'Innovate Tech',
        city: 'Austin',
        state: 'Texas',
        source: 'google_ads',
        status: 'contacted',
        score: 75,
        lead_value: 35000,
        is_qualified: true,
        last_activity_at: new Date(),
        user_id: testUser._id
      },
      {
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'mbrown@startupco.com',
        phone: '+1555123456',
        company: 'StartupCo',
        city: 'New York',
        state: 'New York',
        source: 'referral',
        status: 'qualified',
        score: 90,
        lead_value: 75000,
        is_qualified: true,
        last_activity_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        user_id: testUser._id
      },
      // Generate more sample leads
      ...Array.from({ length: 100 }, (_, i) => ({
        first_name: `Lead${i + 4}`,
        last_name: `User${i + 4}`,
        email: `lead${i + 4}@company${i + 4}.com`,
        phone: `+1${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`,
        company: `Company ${i + 4}`,
        city: ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Boston', 'Seattle'][Math.floor(Math.random() * 6)],
        state: ['California', 'New York', 'Illinois', 'Massachusetts', 'Washington', 'Texas'][Math.floor(Math.random() * 6)],
        source: ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'][Math.floor(Math.random() * 6)],
        status: ['new', 'contacted', 'qualified', 'lost', 'won'][Math.floor(Math.random() * 5)],
        score: Math.floor(Math.random() * 101),
        lead_value: Math.floor(Math.random() * 100000),
        is_qualified: Math.random() > 0.5,
        last_activity_at: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : null,
        user_id: testUser._id
      }))
    ];

    await Lead.insertMany(sampleLeads);
    console.log(`Created ${sampleLeads.length} sample leads`);

    console.log('✅ Seed data created successfully!');
    console.log('Test user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: TestPassword123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();