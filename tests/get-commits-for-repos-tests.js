var test = require('tape');
var assertNoError = require('assert-no-error');
var request = require('request');
var config = require('../test-config');
var GetCommitsForRepos = require('../get-commits-for-repos');
var findWhere = require('lodash.findwhere');

test('Get commits', getCommitsTest);

function getCommitsTest(t) {
  var repoCount = 0;
  var commitCount = 0;

  var createOpts = {
    token: config.githubTestToken,
    userEmail: 'jimkang@gmail.com',
    request: request,
    userAgent: 'observatory-tests'
  };

  var opts = {
    repos: [
      {
        name: 'exogenite',
        commits: [
          {
            committedDate: (new Date('2017-03-10')).toISOString()
          },
          {
            committedDate: (new Date('2017-03-13')).toISOString()
          }
        ],
        isValid: true
      },
      {
        name: 'toptracks',
        isValid: true
      },
      {
        name: 'plane-data',
        isValid: false
        // This repo has no default branch. It should handle this.
      }
    ],
    onCommitsForRepo: checkCommits,
    onNonFatalError: logNonFatalError
  };

  var getCommitsForRepos = GetCommitsForRepos(createOpts);
  getCommitsForRepos(opts, checkFinalResults);

  function checkCommits(repoName, commits) {
    repoCount += 1;
    t.ok(
      findWhere(opts.repos, {name: repoName}),
      'Repo is one of the ones we asked for.'
    );
    commits.forEach(checkCommit);
  }

  function checkCommit(commit) {
    commitCount += 1;
    t.ok(commit.message, 'Commit has a message.');
    t.ok(commit.abbreviatedOid, 'Commit has an abbreviatedOid.');
    t.ok(commit.committedDate, 'Commit has a date.');
    t.ok(commit.repoName, 'Commit has a repoName');
    // console.log('commit', commit);
  }

  function checkFinalResults(error) {    
    assertNoError(t.ok, error, 'No error while getting commits.');
    t.equal(opts.repos.filter(repo => repo.isValid).length, repoCount, 'Final repo count is correct.');
    t.equal(commitCount, 8, 'Final commit count is correct.');
    t.end();
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}
