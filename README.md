# RepoSync — Repository Intelligence

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-cpj148ra)

RepoSync is a developer tool that analyzes any public GitHub repository and generates a complete, actionable blueprint — architecture overview, file tree, dependency health, security scan, prioritized recommendations, optimization suggestions, and an AI Copilot to ask questions about the codebase.

---

## Features

### Repository Analysis
- **Real GitHub data** — fetches live metadata, language breakdown, file tree, and key file contents via the GitHub API.
- **File tree explorer** — browse the full indexed repository with a collapsible tree view. Click any file for an AI-generated explanation of its likely purpose.
- **Language breakdown** — visual chips showing the percentage and color-coded breakdown of all detected languages.
- **Repository signals** — stars, forks, open issues, license, and default branch at a glance.

### Project Health Dashboard
- **Composite health score** (0–100) combining code quality, security, dependencies, and documentation.
- **Score rings** for each sub-category so you can see exactly where the project stands.
- **Static analysis issues** — severity-tagged findings (Critical, High, Medium, Low) with expandable details for each issue.

### Deep Analysis & Recommendations
- **Prioritized recommendations** — each recommendation includes a priority level, impact assessment, and effort estimate so you know what to fix first and how much work it takes.
- **Optimization suggestions** — categorized tips across performance, bundle size, DevOps, documentation, dependency management, and testing.
- **Test framework detection** — identifies the test framework in use (Jest, Vitest, pytest, cargo test, go test) and counts test files.
- **Issue detection** covers:
  - `eval()` usage (code injection risk)
  - Direct `innerHTML` assignment (XSS risk)
  - `var` instead of `let`/`const`
  - Console statements in production code
  - Unresolved `TODO`/`FIXME`/`HACK` comments
  - Missing error handling in async functions
  - Hardcoded URLs that should be environment variables
  - Unpinned native dependencies (caret ranges on SWC, sharp, esbuild, etc.)
  - Missing `.gitignore`
  - Missing `LICENSE` file

### Blueprint
- **Architecture map** — visual flow showing Frontend → API/Runtime → Data layer with detected technologies.
- **Setup instructions** — clone, install, and run commands tailored to the detected runtime (Node.js, Python, Rust).
- **Requirements checklist** — everything needed to get the project running locally.
- **Detected stack** — full list of detected frameworks, libraries, and tools with categories.
- **Topics** — GitHub topics associated with the repository.

### Security Scan
- **Secret pattern detection** — scans for API keys, GitHub tokens, Stripe keys, AWS credentials, JWTs, and other exposed secrets. All matches are masked — values are never stored or displayed.
- **Security score** (0–100) based on secrets found and high-severity issues.
- **Hardening notes** — actionable items to improve the project's security posture.

### AI Copilot
- **Ask questions** about the analyzed repository — how to run it, where auth is handled, what to fix first, what the stack is, optimization suggestions, and more.
- **Grounded answers** — responses are based on the indexed file data, not generic knowledge.
- **Suggested questions** — quick-start prompts to get you oriented immediately.

### Workspace
- **Track items** — add recommendations, files, or notes to your workspace for follow-up.
- **Suggested items** — one-click add from the analysis recommendations.
- **Remove items** when you're done with them.

### Settings
- **Export format** — choose between Markdown (.md) or JSON (.json) for downloaded reports.
- **Deep analysis** — enabled by default for richer recommendations and more file scanning.
- **Secret scanning** — enabled by default to detect exposed credentials.

### Report Export
- **Download a full report** as a Markdown or JSON file containing:
  - Repository metadata (stars, forks, license, etc.)
  - Health scores (overall + sub-categories)
  - Blueprint summary and architecture
  - Detected stack
  - Setup instructions and requirements
  - All recommendations with impact/effort ratings
  - All optimization suggestions
  - Security scan results
  - Every static analysis issue with details
  - Full dependency list
  - Environment variables
  - Test framework info

---

## Use Cases

### For new team members
Paste a repository URL, get an instant architecture overview, setup instructions, and a file tree so you can understand the codebase without spending hours exploring it manually.

### For open-source contributors
See what issues need attention, what the project is missing (tests, LICENSE, .gitignore), and get prioritized recommendations on what to tackle first.

### For technical leads and architects
Get a health score across code quality, security, dependencies, and documentation. Use the optimization suggestions to plan improvements and the export feature to share findings with the team.

