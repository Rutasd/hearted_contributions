export default async function getAllHeartedReactions({ octokit }, url) {
  if (/\/pulls\/\d+$/.test(url)) {
    url = url.replace(/\/pulls\//, "/issues/");
  }

  const reactions = await octokit.paginate({
    url: `${url}/reactions`,
    content: "heart",
    per_page: 100,
  });

  // Create a Map to store users and their hearted reactions
  const userReactionsMap = new Map();

  // Iterate through the reactions and populate the userReactionsMap
  reactions.forEach((reaction) => {
    const userLogin = reaction.user.login;
    const userReactions = userReactionsMap.get(userLogin) || [];
    userReactions.push(reaction);
    userReactionsMap.set(userLogin, userReactions);
  });

  return userReactionsMap;
}
