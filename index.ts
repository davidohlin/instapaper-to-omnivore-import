import { parse } from "csv-parse";
import { createObjectCsvWriter } from "csv-writer"
import "dotenv/config";
import fs from "fs";
import { gql, GraphQLClient } from "graphql-request";
import { finished } from "stream/promises";

interface ImportItem {
  url: string,
  title: string,
  selection: string,
  folder: string,
  timestamp: string
}

const OMNIVORE_API_URL = "https://api-prod.omnivore.app/api/graphql";
const INSTAPAPER_CSV_EXPORT_PATH = `${__dirname}/instapaper-export.csv`;
const csvWriter = createObjectCsvWriter({
  path: `error_${new Date().toJSON().slice(0, 10)}.csv`,
  header: [
    { id: 'url', title: 'URL' },
    { id: 'title', title: 'Title' },
    { id: 'selection', title: 'Selection' },
    { id: 'folder', title: 'Folder' },
    { id: 'timestamp', title: 'Timestamp' },
  ]
});

// https://github.com/omnivore-app/omnivore/blob/main/packages/api/src/schema.ts
const createArticleMutation = gql`
  mutation CreateArticleSavingRequest($input: CreateArticleSavingRequestInput!) {
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

const createArchiveMutation = gql`
  mutation SetLinkArchived($input: ArchiveLinkInput!) {
    setLinkArchived(input: $input) {
      ... on ArchiveLinkSuccess {
        linkId
        message
      }
      ... on ArchiveLinkError {
          message
        errorCodes
      }
    }
  }
`;

async function processCsv() {
  const records: ImportItem[] = [];
  //const records = [];
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
  let addedEntriesCount = 0;
  let archivedEntriesCount = 0;
  let failedEntriesCount = 0;

  const failedEntries: ImportItem[] = [];

  console.log(`Adding ${entries.length} links to Omnivore..`);

  for (const entry of entries) {
    try {
      const response = await client.request(createArticleMutation, {
        input: { url: entry.url },
      });
      addedEntriesCount++;

      var result = response;
      if (entry.folder == "Archive") {
        await client.request(createArchiveMutation, {
          input: { linkId: result.createArticleSavingRequest.articleSavingRequest.id, archived: true },
        });
        archivedEntriesCount++;
      }

    } catch (error) {
      console.error(`🚫 Failed to add ${entry.url}`);
      failedEntries.push({
        url: entry.url,
        title: entry.title,
        selection: entry.selection,
        folder: entry.folder,
        timestamp: entry.timestamp
      })

      failedEntriesCount++;
    }
  }

  console.log(
    `Successfully added ${addedEntriesCount} (Archived: ${archivedEntriesCount}) of ${entries.length} links!`
  );

  if (failedEntriesCount > 0) {
    csvWriter
      .writeRecords(failedEntries)
      .then(() => console.log('The CSV file was written successfully'));
  }
}

main();
