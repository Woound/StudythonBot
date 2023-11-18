const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { Team, User } = require('../../utils/schemas'); // Adjust the path accordingly
const msToHumanTime = require('../../utils/msToHumanTime');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');

module.exports = {
  name: 'listteams',
  description: 'Lists all the teams.',
  callback: async (client, interaction) => {
    const channelId = interaction.channelId;
    const allowedChannel = isInAllowedChannel(channelId);
    if (!allowedChannel) {
      interaction.reply(
        `You can only use this command in <#${allowedChannelId}>.`
      );
      return;
    }
    try {
      mongodbUrl = process.env.MONGODB_URI;
      // Connect to MongoDB
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);

      // Fetch all teams from the database
      const teams = await Team.find();

      console.log('Teams:', teams); // Log teams to the console

      // Create an embed for the reply
      const teamsListEmbed = new EmbedBuilder()
        .setColor('#3498db') // Set the embed color
        .setTitle('List of Teams')
        .setDescription('Here is a list of all the teams:')
        .addFields(
          ...(await Promise.all(
            teams.map(async team => {
              const leader = await User.findOne({ userID: team.teamLeaderID });
              const member1 = await User.findOne({ userID: team.member1ID });
              const member2 = await User.findOne({ userID: team.member2ID });
              const member3 = await User.findOne({ userID: team.member3ID });
              const member4 = await User.findOne({ userID: team.member4ID });

              return {
                name: `Team: ${team.teamName}`,
                value: `**Leader:** ${
                  leader ? leader.username : 'Unknown User'
                }\n**Members:** ${
                  member1 ? member1.username : 'Unknown User'
                }, ${member2 ? member2.username : 'Unknown User'}, ${
                  member3 ? member3.username : 'Unknown User'
                }, ${
                  member4 ? member4.username : 'Unknown User'
                }\n**Total Studytime: **${msToHumanTime(team.totalTime)}\n `,
              };
            })
          ))
        );

      interaction.reply({ embeds: [teamsListEmbed] });
    } catch (error) {
      console.error('Error listing teams:', error);
      interaction.reply('An error occurred while processing the command. ☹️');
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  },
};
