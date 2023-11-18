const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();
const commandCooldown = require('../../utils/commandCooldown');
const { Session } = require('../../utils/schemas');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');

// Connecting to the MongoDB database using mongoose.
const mongodbUrl = process.env.MONGODB_URI;

module.exports = {
  name: 'studystart',
  description:
    'Initiate a timer to track your study time while in a voice channel.',
  callback: async (client, interaction) => {
    // Retrieve userID, member tag, and guild roles
    const member = interaction.member;
    const userID = interaction.user.id;
    const guildRoles = member.roles.cache;

    const channelId = interaction.channelId;
    const allowedChannel = isInAllowedChannel(channelId);
    if (!allowedChannel) {
      interaction.reply(
        `You can only use this command in <#${allowedChannelId}>.`
      );
      return;
    }

    // Check if the user has the required roles
    const hasRequiredRoles =
      guildRoles.has('1173745721015537755') ||
      guildRoles.has('1167161948631216178');

    if (!hasRequiredRoles) {
      interaction.reply(
        'You do not have the required roles to start a study session.'
      );
      return;
    }

    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);
      // Find the existing record of the study session for the user if one exists.
      const existingSession = await Session.findOne({ userID });

      if (existingSession) {
        // If an existing session is found, and it doesn't have an endTime, it's ongoing.
        if (existingSession.endTime === null) {
          interaction.reply('You already have an ongoing session!');
          return;
        }

        // If an existing session is found and it has an endTime, update and start a new session.
        existingSession.startTime = Date.now();
        existingSession.endTime = null; // Reset endTime as the session is ongoing.
        existingSession.ongoing = true; // Set the session as ongoing
        await existingSession.save();

        interaction.reply('New study session started! 😊');
      } else {
        // If no existing session is found, create a new session
        const newSession = new Session({
          userID: userID,
          startTime: Date.now(),
          endTime: null, // Set to null initially as the session is ongoing.
          timeThisSession: '0',
          ongoing: true,
        });

        await newSession.save();

        interaction.reply('New study session started! 😊');
      }
    } catch (error) {
      console.error('Error starting study session: ', error);
      interaction.reply(
        'An error occurred while managing the study session. ☹️'
      );
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  },
};
