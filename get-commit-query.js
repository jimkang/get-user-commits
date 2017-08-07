var randomId = require('idmaker').randomId;
var pluck = require('lodash.pluck');

const nonAlphanumericRegex = /[^\w]/g;

function getCommitQuery(repos, userEmail) {
  return `{
    viewer {
      ${repos.map(getRepoCommitSubquery).join('\n')}
    }
  }

  fragment CommitHistoryFields on CommitHistoryConnection {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        abbreviatedOid
        message
        committedDate
      }
    }
  }`;

  function getRepoCommitSubquery(repo) {
    var whereClause = getWhereClause(repo);

    return `
    ${randomId(4)}_${sanitizeAsGQLId(repo.name)}: repository(name: "${repo.name}") {
      defaultBranchRef {
        id
        repository {
          name
        }
        target {
          ... on Commit {
            id
            history(author: {emails: "${userEmail}"}, first: 20 ${whereClause}) {
              ...CommitHistoryFields
            }
          }
        }
      }
    }
  `;
  }
}

function sanitizeAsGQLId(s) {
  return s.replace(nonAlphanumericRegex, '');
}

function getWhereClause(repo) {
  var whereClause = '';
  if (repo.commits && repo.commits.length > 0) {
    var oldestToNewestDates = pluck(repo.commits, 'committedDate').sort();
    // If repo.weHaveTheOldestCommit is set, always seek new commits.
    // Otherwise, seek older commits.
    if (repo.weHaveTheOldestCommit) {
      if (repo.lastCursor) {
        whereClause = `after: "${repo.lastCursor}"`;
      }
      else {
        var since = adjustDateString(
          oldestToNewestDates[oldestToNewestDates.length -1], 1
        );
        whereClause = `since: "${since}"`;
      }
    }
    else {
      var until = adjustDateString(oldestToNewestDates[0], -1);
      whereClause = `until: "${until}"`;
    }
  }
  return whereClause;
}

function adjustDateString(isoString, adjustmentInSeconds) {
  return (new Date((new Date(isoString)).getTime() + adjustmentInSeconds * 1000))
    .toISOString();
}

module.exports = getCommitQuery;
