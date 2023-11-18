let timeout = []; // Used to prevent command spam.
const cooldown = 15000; // Cooldown, can be changed to accommodate user preference.

module.exports = async (memberId, interaction) => {
  if (timeout.includes(memberId))
    return await interaction.reply({
      content: `You are on a cooldown, try again in ${cooldown / 1000} seconds`,
      ephemeral: true,
    });
  timeout.push(memberId);
  setTimeout(() => {
    timeout.shift();
  }, cooldown);
  return false; // No cooldown applied
};
