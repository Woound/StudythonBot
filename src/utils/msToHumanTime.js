module.exports = duration => {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  let days = Math.floor(duration / (1000 * 60 * 60 * 24));

  const daysDisplay = days > 0 ? days + ' days ' : '';
  const hoursDisplay = hours > 0 ? hours + ' hours ' : '';
  const minutesDisplay = minutes > 0 ? minutes + ' minutes ' : '';
  const secondsDisplay = seconds > 0 ? seconds + ' seconds ' : '';

  return daysDisplay + hoursDisplay + minutesDisplay + secondsDisplay;
};
