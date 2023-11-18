// schemas.js
const mongoose = require('mongoose');

// Defining the team schema
const teamSchema = new mongoose.Schema({
  teamLeaderID: String,
  teamName: String,
  member1ID: String,
  member2ID: String,
  member3ID: String,
  member4ID: String,
  totalTime: String,
});

// Defining the user schema
const userSchema = new mongoose.Schema({
  userID: String,
  username: String,
  totalTime: { type: String, default: '0' }, // Set totalTime as a String with a default value of 0
  timeToday: { type: String, default: '0' },
  timeYesterday: { type: String, default: '0' },
  teamID: String,
});

// Defining the study session schema
const studySessionSchema = new mongoose.Schema({
  userID: String,
  startTime: Date,
  endTime: Date,
  timeThisSession: String,
  ongoing: Boolean,
});

// Create a Mongoose model based on the schema
module.exports = {
  Team: mongoose.model('Team', teamSchema),
  User: mongoose.model('User', userSchema),
  Session: mongoose.model('Session', studySessionSchema),
};
