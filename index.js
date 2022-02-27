import "dotenv/config";
import fs from "fs";
import { parse } from "csv-parse";
import { GraphQLClient, gql } from "graphql-request";
import { finished } from "stream/promises";
import { createArticleMutation } from "./queries";

const OMNIVORE_API_URL = "https://api-prod.omnivore.app/api/graphql";
const INSTAPAPER_CSV_EXPORT_PATH = `${__dirname}/instapaper-export.csv`;

// https://github.com/omnivore-app/omnivore/blob/main/packages/api/src/schema
const createArticleMutation = gql`
  mutation CreateArticleSavingRequest(
    $input: CreateArticleSavingRequestInput!
  ) {
    createArticleSavingRequest(input: $input) {
      ... on CreateArticleSavingRequestSuccess {
        articleSavingRequest {
          id
          status
        }
      }
      ... on CreateArticleSavingRequestError {
        errorCodes
      }
    }
  }
`;

async function processCsv() {
  const records = [];
  const parser = fs.createReadStream(INSTAPAPER_CSV_EXPORT_PATH).pipe(parse());

  parser.on("readable", () => {
    let record;
    while ((record = parser.read()) !== null) {
      if (record[0] !== "URL") {
        records.push({ url: record[0], folder: record[3] });
      }
    }
  });

  await finished(parser);
  return records;
}

async function main() {
  if (!process.env.OMNIVORE_AUTH_COOKIE) {
    throw new Error(
      "No auth token found. Did you forget to add it to the .env file?"
    );
  }

  const client = new GraphQLClient(OMNIVORE_API_URL, {
    headers: {
      Cookie: `auth=${process.env.OMNIVORE_AUTH_COOKIE};`,
    },
  });

  const entries = await processCsv();
  let successfulEntries = 0;

  console.log(`Adding ${entries.length} links to Omnivore..`);

  for (const entry of entries) {
    try {
      const response = await client.request(createArticleMutation, {
        input: { url: entry.url },
      });
      successfulEntries++;
    } catch (error) {
      console.error(`🚫 Failed to add ${entry.url}`);
    }
  }

  console.log(
    `Successfully added ${successfulEntries} of ${entries.length} links!`
  );
}

main();
