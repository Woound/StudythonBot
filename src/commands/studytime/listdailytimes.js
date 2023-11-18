const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const msToHumanTime = require('../../utils/msToHumanTime');
const { User } = require('../../utils/schemas');
const isAdmin = require('../../utils/adminCheck');

module.exports = {
  name: 'listdailytimes',
  description: 'Lists study time for all users.',
  callback: async (client, interaction) => {
    const member = interaction.member;
    if (!isAdmin(member)) {
      interaction.reply('You do not have permission to use this command.');
      return;
    }
    try {
      // Connect to MongoDB database
      const mongodbUrl = process.env.MONGODB_URI;
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);

      // Fetch all users from the database
      const users = await User.find();

      // Create an embed for the reply
      const studyTimeListEmbed = new EmbedBuilder()
        .setColor('#3498db') // Set the embed color
        .setTitle('Study Time for All Users')
        .setDescription('Here is the study time for each user:')
        .addFields(
          ...users.map(user => ({
            name: `${user.username} (${user.userID})`,
            value: `Today's Study Time: ${
              msToHumanTime(user.timeToday) || '0'
            }\nPrevious Day's Study Time: ${
              msToHumanTime(user.timeYesterday) || '0'
            }\nTotal Studytime: ${msToHumanTime(user.totalTime) || '0'}`,
          }))
        );

      interaction.reply({ embeds: [studyTimeListEmbed] });
    } catch (error) {
      console.error('Error listing study time:', error);
      interaction.reply('An error occurred while processing the command. ☹️');
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  },
};
