# Next.js-Web-Crawler-with-React-Flow


# Intelligent User Flow Mapper

An intelligent frontend application that crawls websites and automatically generates visual user flow diagrams. It detects meaningful navigation paths while actively filtering out "noise" (like global navigation bars) to produce clean, readable maps.


## 🚀 Features

* **Smart Crawling:** Traverses internal links recursively up to a configurable depth.
* **Noise Reduction:** Uses statistical heuristics to identify and hide "Global Navigation" links (headers/footers) that clutter the graph.
* **Interactive Visualization:** Uses React Flow to render nodes and edges.
* **Auto-Layout:** Implements `dagre` for automatic hierarchical layout of the user flow.
* **Safety:** Includes loop detection and prevents duplicate crawling.

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Visualization:** React Flow
* **Crawler:** Cheerio (Server-side HTML parsing) + Axios
* **Layout Engine:** Dagre
* **Styling:** Tailwind CSS

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sohail-the-highlight/Next.js-Web-Crawler-with-React-Flow.git
    cd user-flow-mapper
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open the app**
    Navigate to [http://localhost:3000](http://localhost:3000).

## 🧠 Engineering Approach

### 1. The CORS Challenge
Browsers cannot strictly crawl arbitrary external websites due to CORS (Cross-Origin Resource Sharing) policies.
* **Solution:** I implemented a Next.js API Route (`/api/crawl`) to act as a proxy. The server (Node.js) handles the fetching and parsing via `axios` and `cheerio`, returning sanitized JSON to the frontend.

### 2. Smart Noise Reduction (Heuristics)
A naive crawler connects every page to the "Home" page because the logo is in the navbar. This creates a "spiderweb" mess.
* **Solution:** The crawler calculates link frequency across all visited pages.
* **Algorithm:** If a specific link (e.g., `/contact` or `/`) appears on more than 30% of the crawled pages, it is classified as "Global Navigation" and excluded from the visual flow, keeping the diagram clean.

### 3. Visualization Hierarchy
Large sites produce chaotic graphs.
* **Solution:** I integrated `dagre` to calculate a directed acyclic graph layout. This ensures a clean top-down or left-right hierarchy, making the user flow actually readable.

## 🧪 Testing

To verify the "Smart Flow" logic:
1.  Enter a URL like `https://react.dev`.
2.  The system will crawl up to 50 pages (limit set for performance).
3.  Observe that the "Home" node does not connect to every single other node, verifying the noise reduction algorithm.

---
**Author:** Sohail Khan
