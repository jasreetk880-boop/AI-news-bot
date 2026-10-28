# AI News Bot

**PCTE Campus & Technology News Assistant**

AI News Bot is a small, offline-first web app. It searches the PCTE information stored in `data/knowledge.json`; it does not call an AI service or fetch live news. Answers are produced by local keyword and topic matching, with a special date-aware news filter.

## Start the app (Windows)

1. Install [Node.js](https://nodejs.org/) if it is not already installed.
2. Open this project folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```powershell
   node server.js
   ```

5. In your browser, open **http://localhost:8000**.
6. To stop the local server, focus the terminal and press **Ctrl+C**.

No packages, API keys, accounts, or database are needed. The server and app use built-in Node.js and browser features. If port 8000 is already occupied, the server tries the next port (8001 through 8010) and prints the URL to open.

## Ask questions

Use the question box or a quick-question button. Press **Enter** to send and **Shift+Enter** for a new line. The bot answers from matching local records only. **Summarize the weekly news** returns the supplied PCTE weekly summary exactly. Last-week news and explicit ISO date ranges use records with an actual stored date in the `news` or `technology-news` category; undated highlights and the undated stored digest are not treated as dated news. You can ask for a date range such as `news 2026-10-01 to 2026-10-12`.

The local assistant is a rules-and-retrieval tool, not a generative AI model. English, Hindi, Punjabi, and some Roman Hindi/Punjabi prompts are recognized. Some factual text remains in English to avoid inaccurate translations.

## Add or edit information

1. Select **Knowledge base** or **Manage data**.
2. Select **Add record** to enter a title, category, campus, content, optional source, and keywords. Use **Edit** beside a record to update it.
3. To add campus news, choose **Campus news**; for technology stories choose **Technology news**. Enter the campus (or **Not applicable** for technology news), publication/event date, headline, and factual story. A date is only the date you stored; it does not independently verify the story.
4. Select **Save record**. Changes are saved in this browser’s local storage and used immediately.

The JSON importer accepts a list of records or `{ "records": [...] }`. Imports replace the current knowledge list after confirmation. A `.txt` import is added as one plain-text record. Invalid imports show an error and do not replace the saved data.

## Back up knowledge

In **Manage data**, select **Export JSON** to download `ai-news-bot-knowledge-backup.json`. Keep that file somewhere safe. Use **Import JSON** to restore a backup.

The original starter file remains at `data/knowledge.json`; browser edits are stored separately and do not overwrite that file.

## Chat history and offline behavior

Conversations are saved automatically in this browser/device under the separate local-storage key `ai-news-bot-conversations-v1`. Knowledge edits use `ai-news-bot-knowledge-v1`. History is not synchronized to other devices. Clearing browser site data can remove both.

After Node.js is installed, app files and chatbot answers work offline. There is no remote news feed, external model/API, telemetry, or external font/script dependency. You need the local server running to open the app at `localhost:8000`.

## Tests

Run the local automated retrieval and data-validation tests:

```powershell
node --test
```
