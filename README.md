get-user-commits
==================

Uses the GitHub API to get all of user's commits via a series of successive requests. Caveat: Credentials often do not let a user see other users' commits.

Installation
------------

    npm install get-user-commits

Usage
-----

    var getUserCommits = require('get-user-commits');
    var request = require('request');

    var reposWeAlreadyHaveSomeOfTheCommitsFor = [
      {
        "name": "signrequest",
        "id": "MDEwOlJlcG9zaXRvcnk5ODIwNTU0",
        "pushedAt": "2013-05-02T19:06:33Z",
        "description": "JavaScript utility for signing OAuth or xAuth requests with HMAC-SHA1 in the browser.",
        "lastCheckedDate": "2017-06-18T16:59:05.058Z"
      },
      {
        "name": "boxadder",
        "id": "MDEwOlJlcG9zaXRvcnk4NDAyMDcy",
        "pushedAt": "2013-03-12T18:26:28Z",
        "description": "An app that calculates the sums of items in boxes and updates all other client instances about its changes. A test drive of Meteor, svg, and d3.js.",
        "lastCheckedDate": "2017-06-18T16:59:05.057Z"
      }
    ];

    var getUserCommitsOpts = {
      token: githubToken,
      'jimkang',
      'jimkang@gmail.com',
      request,
      'legitimate-app',
      onNonFatalError,
      shouldIncludeRepo: filterRepo,
      existingRepos: reposWeAlreadyHaveSomeOfTheCommitsFor,
      onRepo: logRepo,
      onCommit: logCommit
    };

    getUserCommits(
      getUserCommitsOpts,
      done
    );

    function logNonFatalError(error) {
      console.log('An error happened, but not one that will stop the rest of the commits from getting fetched:', error);
    }

    function filterRepo(repo) {
      return repo.name !== 'project-that-we-should-ignore';
    }

    function logRepo(repo) {
      console.log(repo);
      // repo will look like:
      // {
      //   "name": "boxadder",
      //   "id": "MDEwOlJlcG9zaXRvcnk4NDAyMDcy",
      //   "pushedAt": "2013-03-12T18:26:28Z",
      //   "description": "An app that calculates the sums of items in boxes and updates all other client instances about its changes. A test drive of Meteor, svg, and d3.js.",
      //   "lastCheckedDate": "2017-06-18T16:59:05.057Z"
      // }      
    }

    function logCommit(commit) {
      console.log(commit);
      // commit will look like:
      // {
      //   "abbreviatedOid": "6812aea",
      //   "message": "Increased the zoom out extent.",
      //   "committedDate": "2013-03-12T18:25:01Z",
      //   "repoName": "boxadder"
      // }      
    }

    function done(error) {
      if (error) {
        console.log(error);
      }
      else {
        console.log('All commits emitted!');
      }
    }

[Some notes about the GitHub GraphQL API in case you want to make something like this.](https://github.com/jimkang/knowledge/blob/master/graphql.md)

Plug in your own request library
---------------------------------

In this example, [request](https://github.com/request/request) for the `request` param. If you want to specify a different http request function to handle that, you can by passing it to the constructor. Like `request`, your function needs to:

    - Take an opt object that has `url` and `method` properties.
    - Take a callback that will be passed an error, a response object (can be null), and a parsed JSON body.

Example:

    function myRequestFunction(opts, callback) {
      var responseString = '';

      var httpOpts = url.parse(opts.url);
      httpOpts.method = opts.method;

      var req = https.request(httpOpts, handleResponseEvents);
      req.on('error', respondToError);
      req.end();

      function handleResponseEvents(res) {
        res.setEncoding('utf8');
        res.on('data', function receiveChunk(chunk) {
          responseString += chunk;
        });
        res.on('end', function endData() {
          callback(null, res, JSON.parse(responseString));
        });
      }

      function respondToError(error) {
        callback(error);
      }
    }

In the browser, I use [basic-browser-request](https://www.npmjs.com/package/basic-browser-request) for this, myself.

Tests
-----

So, the following issue creates a bit of a problem for some of these tests, which I feel are good enough, but are not unit tests, in that they hit the actual GitHub API:

- A user cannot see another user's commits, even if the repos are public, unless they have access to that repo. For example, masschildcaredata cannot see jimkang's commits in observatory, but it can see jimkang's commits in masschildcaredata.github.io. Oddly enough, jimkang seems to be able to see mbostock's commits in d3-queue, probably because I made a PR to that repo.

The tests look for commits in repos under `jimkang`, which most of you don't have access to via the GitHub API, even though they are public and freely viewable on github.com or after cloning the repos.

Here's how I run the tests currently:

- [Create a personal access token](https://github.com/settings/tokens) that has `repo:status` and `public_repo` scopes.
- Put the token in a `test-config.js` file that looks like this:

    var config = {
      githubTestToken: 'Personal access token goes here.'
    };

    module.exports = config;

- Run `make test` for simple, fast tests.
- Run `make test-long` for a test that grabs the commits for ~300 repos.
- Run `make test-long-sequential` to test continuing to get new commits for repos that we only got some of the commits for on previous runs. (Testing the `existingRepos` optional param.)

If you forked this project and wanted to test with a different set of repos, you'd need to change the user and repos targeted in the tests, as well as the `previous-run-repo-states-*.json` files under `tests/long/data`. Pull requests welcome regarding tests that'd work for everyone!

(Also a thing to watch when running these tests is that when you do a lot of runs in a short amount of time, you may hit your GitHub API rate limit.)

License
-------

The MIT License (MIT)

Copyright (c) 2017 Jim Kang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
