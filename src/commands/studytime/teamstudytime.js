const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const msToHumanTime = require('../../utils/msToHumanTime');
const { Team, User } = require('../../utils/schemas');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');
const isUserInDatabase = require('../../utils/userCheck');

module.exports = {
  name: 'teamstudytime',
  description: 'View the total amount of time your team has studied.',
  deleted: false,
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
        const teamID = user.teamID;

        if (teamID) {
          // Find the team in the database
          const team = await Team.findOne({ _id: teamID });

          if (team) {
            // Fetch study time for each member from the user table
            const members = await Promise.all(
              [
                team.teamLeaderID,
                team.member1ID,
                team.member2ID,
                team.member3ID,
                team.member4ID,
              ]
                .filter(Boolean)
                .map(async memberID => {
                  const member = await User.findOne({ userID: memberID });
                  return {
                    userName: member ? member.username : 'N/A',
                    studyTime: member ? member.totalTime : 'N/A',
                  };
                })
            );

            // Calculate the total study time for the team
            const totalStudyTime = members.reduce(
              (total, member) => total + (parseInt(member.studyTime) || 0), // Handle 'N/A' case
              0
            );

            // console.log('Total Study Time:', totalStudyTime);

            // Create an embed for the reply
            const teamStudyTimeEmbed = new EmbedBuilder()
              .setColor('#3498db') // Set the embed color
              .setTitle(
                `Team Study Time for ${team.teamName}\nTotal: ${msToHumanTime(
                  totalStudyTime
                )}
                `
              )
              .setDescription('Here is the study time for each team member:')
              .addFields(
                ...members.map(member => ({
                  name: `Member: ${
                    member.userName === team.teamLeaderID
                      ? 'Leader'
                      : member.userName
                  }`,
                  value: `Study Time: ${
                    parseInt(member.studyTime) == 0
                      ? '0'
                      : msToHumanTime(parseInt(member.studyTime))
                  }`,
                }))
              );

            interaction.reply({ embeds: [teamStudyTimeEmbed] });
          } else {
            interaction.reply('No team data found for the user.');
          }
        } else {
          interaction.reply('User is not currently part of a team.');
        }
      } else {
        interaction.reply('No user data found for the command.');
      }
    } catch (error) {
      console.error(
        'An error occurred while displaying team study time',
        error
      );
      interaction.reply(
        'An error occurred while retrieving your team study time data.'
      );
    } finally {
      // Close MongoDB Connection
      await mongoose.connection.close();
    }
  },
};
