# Mess Tracker & Smart WhatsApp Poll Scraper V3

This repository contains an end-to-end system for automatically scraping meal poll votes from WhatsApp Web and visualizing the data in a beautiful, glassmorphic React dashboard.

The system is split into two parts:
1. **whatsapp-poll-scraper-v3/** - A Smart Chrome Extension that automates reading WhatsApp polls.
2. **mess-tracker-v3/** - A modern React (Vite) application that parses the scraped data and generates charts and analytics.

---

## 1. How to Setup and Run the WhatsApp Scraper

Since WhatsApp Web changes frequently, this scraper is designed as a custom Chrome Extension that mimics human behavior to safely read poll results.

### Installation
1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click the **Load unpacked** button in the top left.
5. Select the `whatsapp-poll-scraper-v3` folder from this repository.

### Usage
1. Open WhatsApp Web (`web.whatsapp.com`) and open the group chat containing your polls.
2. Click the puzzle piece icon 🧩 in the top right of your Chrome browser and click **Smart Poll Scraper V3**.
3. Scroll to the bottom of the chat, and click **Start Scraping**.
4. **Important**: Let the extension run without switching tabs. It will automatically open the poll sidebars, copy the names, close the sidebar, and scroll up to load older messages.
5. Once it has collected enough data, click **Stop Scraping** and then **Download Results**. It will save a file called `whatsapp_polls.txt`.

---

## 2. How to Setup and Run the Dashboard

The dashboard takes the raw `whatsapp_polls.txt` file and turns it into readable analytics (who ate what on which days).

### Prerequisites
You need to have [Node.js](https://nodejs.org/) installed on your computer.

### Installation & Running
1. Open your terminal or command prompt.
2. Navigate into the dashboard folder:
   ```bash
   cd mess-tracker-v3
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the local link provided in your terminal (usually `http://localhost:5173/`).

### Visualizing Your Data
1. On the dashboard web page, click the **"Upload Scraped Polls"** button.
2. Select the `whatsapp_polls.txt` file you downloaded from the scraper.
3. The app will instantly parse the text and generate charts for Daily Attendance, Meal Breakdown, and Top Eaters!
4. You can also click **Export to CSV** to download the structured data into Excel.