### For security reviews
Run the secret scanner to detect exposed credentials, review hardening notes, and export a full security report for documentation.

### For project evaluation
Before adopting a dependency or fork, paste its URL to see its health, dependency practices, test coverage, and security posture at a glance.

---

## Step-by-Step: How to Use RepoSync

1. **Paste a GitHub URL** — in the "Analyze a repository" bar at the top, paste any public GitHub repository URL (e.g., `https://github.com/vercel/next.js`).
2. **Click "Analyze repo"** — RepoSync fetches the repository metadata, indexes the file tree, and parses key files.
3. **Review the Overview** — see the project description, health score, repository signals, prioritized recommendations, and static analysis issues.
4. **Explore the Blueprint** — understand the architecture, how to run it, detected stack, and optimization suggestions.
5. **Browse Files** — click through the file tree to see AI-generated explanations of individual files.
6. **Check Dependencies** — review package health, pinned vs. range versions, flagged packages, and the setup checklist.
7. **Review Security** — see the security score, secret scan results, and hardening notes.
8. **Ask the Copilot** — open the AI Copilot tab and ask questions about the repository.
9. **Add to Workspace** — click the plus icon in the sidebar to open the workspace and track items for follow-up.
10. **Adjust Settings** — click Settings in the sidebar to choose your export format (Markdown or JSON).
11. **Export the Report** — click "Export report" in the top bar to download the full analysis as a file.

---

## How to Run Locally

### Prerequisites
- **Node.js 18+** (download from [nodejs.org](https://nodejs.org))
- **npm** (comes with Node.js) or **pnpm**
- A **GitHub personal access token** (optional but recommended to avoid API rate limits) — create one at [github.com/settings/tokens](https://github.com/settings/tokens) with public repository read access.

### Step 1: Clone the project
```bash
git clone <your-repo-url>
cd reposync
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure environment variables
Create a `.env` file in the project root:
```env
# Optional — increases GitHub API rate limit from 60 to 5,000 requests/hour
GITHUB_TOKEN=ghp_your_token_here
```

### Step 4: Run the development server
```bash
npm run dev
```

### Step 5: Open the app
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Analyze a repository
Paste any public GitHub repository URL into the input bar and click "Analyze repo".

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 13 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| API | Next.js API Routes (GitHub REST API) |
| Deployment | Netlify |

---

## Build for Production

```bash
npm run build
npm start
```

This creates an optimized production build and starts the server.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── analyze/route.ts    # GitHub API analysis endpoint
│   ├── globals.css             # Global styles + design system
│   ├── layout.tsx              # Root layout + metadata
│   └── page.tsx                # Main application UI
├── components/ui/              # shadcn/ui component library
├── hooks/
│   └── use-toast.ts            # Toast notification hook
├── lib/
│   └── utils.ts                # Utility functions
├── public/                     # Static assets (logo)
├── package.json
├── tailwind.config.ts
└── next.config.js
```

---

## API Reference

### `GET /api/analyze?url=<github-url>`

Analyzes a public GitHub repository and returns a full JSON report.

**Parameters:**
- `url` (required) — a public GitHub repository URL (e.g., `https://github.com/owner/repo`)

**Response:**
```json
{
  "repo": { "owner", "name", "url", "description", "stars", "forks", ... },
  "languages": [{ "name", "percentage", "color" }],
  "tree": [{ "name", "type", "children", "badge", "path", "size" }],
  "dependencies": [{ "name", "version", "type" }],
  "envVars": [{ "name", "required", "documented", "source" }],
  "issues": [{ "severity", "title", "file", "detail" }],
  "stack": [{ "name", "category", "logo" }],
  "readme": { "score", "sections", "present", "missing" },
  "security": { "score", "secretsFound", "maskedSecrets", "vulnCount", "notes" },
  "health": { "overall", "codeQuality", "security", "dependencies", "docs" },
  "setup": { "runtime", "steps", "requirements" },
  "blueprint": { "summary", "architecture": { ... } },
  "stats": { "fileCount", "keyFilesParsed", "contributorCount" },
  "recommendations": [{ "priority", "title", "detail", "impact", "effort" }],
  "optimizations": [{ "category", "tip", "detail" }],
  "testFramework": { "name", "fileCount", "detected" }
}
```

---

## License

This project is open source. Feel free to use, modify, and distribute it.
