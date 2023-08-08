#!/usr/bin/env node

import yargs from "yargs";
import csvWriter from "csv-writer";
import findHeartedContributions from "../index.js";

var argv = yargs
  .usage("Usage: $0 [options]")
  .example(
    "$0 --token 0123456789012345678901234567890123456789 --in https://github.com/octokit --since 2019-05-01"
  )
  .options({
    token: {
      description:
        'Requires the "public_repo" scope for public repositories, "repo" scope for private repositories.',
      demandOption: true,
      type: "string",
    },
    in: {
      description: "GitHub organization URL, or the repository url",
      demandOption: true,
      type: "string",
    },
    since: {
      description:
        "timestamp in ISO 8601 format or GitHub issue URL, in which case since will be set to the created_at timestamp of the last comment",
      demandOption: true,
      type: "string",
    },
    cache: {
      description: "Cache responses for debugging",
      type: "boolean",
      default: false,
    },
  })
  .epilog("copyright 2019").argv;

// Create a CSV writer instance
const writer = csvWriter.createObjectCsvWriter({
  path: 'heartedItems.csv',
  header: [
    { id: 'url', title: 'URL' }
  ]
});

// Placeholder for all hearted items
const allHeartedItems = [];

// Placeholder for getting all users - Modify this based on your implementation
const allUsers = getAllUsers();

for (const user of allUsers) {
  const heartedItems = await findHeartedContributions({
    ...argv,
    by: user
  });

  allHeartedItems.push(...heartedItems.map(url => ({ url })));
}

// Write to CSV
await writer.writeRecords(allHeartedItems);

console.log("\n\ndone.\n");

if (allHeartedItems.length === 0) {
  console.log("No hearted items.");
}

console.log("hearted items written to CSV file.");

// Function to retrieve all users 
function getAllUsers() {
  
  return ["gr2m"]; // Example return
}
