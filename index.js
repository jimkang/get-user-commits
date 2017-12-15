var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var findWhere = require('lodash.findwhere');
var defaults = require('lodash.defaults');
var splitArray = require('split-array');
var queue = require('d3-queue').queue;
var GetCommitsForRepos = require('./get-commits-for-repos');
var GetRepos = require('./get-repos');

function getUserCommits(
  {
    baseURL = 'https://api.github.com',
    token,
    username,
    userEmail,
    request,
    existingRepos = [],
    onRepo,
    onCommit,
    onNonFatalError,
    userAgent,
    shouldIncludeRepo,
    getCommitsForRepos,
    queryLogger
  },
  allDone
) {
  var collectedRepos = [];

  var getRepos = GetRepos({
    baseURL,
    token,
    userAgent,
    request
  });

  if (!getCommitsForRepos) {
    getCommitsForRepos = GetCommitsForRepos({
      token,
      userEmail,
      request,
      userAgent,
      queryLogger
    });
  }

  getRepos(
    { username, shouldIncludeRepo, onRepo, onNonFatalError },
    sb(callGetCommits, passRepos)
  );

  function callGetCommits(repos) {
    var reposNewestToOldest = repos.sort(compareRepoDates);
    reposNewestToOldest.forEach(reconcileRepo);
    collectedRepos = collectedRepos.concat(reposNewestToOldest);
    var repoGroups = splitArray(reposNewestToOldest, 10);
    var q = queue(1);
    repoGroups.forEach(queueGet);

    q.awaitAll(passRepos);

    function queueGet(repoGroup) {
      q.defer(getCommitsForRepos, {
        repos: repoGroup,
        onCommitsForRepo: collectCommits,
        onNonFatalError: onNonFatalError
      });
    }

    function collectCommits(repoName, commits) {
      var repo = findWhere(repos, { name: repoName });
      if (!repo.commits) {
        repo.commits = [];
      }

      commits.forEach(addCommit);

      function addCommit(commit) {
        commit.repoName = repoName;
        repo.commits.push(commit);
        if (onCommit) {
          onCommit(commit);
        }
      }
    }
  }

  function reconcileRepo(repo) {
    var existingRepo = findWhere(existingRepos, { name: repo.name });
    if (existingRepo) {
      repo = defaults(repo, existingRepo);
    }
    return repo;
  }

  function passRepos(error) {
    callNextTick(allDone, error, collectedRepos);
  }
}

// Newer dates are to come earlier in the array.
function compareRepoDates(a, b) {
  return a.pushedAt > b.pushedAt ? -1 : 1;
}

module.exports = getUserCommits;
