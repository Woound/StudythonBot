const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const msToHumanTime = require('../../utils/msToHumanTime');
const { User } = require('../../utils/schemas');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');
const isUserInDatabase = require('../../utils/userCheck');

module.exports = {
  name: 'studytimehistory',
  description: 'View your study time for today and yesterday.',
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

      if (user) {
        // Create an embed for the reply
        const studyTimeEmbed = new EmbedBuilder()
          .setColor('#3498db') // Set the embed color
          .setTitle(`Study Time for ${user.username} (${user.userID})`)
          .setDescription('Here is your study time for today and yesterday:')
          .addFields(
            {
              name: "Today's Study Time",
              value: msToHumanTime(user.timeToday) || '0',
            },
            {
              name: "Yesterday's Study Time",
              value: msToHumanTime(user.timeYesterday) || '0',
            }
          );

        interaction.reply({ embeds: [studyTimeEmbed] });
      } else {
        interaction.reply('No user data found for the command.');
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
