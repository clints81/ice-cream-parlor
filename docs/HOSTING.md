# Running and hosting Ice Cream Parlor

There are three ways to play. All of them are free, and none of them need an account for the kids.

## Option 1: On your Mac, with a double-click (what you have now)

1. Install Node.js once from [nodejs.org](https://nodejs.org) (the "LTS" button).
2. Double-click **Start Ice Cream Parlor.command** in the game folder.
   - The first start takes a minute while it sets things up. After that it's a few seconds.

   **If macOS blocks it.** A game downloaded as a ZIP is marked "from the internet," and macOS blocks scripts that aren't signed by an Apple developer. Right-click → Open no longer gets around this on recent macOS. Do one of these:
   - In Terminal, type `xattr -dr com.apple.quarantine ` (with a space at the end), drag the game folder into the Terminal window, and press Enter. Double-clicking works after that, until you download a new ZIP.
   - Or double-click once so it gets blocked, then go to **System Settings → Privacy & Security**, scroll to the bottom, and click **Open Anyway**.
   - Or skip the launcher: open Terminal in the game folder and run `npm install`, then `npm start`.

   Getting the game with `git clone` instead of a ZIP avoids the block entirely, and `git pull` brings in updates.
3. The game opens in your browser at `http://127.0.0.1:5174`. Keep the little Terminal window open while playing. Close it when you're done.

If you'd rather type, open Terminal in the game folder and run:

```bash
npm start
```

**Bookmark `http://127.0.0.1:5174` exactly.** Saves belong to that exact address. `localhost:5174`, or a different port, counts as a different place with no saves in it. The game is set to refuse other ports for this reason.

## Option 2: GitHub Pages (a bookmark that works anywhere, nothing to start)

Your repository is public, so GitHub Pages is free. Nothing is published until you do these steps:

1. Merge the v2 branch into `main`.
2. On GitHub, open the repo, then **Settings → Pages**. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Open the **Actions** tab, pick **Publish game to GitHub Pages**, and click **Run workflow**.
4. After a minute or two the game is live at `https://clints81.github.io/ice-cream-parlor/`. Bookmark that on each kid's device.

Run the workflow again whenever you want to publish a new version. It never runs on its own.

## Option 3: Netlify Drop (no GitHub settings at all)

1. In the game folder, run `npm run build`. This makes a `dist` folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `dist` folder onto the page.
3. Netlify gives you a web address. Bookmark it. (A free Netlify account keeps the site from expiring.)

## The important tradeoff: where saves live

Saves are stored **inside the browser, per web address**. That means:

- The Mac version (`127.0.0.1:5174`) and a hosted version (`clints81.github.io/...`) each have **separate saves**. Moving to a hosted version starts with an empty "Who's playing?" screen.
- Different browsers (Safari vs. Chrome) on the same computer also have separate saves.
- Clearing browser history/website data can delete saves.
- Each device (laptop, tablet) has its own saves.

**Backup files are the safety net.** On the "Who's playing?" screen, tap **⋯** on a player and choose **Save a backup file**, or use Settings → Backup. To move a player to a new address, browser, or device, open the game there and use **Open a backup file**. It's worth saving a backup every week or two.

## Bringing back the old v1 parlors

The new version starts fresh, but it leaves the old saves untouched. If one of the kids misses an old parlor, open the game at the same address the old version used (`127.0.0.1:5174`). Go to "Who's playing?" and tap **Bring back parlors from the old version**. This copies their parlor names and flavor vaults. The old stats don't come over, because they were earned under different rules. The `recover-parlors.txt` file in this repo works the same way through **Open a backup file**.
