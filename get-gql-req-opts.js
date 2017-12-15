function getGQLReqOpts({ apiURL, token, userAgent, query }) {
  var opts = {
    method: 'POST',
    url: apiURL,
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: {
      query: query
    },
    json: true
  };
  if (userAgent) {
    opts.headers['User-Agent'] = userAgent;
  }
  return opts;
}

module.exports = getGQLReqOpts;
