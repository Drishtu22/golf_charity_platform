const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

console.log('--- ENV CHECK ---');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'MISSING');
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Found' : 'MISSING');
console.log('-----------------');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('ERROR: .env values not loaded. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
  console.log('\n Seeding database...\n');

  const adminId = uuidv4();
  const userId = uuidv4();
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const userHash = await bcrypt.hash('User@1234', 12);

  // Get a charity if exists
  const { data: charity } = await supabase.from('charities').select('id').limit(1).single();
  
  if (!charity) {
    console.log('Warning: No charities found. User will be created without charity_id');
  }

  // Prepare users with all required fields
  // Note: charity_contribution_percent must be >= 10 due to check constraint
  const adminUser = {
    id: adminId,
    email: 'admin@golfcharity.com',
    password_hash: adminHash,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    subscription_status: 'active',
    subscription_plan: 'yearly',
    is_active: true,
    charity_contribution_percent: 10, // Minimum allowed value (>= 10)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const regularUser = {
    id: userId,
    email: 'user@golfcharity.com',
    password_hash: userHash,
    first_name: 'Test',
    last_name: 'Golfer',
    role: 'subscriber',
    subscription_status: 'active',
    subscription_plan: 'monthly',
    charity_id: charity ? charity.id : null,
    charity_contribution_percent: 15, // Valid value (>= 10)
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try inserting users one by one to identify which one fails
  console.log('Attempting to insert admin user...');
  const { error: adminError } = await supabase
    .from('users')
    .upsert([adminUser], { onConflict: 'email' });

  if (adminError) {
    console.error('Error seeding admin user:', adminError.message);
    console.error('Admin user data:', adminUser);
    process.exit(1);
  }
  console.log('Admin user seeded successfully');

  console.log('Attempting to insert regular user...');
  const { error: userError } = await supabase
    .from('users')
    .upsert([regularUser], { onConflict: 'email' });

  if (userError) {
    console.error('Error seeding regular user:', userError.message);
    console.error('Regular user data:', regularUser);
    process.exit(1);
  }
  console.log('Regular user seeded successfully');

  console.log('\nUsers seeded successfully');
  console.log('Admin -> admin@golfcharity.com / Admin@1234');
  console.log('User  -> user@golfcharity.com  / User@1234\n');

  // Seed scores for the regular user
  const scores = Array.from({ length: 5 }, (_, i) => ({
    id: uuidv4(),
    user_id: userId,
    score_value: Math.floor(Math.random() * 30) + 10,
    played_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  }));

  const { error: scoresError } = await supabase.from('scores').insert(scores);
  if (scoresError) {
    console.error('Error seeding scores:', scoresError.message);
  } else {
    console.log('5 scores seeded for test user');
  }

  console.log('\nSeeding complete!');
}

seed().catch(function(err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
});