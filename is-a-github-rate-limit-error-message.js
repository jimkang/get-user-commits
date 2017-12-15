function isAGitHubRateLimitErrorMessage(messageObject) {
  return (
    messageObject &&
    messageObject.message &&
    messageObject.message.startsWith('API rate limit exceeded for')
  );
}

module.exports = isAGitHubRateLimitErrorMessage;
