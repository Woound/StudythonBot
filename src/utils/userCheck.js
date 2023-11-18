// userCheck.js
const mongoose = require('mongoose');
const { User } = require('./schemas');

async function isUserInDatabase(userID) {
  // Connecting to the MongoDB database using mongoose.
  const mongodbUrl = process.env.MONGODB_URI;
  try {
    // Connect to MongoDB
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongodbUrl);
    const user = await User.findOne({ userID });
    return !!user;
  } catch (error) {
    console.error('Error checking user in database:', error);
    return false;
  } finally {
    await mongoose.connection.close();
  }
}

module.exports = isUserInDatabase;
