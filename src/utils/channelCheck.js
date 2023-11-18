// channelCheck.js
const allowedChannelId = '1175404975258615819'; // Add your allowed channel ID here

function isInAllowedChannel(channelId) {
  return channelId === allowedChannelId;
}

module.exports = {
  isInAllowedChannel,
  allowedChannelId,
};
