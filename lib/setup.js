/**
 * Initial Setup Utility
 * Creates Super Admin on first run if no users exist
 */
import connectDB from './db';
import User from '../models/User';
import crypto from 'crypto';

/**
 * Generate a random secure password
 */
function generateSecurePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$!';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('') + 
    crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Check and perform first-time setup
 * Returns setup info if first run, null otherwise
 */
export async function performInitialSetup() {
  try {
    await connectDB();

    // Check if any user exists
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      return null; // Already set up
    }

    // Generate credentials
    const adminEmail = `admin@college-erp.edu`;
    const adminPassword = generateSecurePassword();

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'super_admin',
      isActive: true,
    });

    console.log('\n========================================');
    console.log('🎓 COLLEGE ERP - INITIAL SETUP COMPLETE');
    console.log('========================================');
    console.log('Super Admin credentials (save these!):');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('========================================\n');

    return {
      email: adminEmail,
      password: adminPassword,
      userId: superAdmin._id,
    };
  } catch (error) {
    console.error('Setup error:', error);
    return null;
  }
}

/**
 * Check if system is initialized
 */
export async function isSystemInitialized() {
  try {
    await connectDB();
    const count = await User.countDocuments();
    return count > 0;
  } catch (error) {
    return false;
  }
}
