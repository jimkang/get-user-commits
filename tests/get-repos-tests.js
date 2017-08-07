var test = require('tape');
var assertNoError = require('assert-no-error');
var request = require('request');
var config = require('../test-config');
var GetRepos = require('../get-repos');

test('Get repos', getReposTest);

function getReposTest(t) {
  var repoCount = 0;

  var createOpts = {
    token: config.githubTestToken,
    request: request,
    userAgent: 'observatory-tests'
  };

  var opts = {
    username: 'jimkang',
    onNonFatalError: logNonFatalError,
    onRepo: checkRepo,
    shouldIncludeRepo: filterRepo
  };

  var getRepos = GetRepos(createOpts);
  getRepos(opts, checkFinalResults);

  function checkRepo(repo) {
    repoCount += 1;
    t.ok(repo.name, 'Repo has a name.');
    t.ok(repo.name !== 'KIF', 'Repo is not a repo that should have been filtered out.');
    t.ok(repo.pushedAt, 'Repo has a pushedAt date.');
    t.ok(repo.lastCheckedDate, 'Repo has a lastCheckedDate.');
  }

  function checkFinalResults(error, repos) {
    console.log('Repos dump:');
    console.log(JSON.stringify(repos, null, '  '));
    console.log('End repos dump.');

    assertNoError(t.ok, error, 'No error while getting repos.');
    t.equal(
      repos.length,
      repoCount,
      'Final repo count same as the emitted repo count.'
    );
    t.end();
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}

function filterRepo(repo) {
  return repo.name !== 'KIF';
}
