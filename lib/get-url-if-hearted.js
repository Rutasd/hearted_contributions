export default async function getUrlIfHearted({ octokit }, url) {
  if (/\/pulls\/\d+$/.test(url)) {
    url = url.replace(/\/pulls\//, "/issues/");
  }

  // Fetch all heart reactions for the given URL
  const reactions = await octokit.paginate({
    url: `${url}/reactions`,
    content: "heart",
    per_page: 100,
  });

  // Extract all users who gave a heart reaction
  const heartedUsers = reactions.map(reaction => reaction.user.login);

  if (heartedUsers.length === 0) {
    return null;
  }

  const {
    data: { html_url: itemUrl },
  } = await octokit.request(url);

  return {
    [itemUrl]: heartedUsers
  };
}
