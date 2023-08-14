import { Octokit } from "octokit";

import getLastUpdateTimestamp from "./lib/get-last-update-timestamp.js";
import getRepositories from "./lib/get-repositories.js";
import getIssuesAndPullRequestsForRepository from "./lib/get-issues-and-pull-requests-for-repository.js";
import getCommentsForIssueOrPullRequestUrl from "./lib/get-comments-for-issue-or-pull-request-url.js";
import getCommitCommentsForRepository from "./lib/get-commit-comments-for-repository.js";
import getUsersWhoHearted from "./lib/get-users-who-hearted.js";  // renamed function
import cachePlugin from "./lib/cache-plugin.js";

export default async function findHeartedContributions(options) {
  if (!/^https:\/\/github\.com\/.+$/.test(options.in)) {
    throw new TypeError(
      '"in" option must be a valid GitHub repo or organization url (e.g. "https://github.com/octokit" or "https://github.com/octokit/octokit.js")'
    );
  }

  const MyOctokit = options.cache ? Octokit.plugin(cachePlugin) : Octokit;
  const octokit = new MyOctokit({
    auth: options.token,
  });

  octokit.hook.before("request", () => {
    process.stdout.write(".");
  });

  const owner = options.in.substring("https://github.com/".length);

  const state = {
    octokit,
    owner,
    issuesAndPullRequestUrls: [],
    commentsUrls: [],
    comments: [],
    repoOnly: owner.split("/")[1],
    repositories: [],
    ...options,
  };

  state.since = await getLastUpdateTimestamp(state);

  if (state.repoOnly) {
    state.owner = state.owner.split("/")[0];
    state.repositories = [state.repoOnly];
  } else {
    state.repositories = await getRepositories(state);
  }

  for (const repositoryName of state.repositories) {
    const issuesAndPullRequestUrls =
      await getIssuesAndPullRequestsForRepository(state, repositoryName);
    state.issuesAndPullRequestUrls.push(...issuesAndPullRequestUrls);

    const commentUrls = await getCommitCommentsForRepository(
      state,
      repositoryName
    );
    state.commentsUrls.push(...commentUrls);
  }

  const heartedInfo = {};  // This will map URLs to arrays of users

  for (const url of [
    ...state.issuesAndPullRequestUrls,
    ...state.commentsUrls,
  ]) {
    const urlUsers = await getUrlIfHearted(state, url);
    if (urlUsers) {
      Object.assign(heartedInfo, urlUsers);
    }
  }

  // Let's log the data as you requested
  for (const [url, users] of Object.entries(heartedInfo)) {
    console.log(`URL: ${url}`);
    console.log(`Users who hearted: ${users.join(', ')}`);
  }

  return heartedInfo;
}
