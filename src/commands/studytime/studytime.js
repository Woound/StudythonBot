const mongoose = require('mongoose');
const msToHumanTime = require('../../utils/msToHumanTime');
const { User } = require('../../utils/schemas');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');
const isUserInDatabase = require('../../utils/userCheck');

const cron = require('node-cron');

// Run this cron job every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    // Connect to MongoDB database
    const mongodbUrl = process.env.MONGODB_URI;
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongodbUrl);
    // Update timeYesterday and reset timeToday for all users
    await User.aggregate([
      {
        $addFields: {
          timeYesterday: '$timeToday',
          timeToday: '0',
        },
      },
      {
        $merge: {
          into: 'users', // Replace 'users' with your actual collection name
          whenMatched: 'merge',
          whenNotMatched: 'insert',
        },
      },
    ]);

    console.log('Daily reset completed.');
  } catch (error) {
    console.error('Error during daily reset:', error);
  } finally {
    // Close MongoDB Connection
    await mongoose.connection.close();
  }
});

module.exports = {
  name: 'studytime',
  description: 'View the total amount of time you have studied.',
  callback: async (client, interaction) => {
    const userID = interaction.user.id;

    const channelId = interaction.channelId;
    const allowedChannel = isInAllowedChannel(channelId);
    if (!allowedChannel) {
      interaction.reply(
        `You can only use this command in <#${allowedChannelId}>.`
      );
      return;
    }

    const isUserInDB = await isUserInDatabase(interaction.user.id);
    if (!isUserInDB) {
      interaction.reply(
        `Error! You did not register in the studython. Contact an admin if this is wrong.`
      );
      return;
    }

    try {
      // Connect to MongoDB database
      const mongodbUrl = process.env.MONGODB_URI;
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);

      // Find the user in the database
      const user = await User.findOne({ userID });

      if (user && user.totalTime != '0') {
        const totalStudyTimeMilliseconds = user.totalTime;
        const formattedStudyTime = msToHumanTime(totalStudyTimeMilliseconds);

        // Display the total study time in a nice message
        interaction.reply(
          `Total study time for ${interaction.member}: ${formattedStudyTime}`
        );
      } else {
        interaction.reply('No study time data found for the user.');
      }
    } catch (error) {
      console.error('An error occurred while displaying study time', error);
      interaction.reply(
        'An error occurred while retrieving your study time data.'
      );
    } finally {
      // Close MongoDB Connection
      await mongoose.connection.close();
    }
  },
};
