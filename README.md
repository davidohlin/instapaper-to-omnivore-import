# instapaper-to-omnivore-import

A little script that I made to import my huge collection of links from [Instapaper](https://instapaper.com/) to [Omnivore](https://omnivore.app/home). Hopefully someone else finds it useful!

## Requirements

- Node.js >= version 16.
- A exported .CSV from Instapaper
- Auth token from Omnivore (discount version auth, sorry)

## Usage

1. Clone the repository and install dependencies:

   ```sh
   $ npm install
   ```

2. Go to https://instapaper.com/user. Scroll down to **Export** and click **Download .CSV file**. Save the CSV-file in the root directory of this repository.

   **⚠️ The filename must be `instapaper-export.csv`**


3. [Create an API key in Omnivore](https://omnivore.app/settings/api) and copy the value.

4. Add the API key to the `.env` file:
   ```
   OMNIVORE_API_KEY=1d45ae09-789f-...
   ```
5. Run the script. It might take a few minutes.
   ```
   $ npm run import
   ```
6. Refresh Omnivore and browse your imported content!
