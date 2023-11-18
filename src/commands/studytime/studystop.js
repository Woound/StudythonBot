const mongoose = require('mongoose');
const commandCooldown = require('../../utils/commandCooldown');
const msToHumanTime = require('../../utils/msToHumanTime');
const { Team, User } = require('../../utils/schemas');
const {
  isInAllowedChannel,
  allowedChannelId,
} = require('../../utils/channelCheck');
const isUserInDatabase = require('../../utils/userCheck');

module.exports = {
  name: 'studystop',
  description: 'Stops the study timer, concluding your study session.',
  deleted: false,
  callback: async (client, interaction) => {
    const userID = interaction.user.id;
    const member = interaction.member;

    // // Check for command cooldown
    // const isCooldownApplied = await commandCooldown(userID, interaction);
    // if (isCooldownApplied) {
    //   return; // Exit callback function if cooldown is applied
    // }

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

    // Connect to the MongoDB database using Mongoose
    try {
      const mongodbUrl = process.env.MONGODB_URI;
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);

      const Session = mongoose.model('Session');

      // Find the ongoing study session
      const studySession = await Session.findOne({ userID, endTime: null });

      if (studySession) {
        const { startTime } = studySession;
        const endTime = Date.now();
        const timeThisSession = endTime - startTime;

        // Update the study session with the end time
        await Session.updateOne(
          { userID, endTime: null },
          {
            $set: {
              endTime,
              timeThisSession,
              ongoing: false,
            },
          }
        );

        // Update the user's total study time
        const user = await User.findOne({ userID });
        if (user) {
          await User.updateOne(
            { userID },
            {
              $set: {
                totalTime: parseInt(user.totalTime) + parseInt(timeThisSession),
                timeToday: parseInt(user.timeToday) + parseInt(timeThisSession),
              },
            }
          );

          // Update the team's total study time
          const teamID = user.teamID; // Assuming user.teamID is the team's _id
          const team = await Team.findOne({ _id: teamID }); // Use _id to query the team
          if (team) {
            await Team.updateOne(
              { _id: teamID },
              {
                $set: {
                  totalTime:
                    parseInt(team.totalTime) + parseInt(timeThisSession),
                },
              }
            );
          }

          // Reply with the amount of time the user studied for the session.
          interaction.reply(
            `Study time stopped! You studied for ${msToHumanTime(
              timeThisSession
            )}`
          );
        } else {
          interaction.reply('User not found in the database.');
        }
      } else {
        interaction.reply(
          'You have not started studying. Use `/studystart` to begin.'
        );
      }
    } catch (error) {
      console.error('Error retrieving/updating study session:', error);
      interaction.reply('An error occurred while processing the command.');
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  },
};
