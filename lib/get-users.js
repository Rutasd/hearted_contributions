export default async function getUsersContributedToOrgRepos({ octokit, owner }) {
    const repoNames = await getRepositories({ octokit, owner });
    const usersContributed = new Set();
  
    for (const repoName of repoNames) {
      try {
        const contributors = await octokit.paginate(
          octokit.rest.repos.listContributors,
          {
            owner,
            repo: repoName,
            per_page: 100,
          }
        );
  
        contributors.forEach((contributor) => {
          usersContributed.add(contributor.login);
        });
      } catch (error) {
        console.error(
          `Error fetching contributors for ${owner}/${repoName}: ${error.message}`
        );
      }
    }
  
    return Array.from(usersContributed);
  }