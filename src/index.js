require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const mongoose = require('mongoose');
const { Team, User, Session } = require('./utils/schemas');
const msToHumanTime = require('./utils/msToHumanTime');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
  ],
});

// Listen for the voiceStateUpdate event
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  console.log('entered');
  console.log(oldState.channelId);
  console.log(newState.channelId);

  // Check if the member is leaving a voice channel
  if (oldState.channelId && !newState.channelId) {
    try {
      const mongodbUrl = process.env.MONGODB_URI;
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongodbUrl);

      // Find the ongoing study session for the leaving member
      const leavingSession = await Session.findOne({
        userID: member.id,
        ongoing: true, // Only consider ongoing sessions
      });
      console.log(leavingSession);
      if (leavingSession) {
        // If a session is ongoing, update the end time and total time
        leavingSession.endTime = Date.now();
        leavingSession.ongoing = false; // Mark the session as terminated
        // Calculate the study time and update the session
        const studyTimeMilliseconds =
          leavingSession.endTime - leavingSession.startTime;
        leavingSession.timeThisSession = studyTimeMilliseconds;

        await leavingSession.save();

        console.log(
          `Study session for ${member.user} stopped. Studied for ${studyTimeMilliseconds} milliseconds.`
        );

        // Get the designated channel by ID
        const designatedChannel = client.channels.cache.get(
          '1167161954352246799'
        );
        if (designatedChannel) {
          // Send a message to the designated channel about the session being stopped
          designatedChannel.send(
            `Study session for ${
              member.user.tag
            } stopped. Studied for ${msToHumanTime(studyTimeMilliseconds)}`
          );
        } else {
          console.error('Designated channel not found.');
        }

        // Update the user's total study time
        const user = await User.findOne({ userID: member.id });
        if (user) {
          await User.updateOne(
            { userID: member.id },
            {
              $set: {
                totalTime:
                  parseInt(user.totalTime) + parseInt(studyTimeMilliseconds),
                timeToday:
                  parseInt(user.timeToday) + parseInt(studyTimeMilliseconds),
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
                    parseInt(team.totalTime) + parseInt(studyTimeMilliseconds),
                },
              }
            );
          }
        } else {
          console.error('User not found in the database.');
        }
      }
    } catch (error) {
      console.error('Error handling voiceStateUpdate:', error);
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  }
});

eventHandler(client);

client.login(process.env.TOKEN);
