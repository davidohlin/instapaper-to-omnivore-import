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

3. Go to https://omnivore.app, login, and copy the value of the **auth cookie**. How to do this differs for every browser I guess, but if you're using Chrome:

   - Open **Developer Tools** (Option + Cmd + I)
   - Go the **Application** tab
   - Find the **auth** cookie in the list. Copy the value. It should look something like this: `eyJhbGciOiJIUzI1NiI ...`

4. Add the auth cookie value to the `.env` file:
   ```
   OMNIVORE_AUTH_COOKIE=eyJhbGciOiJIUzI1NiI ...
   ```
5. Run the script. It might take a few minutes.
   ```
   $ npm run import
   ```
6. Refresh Omnivore and browse your imported content!
