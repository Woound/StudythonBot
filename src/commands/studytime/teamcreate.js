const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { Team, User } = require('../../utils/schemas');
const isAdmin = require('../../utils/adminCheck');

// Function to check if a given string is a valid Discord user ID
function isValidUserID(id) {
  const regex = /^\d{17,19}$/; // Discord user IDs are 17-19 digits
  return regex.test(id);
}

const mongodbUrl = process.env.MONGODB_URI;

module.exports = {
  name: 'teamcreate',
  description: 'Creates a new team with a team leader.',
  options: [
    {
      name: 'team-name',
      description: 'The name of the team you want to create.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'team-leader-id',
      description: 'The ID of the user that will be the team leader.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'team-member1-id',
      description: 'The ID of the member to add to the team.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'team-member2-id',
      description: 'The ID of the member to add to the team.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'team-member3-id',
      description: 'The ID of the member to add to the team.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'team-member4-id',
      description: 'The ID of the member to add to the team.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const member = interaction.member;
    if (!isAdmin(member)) {
      interaction.reply('You do not have permission to use this command.');
      return;
    }
    try {
      // Storing the options (parameters) given to the command.
      const teamName = interaction.options.get('team-name').value.trim();
      const teamLeaderID = interaction.options
        .get('team-leader-id')
        .value.trim();
      const teamMember1ID = interaction.options
        .get('team-member1-id')
        .value.trim();
      const teamMember2ID = interaction.options
        .get('team-member2-id')
        .value.trim();
      const teamMember3ID = interaction.options
        .get('team-member3-id')
        .value.trim();
      const teamMember4ID = interaction.options
        .get('team-member4-id')
        .value.trim();

      // Validate all user IDs
      if (
        ![
          teamLeaderID,
          teamMember1ID,
          teamMember2ID,
          teamMember3ID,
          teamMember4ID,
        ].every(isValidUserID)
      ) {
        interaction.reply('Invalid user ID provided!');
        return;
      }

      // Checking if the specified user exists in the guild
      const guild = await client.guilds.fetch(process.env.GUILD_ID);

      try {
        // Fetch team members
        const teamLeader = await guild.members.fetch(teamLeaderID);
        const member1 = await guild.members.fetch(teamMember1ID);
        const member2 = await guild.members.fetch(teamMember2ID);
        const member3 = await guild.members.fetch(teamMember3ID);
        const member4 = await guild.members.fetch(teamMember4ID);

        // Connect to MongoDB
        mongoose.set('strictQuery', false);
        await mongoose.connect(mongodbUrl);

        // Check if a team with the same name already exists
        const existingTeam = await Team.findOne({ teamName });

        if (existingTeam) {
          interaction.reply('A team with the same name already exists!');
          return;
        }

        // Create a new team
        const newTeam = new Team({
          teamLeaderID: teamLeaderID,
          teamName: teamName,
          member1ID: teamMember1ID,
          member2ID: teamMember2ID,
          member3ID: teamMember3ID,
          member4ID: teamMember4ID,
          totalTime: 0,
        });

        // Save the new team to the database
        await newTeam.save();

        // Check if members are already part of a team
        const users = await User.find({
          userID: {
            $in: [
              teamLeaderID,
              teamMember1ID,
              teamMember2ID,
              teamMember3ID,
              teamMember4ID,
            ],
          },
        });

        const usersInTeam = users.filter(
          user => user.teamID !== null && user.teamID !== undefined
        );

        if (usersInTeam.length > 0) {
          const usernames = usersInTeam.map(user => user.username).join(', ');
          interaction.reply(
            `One or more members (${usernames}) are already part of a team!`
          );
          return;
        }

        // Create/update users with the teamID
        const updateUserPromises = [
          User.updateOne(
            { userID: teamLeaderID },
            { username: teamLeader.user.username, teamID: newTeam._id },
            { upsert: true }
          ),
          User.updateOne(
            { userID: teamMember1ID },
            { username: member1.user.username, teamID: newTeam._id },
            { upsert: true }
          ),
          User.updateOne(
            { userID: teamMember2ID },
            { username: member2.user.username, teamID: newTeam._id },
            { upsert: true }
          ),
          User.updateOne(
            { userID: teamMember3ID },
            { username: member3.user.username, teamID: newTeam._id },
            { upsert: true }
          ),
          User.updateOne(
            { userID: teamMember4ID },
            { username: member4.user.username, teamID: newTeam._id },
            { upsert: true }
          ),
        ];

        // Wait for all the updates to complete
        await Promise.all(updateUserPromises);

        // Create an embed for the reply
        const teamMembersEmbed = new EmbedBuilder()
          .setColor('#3498db') // Set the embed color
          .setTitle(`Team "${teamName}" successfully created with members:`)
          .addFields(
            { name: 'Team Leader', value: teamLeader.user.tag },
            { name: 'Member 1', value: member1.user.tag },
            { name: 'Member 2', value: member2.user.tag },
            { name: 'Member 3', value: member3.user.tag },
            { name: 'Member 4', value: member4.user.tag }
          );

        interaction.reply({ embeds: [teamMembersEmbed] });
      } catch (error) {
        if (error.code === 10013) {
          // User not found (error code 10013)
          interaction.reply('One or more users not found in the guild!');
        } else {
          // Other error, log it
          console.error('Error fetching member:', error);
          interaction.reply(
            'An error occurred while processing the command. ☹️'
          );
        }
      }
    } catch (error) {
      console.error('Error creating the team  ☹️: ', error);
      interaction.reply('An error occurred while processing the command. ☹️');
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
    }
  },
};
