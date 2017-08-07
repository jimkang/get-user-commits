var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var pathExists = require('object-path-exists');
var isAGitHubRateLimitErrorMessage = require('./is-a-github-rate-limit-error-message');
var getGQLReqOpts = require('./get-gql-req-opts');

function GetRepos({baseURL = 'https://api.github.com', token, userAgent, request}) {
  const apiURL = baseURL + '/graphql';

  return getRepos;

  function getRepos({username, shouldIncludeRepo, onRepo, onNonFatalError}, done) {
    var lastRepoCursor;
    var repos = [];

    postNextQuery();

    function postNextQuery() {
      request(
        getGQLReqOpts({
          apiURL: apiURL,
          token: token,
          userAgent: userAgent,
          query: getRepoQuery(username, lastRepoCursor)
        }),
        sb(handleRepoResponse, done)
      );
    }

    function handleRepoResponse(res, body) {
      if (body.errors) {
        if (onNonFatalError) {
          onNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
        }
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing
          done(new Error('Rate limit error'));
          return;
        }
      }
      else if (pathExists(body, ['data', 'user', 'repositories', 'nodes'])) {
        body.data.user.repositories.nodes.forEach(collectRepository);
      }

      if (pathExists(body, ['data', 'user', 'repositories', 'pageInfo']) &&
        body.data.user.repositories.pageInfo.hasNextPage) {

        lastRepoCursor = body.data.user.repositories.pageInfo.endCursor;
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done, null, repos);
      }
    }

    function collectRepository(repo) {
      if (typeof shouldIncludeRepo !== 'function' || shouldIncludeRepo(repo)) {
        repo.lastCheckedDate = (new Date()).toISOString();
        repos.push(repo);
        if (onRepo) {
          onRepo(repo);
        }
      }
    }
  }
}

function getRepoQuery(username, lastCursor) {
  var afterSegment = '';
  if (lastCursor) {
    afterSegment = `, after: "${lastCursor}"`;
  }
  return `{
    user(login: "${username}") {
      repositories(first: 100${afterSegment}) {
        nodes {
          name
          id
          pushedAt
          description
        },
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }
  }`;
}

module.exports = GetRepos;
