# WhatsApp Meal Counter

A free, private, client-side web application designed to parse, aggregate, and count meals per person from WhatsApp poll results and chat exports. The application tracks Breakfast, Lunch (Veg vs Non-Veg), and Dinner (Veg vs Non-Veg) for each person, filters by month, calculates bills, and is ready to deploy directly to GitHub Pages for free.

## Features

- **Detailed Meal Categories**: Tracks Breakfast (B), Lunch Veg (LV), Lunch Non-Veg (LNV), Dinner Veg (DV), and Dinner Non-Veg (DNV) separately.
- **Period Filter (Month-Wise)**: Easily filter votes, calculations, tables, and bills by a specific month (e.g. "July 2026") or view cumulative stats.
- **Custom Meal Option Mapping**: Maps any poll option or message text (e.g. "Breakfast Only", "Veg Lunch + Dinner", "Guest L-NV (x2)") to custom meal category counts.
- **Flexible Billing Engine**: Set optional prices for Breakfast, Lunch Veg, Lunch NV, Dinner Veg, and Dinner NV to calculate individual voter bills and grand total costs.
- **WhatsApp Message Copy**: Generates a pre-formatted, easy-to-read text summary showing total counts and individual breakdowns to paste directly back to the WhatsApp group.
- **Export to CSV**: Export the processed data table into a spreadsheet (.csv) with one click.
- **100% Free & Private**: Runs entirely in the sandbox of your browser. No databases, servers, or external network requests are used.

---

## Hosting on GitHub Pages (For Free)

You can host this tool on GitHub for free so your group members or administrators can access it anytime:

1. **Create a GitHub Account**: Go to [GitHub.com](https://github.com) and sign up for a free account.
2. **Create a Repository**:
   - Click **New** (or "+" in the top right -> **New repository**).
   - Name the repository `meal-counter` (or any name you prefer).
   - Set the repository visibility to **Public**.
   - Click **Create repository**.
3. **Upload Files**:
   - Click **"uploading an existing file"** in the setup screen.
   - Drag and drop the three project files:
     - `index.html`
     - `style.css`
     - `app.js`
   - Click **Commit changes** at the bottom of the page.
4. **Enable GitHub Pages**:
   - Go to the **Settings** tab of your repository.
   - Click **Pages** in the left-hand sidebar under the "Code and automation" section.
   - Under **Build and deployment -> Branch**, select **main** (or your active branch) and select `/ (root)` folder.
   - Click **Save**.
5. **Get Your URL**:
   - Within 1-2 minutes, refresh the page. You will see a banner at the top of the Pages section stating: *"Your site is live at..."*.
   - The URL will look like: `https://<your-username>.github.io/meal-counter/`

---

## Technical Mapping Configurations

Once you parse your data (using pasted poll details or uploaded chat export):
- Under **Configure Meal Options**, you will see a list of all options detected from the poll or messages.
- For each option, define the counts for B (Breakfast), LV (Lunch Veg), LNV (Lunch NV), DV (Dinner Veg), and DNV (Dinner NV).
- Input optional costs per meal in the **Price per Meal** section.
- Use the **Month / Period** dropdown at the top of the results to see stats, voter tables, and WhatsApp messages for a specific month.
- Click **"Copy Summary"** to grab the text block for sharing, or click **"Export CSV"** to download the spreadsheet.
