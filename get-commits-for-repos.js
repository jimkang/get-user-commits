var getCommitQuery = require('./get-commit-query');
var sb = require('standard-bail')();
var isAGitHubRateLimitErrorMessage = require('./is-a-github-rate-limit-error-message');
var callNextTick = require('call-next-tick');
var pathExists = require('object-path-exists');
var getGQLReqOpts = require('./get-gql-req-opts');
var pluck = require('lodash.pluck');
var curry = require('lodash.curry');
var findWhere = require('lodash.findwhere');
var compact = require('lodash.compact');

function GetCommitsForRepos({
    baseURL = 'https://api.github.com',
    token = 'default',
    userEmail,
    request,
    userAgent,
    queryLogger
  }) {

  const apiURL = baseURL + '/graphql';
  return getCommitsForRepos;

  function getCommitsForRepos(
    {
      onCommitsForRepo,
      onNonFatalError,
      repos // Objects with a `name` property.
    },
    done) {

    var reposThatHaveCommitsToGet = repos.slice();
    postNextQuery();

    function postNextQuery() {
      var query = getCommitQuery(
        reposThatHaveCommitsToGet, userEmail
      );
      if (queryLogger) {
        queryLogger('query', query);
      }
      request(
        getGQLReqOpts({apiURL: apiURL, token: token, userAgent: userAgent, query: query}),
        sb(handleCommitResponse, done)
      );
    }

    function handleCommitResponse(res, body, done) {
      if (!body) {
        passNonFatalError(new Error('Empty body received from commit request.'));
      }
      else if (body.errors) {
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing.
          callNextTick(done, new Error('Rate limit error'));
          return;
        }
        passNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
      }
      else if (!pathExists(body, ['data', 'viewer'])) {
        passNonFatalError(
          new Error('Could not get data/viewer from commit query response body.')
        );
      }
      else if (res.statusCode < 200 || res.statusCode > 299) {
        passNonFatalError(new Error('Error from GitHub API: ' + res.statusCode + ', ' + body));
      }
      else {
        updateStateWithQueryResult(
          body.data.viewer, reposThatHaveCommitsToGet, onCommitsForRepo
        );
      }

      if (compact(pluck(reposThatHaveCommitsToGet, 'lastCursor')).length > 0) {
        // console.log('last cursors:', compact(pluck(reposThatHaveCommitsToGet, 'lastCursor')));
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
    }

    function passNonFatalError(error) {
      if (onNonFatalError) {
        onNonFatalError(error);
      }
    }
  }
}

function updateStateWithQueryResult(
  viewer, reposThatHaveCommitsToGet, onCommitsForRepo) {

  for (var queryId in viewer) {
    let queryResult = viewer[queryId];
    if (queryResult) {
      let repoName = queryResult.defaultBranchRef.repository.name;
      let pageInfo = queryResult.defaultBranchRef.target.history.pageInfo;
      let repo = findWhere(reposThatHaveCommitsToGet, {name: repoName});
      if (pageInfo.hasNextPage) {
        repo.lastCursor = pageInfo.endCursor;
      }
      else {
        delete repo.lastCursor;
        repo.weHaveTheOldestCommit = true;
      }

      let commits = pluck(queryResult.defaultBranchRef.target.history.edges, 'node');
      commits.forEach(curry(appendRepoNameToCommit)(repo.name));
      onCommitsForRepo(repo.name, commits);
    }
  }
}

function appendRepoNameToCommit(name, commit) {
  commit.repoName = name;
}

module.exports = GetCommitsForRepos;
