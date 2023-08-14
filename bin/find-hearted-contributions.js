#!/usr/bin/env node

import yargs from "yargs";
import csvWriter from "csv-writer";
import csvParser from "csv-parser";
import fs from "fs";
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


  const CSV_PATH = 'database.csv';

  // Placeholder for all known reaction URLs
  const knownUrls = new Set();
  
  // Read existing URLs from CSV
  if (fs.existsSync(CSV_PATH)) {
      fs.createReadStream(CSV_PATH)
          .pipe(csvParser())
          .on('data', (row) => knownUrls.add(row.URL))
          .on('end', fetchAndWriteReactions);
  } else {
      fetchAndWriteReactions();
  }
  
  async function fetchAndWriteReactions() {
      const heartedReactions = await findHeartedContributions(argv);
  
      // Filter out already known reactions
      const newReactions = heartedReactions.filter(reaction => !knownUrls.has(Object.keys(reaction)[0]));
  
      // Create a CSV writer instance
      const writer = csvWriter.createObjectCsvWriter({
          path: CSV_PATH,
          header: [
              { id: 'url', title: 'URL' },
              { id: 'users', title: 'Users' }
          ],
          append: true  // This ensures we append to the CSV rather than overwrite
      });
  
      const csvRecords = newReactions.map(entry => {
          const url = Object.keys(entry)[0];
          return {
              url: url,
              users: entry[url].join(', ')
          };
      });
  
      // Write to CSV if there are new reactions
      if (csvRecords.length > 0) {
          await writer.writeRecords(csvRecords);
          console.log("New hearted items written to CSV file.");
      } else {
          console.log("No new hearted items found.");
      }
  }