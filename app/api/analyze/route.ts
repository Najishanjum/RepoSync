import { NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache', 'vendor', '__pycache__', '.venv', 'venv', 'target', 'bin', 'obj']);

type GHFile = { path: string; type: 'blob' | 'tree'; size?: number };

type RepoMeta = {
  owner: string; name: string; url: string; description: string; stars: number;
  forks: number; openIssues: number; license: string | null; language: string;
  defaultBranch: string; pushedAt: string; topics: string[]; size: number;
};

type LanguageBreakdown = { name: string; percentage: number; color: string };

type TreeItem = { name: string; type: 'folder' | 'file'; children?: TreeItem[]; badge?: string; path?: string; size?: number };

type Dependency = { name: string; version: string; type: string };

type EnvVar = { name: string; required: boolean; documented: boolean; source: string };

type Issue = { severity: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; file: string; detail: string };

type AnalysisResult = {
  repo: RepoMeta;
  languages: LanguageBreakdown[];
  tree: TreeItem[];
  dependencies: Dependency[];
  envVars: EnvVar[];
  issues: Issue[];
  stack: { name: string; category: string; logo: string }[];
  readme: { score: number; sections: string[]; present: string[]; missing: string[] };
  security: { score: number; secretsFound: number; maskedSecrets: string[]; vulnCount: number; notes: string[] };
  health: { overall: number; codeQuality: number; security: number; dependencies: number; docs: number };
  setup: { runtime: string; steps: string[]; requirements: string[] };
  blueprint: { summary: string; architecture: { frontend: string; backend: string; database: string; auth: string; deployment: string } };
  stats: { fileCount: number; keyFilesParsed: number; contributorCount: number };
  recommendations: { priority: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; detail: string; impact: string; effort: string }[];
  optimizations: { category: string; tip: string; detail: string }[];
  testFramework: { name: string; fileCount: number; detected: boolean };
};

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'RepoSync' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function ghFetch(path: string): Promise<any> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Repository not found or not accessible');
    if (res.status === 403) throw new Error('GitHub API rate limit reached or token lacks access');
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

function buildTree(files: GHFile[]): TreeItem[] {
  const root: TreeItem = { name: '', type: 'folder', children: [] };
  const manifestBadges = new Set(['package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'Dockerfile', '.env.example', 'tsconfig.json', 'turbo.json', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'README.md', '.gitignore', 'next.config.js', 'vite.config.ts', 'webpack.config.js']);

  for (const file of files) {
    const parts = file.path.split('/');
    let skip = false;
    for (const part of parts.slice(0, -1)) {
      if (SKIP_DIRS.has(part)) { skip = true; break; }
    }
    if (skip) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      let child = current.children!.find((c) => c.name === part);
      if (!child) {
        child = { name: part, type: isLast ? 'file' : 'folder', children: isLast ? undefined : [], path: file.path, size: file.size };
        current.children!.push(child);
      }
      if (!isLast) current = child;
    }
  }

  const sortNode = (node: TreeItem): void => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of node.children) {
      if (child.badge === undefined && child.type === 'file' && manifestBadges.has(child.name)) {
        child.badge = child.name === 'README.md' ? 'docs' : child.name.endsWith('.lock') || child.name.includes('lock') ? 'lockfile' : child.name === 'Dockerfile' ? 'docker' : 'manifest';
      }
      sortNode(child);
    }
  };
  sortNode(root);
  return root.children || [];
}

function detectStack(files: GHFile[], deps: Dependency[]): { name: string; category: string; logo: string }[] {
  const stack: { name: string; category: string; logo: string }[] = [];
  const filePaths = files.map((f) => f.path);
  const depNames = new Set(deps.map((d) => d.name.toLowerCase()));

  if (depNames.has('react')) stack.push({ name: 'React', category: 'Frontend', logo: 'R' });
  if (depNames.has('next')) stack.push({ name: 'Next.js', category: 'Framework', logo: 'N' });
  if (depNames.has('vue')) stack.push({ name: 'Vue', category: 'Frontend', logo: 'V' });
  if (depNames.has('express')) stack.push({ name: 'Express', category: 'Backend', logo: 'E' });
  if (depNames.has('fastify')) stack.push({ name: 'Fastify', category: 'Backend', logo: 'F' });
  if (depNames.has('fastapi')) stack.push({ name: 'FastAPI', category: 'Backend', logo: 'F' });
  if (depNames.has('django')) stack.push({ name: 'Django', category: 'Backend', logo: 'D' });
  if (depNames.has('flask')) stack.push({ name: 'Flask', category: 'Backend', logo: 'F' });
  if (depNames.has('typeorm')) stack.push({ name: 'TypeORM', category: 'Database', logo: 'T' });
  if (depNames.has('prisma') || depNames.has('@prisma/client')) stack.push({ name: 'Prisma', category: 'Database', logo: 'P' });
  if (depNames.has('mongoose')) stack.push({ name: 'Mongoose', category: 'Database', logo: 'M' });
  if (depNames.has('supabase') || depNames.has('@supabase/supabase-js')) stack.push({ name: 'Supabase', category: 'Backend', logo: 'S' });
  if (depNames.has('tailwindcss')) stack.push({ name: 'Tailwind CSS', category: 'Styling', logo: 'T' });
  if (depNames.has('typescript')) stack.push({ name: 'TypeScript', category: 'Language', logo: 'TS' });
  if (filePaths.some((p) => p === 'Dockerfile' || p.endsWith('/Dockerfile'))) stack.push({ name: 'Docker', category: 'Infrastructure', logo: 'D' });
  if (filePaths.some((p) => p === 'turbo.json')) stack.push({ name: 'Turborepo', category: 'Build', logo: 'T' });

  return stack.slice(0, 8);
}

function parsePackageJson(content: string): Dependency[] {
  const deps: Dependency[] = [];
  try {
    const pkg = JSON.parse(content);
    for (const [name, version] of Object.entries(pkg.dependencies || {})) deps.push({ name, version: version as string, type: 'dependency' });
    for (const [name, version] of Object.entries(pkg.devDependencies || {})) deps.push({ name, version: version as string, type: 'devDependency' });
  } catch {}
  return deps;
}

function parseRequirementsTxt(content: string): Dependency[] {
  return content.split('\n').filter((l) => l.trim() && !l.startsWith('#') && l.includes('==')).map((l) => {
    const [name, version] = l.trim().split('==');
    return { name: name.trim(), version: (version || '').trim(), type: 'dependency' };
  });
}

function parseCargoToml(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const inDeps = content.split('\n').reduce((acc, line) => {
    if (line.trim().startsWith('[')) return line.trim() === '[dependencies]' || line.trim().startsWith('[dependencies.');
    return acc ? [...acc, line] : acc;
  }, false as any);
  return deps;
}

function parseEnvExample(content: string): EnvVar[] {
  return content.split('\n').filter((l) => l.trim() && !l.startsWith('#') && l.includes('=')).map((l) => {
    const name = l.split('=')[0].trim();
    const value = l.split('=').slice(1).join('=').trim();
    return { name, required: !value.includes('optional') && value.length > 0, documented: true, source: '.env.example' };
  });
}

function scanSecrets(files: { path: string; content?: string }[]): { found: number; masked: string[] } {
  const patterns = [
    /(?:api[_-]?key|apikey|secret|token|password|passwd|pwd)\s*[=:]\s*['"]([A-Za-z0-9+/=_-]{16,})['"]/gi,
    /ghp_[A-Za-z0-9]{36}/g,
    /gho_[A-Za-z0-9]{36}/g,
    /github_pat_[A-Za-z0-9_]{22,}/g,
    /sk-[A-Za-z0-9]{20,}/g,
    /AKIA[A-Z0-9]{16}/g,
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  ];
  let found = 0;
  const masked: string[] = [];
  for (const file of files) {
    if (!file.content) continue;
    for (const pattern of patterns) {
      const matches = file.content.match(pattern);
      if (matches) {
        for (const match of matches) {
          found++;
          const maskedValue = match.length > 12 ? match.slice(0, 6) + '••••••••' + match.slice(-4) : '••••••••';
          masked.push(`${file.path}: ${maskedValue}`);
        }
      }
    }
  }
  return { found, masked };
}

function analyzeReadme(content: string): { score: number; sections: string[]; present: string[]; missing: string[] } {
  const lower = content.toLowerCase();
  const checks: { name: string; test: boolean }[] = [
    { name: 'Description', test: lower.includes('# ') && lower.length > 100 },
    { name: 'Installation', test: lower.includes('install') || lower.includes('setup') },
    { name: 'Environment setup', test: lower.includes('.env') || lower.includes('environment') },
    { name: 'Usage', test: lower.includes('usage') || lower.includes('run') || lower.includes('start') },
    { name: 'Deployment', test: lower.includes('deploy') || lower.includes('docker') },
  ];
  const present = checks.filter((c) => c.test).map((c) => c.name);
  const missing = checks.filter((c) => !c.test).map((c) => c.name);
  const score = Math.round((present.length / checks.length) * 100);
  return { score, sections: checks.map((c) => c.name), present, missing };
}

function detectIssues(files: { path: string; content?: string }[], deps: Dependency[], allFiles: GHFile[]): Issue[] {
  const issues: Issue[] = [];
  for (const file of files) {
    if (!file.content) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/console\.(log|error|warn)\(/) && (file.path.endsWith('.tsx') || file.path.endsWith('.ts'))) {
        issues.push({ severity: 'Low', title: 'Console statement in source', file: `${file.path}:${i + 1}`, detail: 'Console output left in production source file. Consider removing or using a conditional logger.' });
      }
      if (line.match(/eval\s*\(/) && !line.trim().startsWith('//')) {
        issues.push({ severity: 'High', title: 'Use of eval()', file: `${file.path}:${i + 1}`, detail: 'eval() is dangerous and can lead to code injection. Replace with safer alternatives.' });
      }
      if (line.match(/innerHTML\s*=/) && !line.trim().startsWith('//')) {
        issues.push({ severity: 'Medium', title: 'Direct innerHTML assignment', file: `${file.path}:${i + 1}`, detail: 'Direct innerHTML can lead to XSS. Use textContent or proper sanitization.' });
      }
      if ((line.match(/var\s+/) && !line.match(/var\s+\w+\s*=/)) || (line.match(/var\s+\w+\s*=/) && file.path.endsWith('.ts'))) {
        issues.push({ severity: 'Low', title: 'Use of var instead of let/const', file: `${file.path}:${i + 1}`, detail: 'var has function-scoped behavior that can cause bugs. Prefer let/const.' });
      }
      if (line.match(/TODO|FIXME|HACK|XXX/i)) {
        issues.push({ severity: 'Low', title: 'Unresolved TODO/FIXME', file: `${file.path}:${i + 1}`, detail: 'Code comment indicates unfinished or temporary work that should be resolved.' });
      }
    }
    // Check for missing error handling in async functions
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx') || file.path.endsWith('.js')) {
      const asyncCount = (file.content.match(/async\s+/g) || []).length;
      const tryCount = (file.content.match(/try\s*\{/g) || []).length;
      if (asyncCount > 3 && tryCount === 0) {
        issues.push({ severity: 'Medium', title: 'Missing error handling in async code', file: file.path, detail: `File has ${asyncCount} async operations but no try/catch blocks. Unhandled promise rejections may crash the process.` });
      }
    }
    // Check for hardcoded URLs
    const urlMatches = file.content.match(/https?:\/\/[^(]+\.(com|org|net|io|dev|app)/g);
    if (urlMatches) {
      for (const url of urlMatches.slice(0, 2)) {
        if (!url.includes('github.com') && !url.includes('nodejs.org') && !url.includes('w3.org')) {
          issues.push({ severity: 'Low', title: 'Hardcoded URL', file: file.path, detail: `URL ${url.slice(0, 40)}... is hardcoded. Consider using environment variables for configurable endpoints.` });
          break;
        }
      }
    }
  }
  // Check for caret ranges in native dependencies
  for (const dep of deps) {
    if (dep.version.startsWith('^') && (dep.name.includes('swc') || dep.name.includes('native') || dep.name.includes('sharp') || dep.name.includes('esbuild'))) {
      issues.push({ severity: 'High', title: 'Unpinned native dependency', file: `package.json → ${dep.name}`, detail: `${dep.name} uses a caret range (${dep.version}) which can introduce breaking native bindings across environments.` });
    }
  }
  // Check for missing .gitignore
  if (!allFiles.some((f) => f.path === '.gitignore')) {
    issues.push({ severity: 'Medium', title: 'Missing .gitignore', file: '.gitignore', detail: 'No .gitignore found. Sensitive files and build artifacts may be committed accidentally.' });
  }
  // Check for missing LICENSE
  if (!allFiles.some((f) => f.path === 'LICENSE' || f.path === 'LICENSE.md' || f.path === 'LICENSE.txt')) {
    issues.push({ severity: 'Low', title: 'Missing LICENSE file', file: 'LICENSE', detail: 'No license file found. Without a license, the code is technically all-rights-reserved.' });
  }
  if (issues.length === 0) {
    issues.push({ severity: 'Low', title: 'No critical issues detected', file: '—', detail: 'Static analysis found no high-severity problems in the indexed files.' });
  }
  return issues.slice(0, 20);
}

function generateBlueprint(repo: RepoMeta, stack: { name: string; category: string }[], languages: LanguageBreakdown[], readmeScore: number): { summary: string; architecture: { frontend: string; backend: string; database: string; auth: string; deployment: string } } {
  const primaryLang = languages[0]?.name || repo.language || 'Unknown';
  const frontend = stack.find((s) => s.category === 'Frontend') || stack.find((s) => s.category === 'Framework');
  const backend = stack.find((s) => s.category === 'Backend');
  const database = stack.find((s) => s.category === 'Database');
  const arch = {
    frontend: frontend ? frontend.name : primaryLang,
    backend: backend ? backend.name : 'Not detected from manifests',
    database: database ? database.name : 'Not detected from manifests',
    auth: stack.some((s) => s.name.toLowerCase().includes('auth') || s.name.toLowerCase().includes('supabase')) ? 'Detected via dependencies' : 'Not detected',
    deployment: stack.some((s) => s.name === 'Docker') ? 'Docker' : stack.some((s) => s.name === 'Vercel') ? 'Vercel' : 'Not specified',
  };
  const summary = `${repo.name} is a ${primaryLang}-based project${repo.description ? ` — ${repo.description}` : ''}. ${frontend ? `It uses ${frontend.name} for the frontend` : `It's written primarily in ${primaryLang}`}${backend ? ` with ${backend.name} on the backend` : ''}${database ? ` and ${database.name} for data persistence` : ''}. The repository contains ${languages.length} language${languages.length !== 1 ? 's' : ''} and has a README completeness score of ${readmeScore}%.`;
  return { summary, architecture: arch };
}

function detectTestFramework(allFiles: GHFile[]): { name: string; fileCount: number; detected: boolean } {
  const testFiles = allFiles.filter((f) => f.path.match(/\.(test|spec)\.(ts|tsx|js|jsx|py|rs|go)$/i) || f.path.match(/__(tests?)__\//i) || f.path.match(/\/tests?\//i));
  const filePaths = allFiles.map((f) => f.path);
  let name = 'None detected';
  if (filePaths.some((p) => p.includes('jest.config'))) name = 'Jest';
  else if (filePaths.some((p) => p.includes('vitest.config'))) name = 'Vitest';
  else if (filePaths.some((p) => p.includes('pytest.ini') || p.includes('conftest.py') || p.includes('pyproject.toml'))) name = 'pytest';
  else if (filePaths.some((p) => p.includes('Cargo.toml'))) name = 'cargo test';
  else if (filePaths.some((p) => p.includes('go.mod'))) name = 'go test';
  else if (testFiles.length > 0) name = 'Detected (config missing)';
  return { name, fileCount: testFiles.length, detected: testFiles.length > 0 };
}

function generateRecommendations(issues: Issue[], readme: { score: number; missing: string[] }, deps: Dependency[], health: { overall: number; codeQuality: number; security: number; dependencies: number; docs: number }, testFramework: { name: string; detected: boolean }): { priority: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; detail: string; impact: string; effort: string }[] {
  const recs: { priority: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; detail: string; impact: string; effort: string }[] = [];
  // Sort issues by severity for prioritization
  const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sortedIssues = [...issues].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  for (const issue of sortedIssues.slice(0, 3)) {
    if (issue.title === 'No critical issues detected') continue;
    recs.push({
      priority: issue.severity as any,
      title: issue.title,
      detail: issue.detail,
      impact: issue.severity === 'High' || issue.severity === 'Critical' ? 'High impact on stability or security' : 'Moderate impact on code quality',
      effort: issue.severity === 'High' ? 'Medium effort' : 'Low effort',
    });
  }
  if (readme.score < 60) {
    recs.push({
      priority: 'Medium',
      title: 'Improve README documentation',
      detail: `README is missing: ${readme.missing.join(', ') || 'key sections'}. A complete README helps new contributors get started faster.`,
      impact: 'Improves onboarding and project discoverability',
      effort: 'Low effort — 30 minutes',
    });
  }
  if (deps.filter((d) => d.version.startsWith('^') || d.version.startsWith('~')).length > deps.length * 0.5 && deps.length > 10) {
    recs.push({
      priority: 'Medium',
      title: 'Pin dependency versions',
      detail: `${deps.filter((d) => d.version.startsWith('^') || d.version.startsWith('~')).length} of ${deps.length} dependencies use range versions. Pinning prevents unexpected breaking changes.`,
      impact: 'Improves build reproducibility across environments',
      effort: 'Low effort — use npm shrinkwrap or lockfile',
    });
  }
  if (!testFramework.detected) {
    recs.push({
      priority: 'Medium',
      title: 'Add test coverage',
      detail: 'No test files detected. Adding tests improves confidence when making changes and prevents regressions.',
      impact: 'Reduces regression risk and improves maintainability',
      effort: 'High effort — ongoing investment',
    });
  }
  if (health.security < 80) {
    recs.push({
      priority: 'High',
      title: 'Address security findings',
      detail: 'Security score is below 80. Review the Security tab for details on secret patterns and vulnerable dependencies.',
      impact: 'Prevents potential data breaches',
      effort: 'Medium effort',
    });
  }
  if (recs.length === 0) {
    recs.push({
      priority: 'Low',
      title: 'Project is in good shape',
      detail: 'No high-priority recommendations. Keep maintaining code quality and documentation.',
      impact: 'Maintains current health',
      effort: 'Ongoing',
    });
  }
  return recs.slice(0, 6);
}

function generateOptimizations(stack: { name: string; category: string }[], deps: Dependency[], allFiles: GHFile[], health: { codeQuality: number; dependencies: number; docs: number }): { category: string; tip: string; detail: string }[] {
  const tips: { category: string; tip: string; detail: string }[] = [];
  const filePaths = allFiles.map((f) => f.path);
  if (deps.length > 100) {
    tips.push({ category: 'Bundle size', tip: 'Audit dependency tree', detail: `${deps.length} dependencies detected. Run npm ls or a bundle analyzer to identify unused or duplicate packages that inflate bundle size.` });
  }
  if (filePaths.some((p) => p.endsWith('.tsx') || p.endsWith('.jsx')) && !stack.some((s) => s.name === 'Next.js')) {
    tips.push({ category: 'Performance', tip: 'Consider code splitting', detail: 'React components detected without a framework-level router. Use React.lazy or dynamic imports to reduce initial bundle size.' });
  }
  if (!filePaths.some((p) => p.includes('.dockerignore') || p.includes('Dockerfile'))) {
    tips.push({ category: 'DevOps', tip: 'Add containerization', detail: 'No Dockerfile found. Adding one standardizes the development environment and simplifies deployment.' });
  }
  if (health.docs < 80) {
    tips.push({ category: 'Documentation', tip: 'Expand inline documentation', detail: 'README completeness is below 80%. Add sections for installation, usage, and deployment to improve onboarding.' });
  }
  if (deps.filter((d) => d.version.startsWith('^')).length > 5) {
    tips.push({ category: 'Dependency management', tip: 'Use a lockfile strategy', detail: 'Multiple caret-range dependencies detected. Ensure lockfiles are committed and CI uses npm ci or pnpm install --frozen-lockfile.' });
  }
  if (!filePaths.some((p) => p.match(/\.(test|spec)\./))) {
    tips.push({ category: 'Testing', tip: 'Introduce automated tests', detail: 'No test files found. Start with critical path tests for the most important user flows.' });
  }
  if (tips.length === 0) {
    tips.push({ category: 'General', tip: 'Keep up the good work', detail: 'No specific optimizations needed based on the detected project structure.' });
  }
  return tips.slice(0, 6);
}

function generateSetup(repo: RepoMeta, stack: { name: string; category: string }[], deps: Dependency[]): { runtime: string; steps: string[]; requirements: string[] } {
  const hasNode = deps.length > 0 && stack.some((s) => ['React', 'Next.js', 'Vue', 'Express', 'Fastify', 'TypeScript'].includes(s.name));
  const hasPython = stack.some((s) => ['FastAPI', 'Django', 'Flask'].includes(s.name));
  const hasRust = stack.some((s) => s.name === 'Rust' || s.name === 'Cargo');
  const runtime = hasNode ? 'Node.js' : hasPython ? 'Python' : hasRust ? 'Rust' : 'Unknown';
  const steps: string[] = [];
  const requirements: string[] = [];
  if (hasNode) {
    requirements.push('Node.js 18+', 'npm or pnpm');
    steps.push('git clone ' + repo.url, 'cd ' + repo.name, 'npm install', 'npm run dev');
  } else if (hasPython) {
    requirements.push('Python 3.9+', 'pip or poetry');
    steps.push('git clone ' + repo.url, 'cd ' + repo.name, 'pip install -r requirements.txt', 'python main.py');
  } else if (hasRust) {
    requirements.push('Rust toolchain (rustup)', 'cargo');
    steps.push('git clone ' + repo.url, 'cd ' + repo.name, 'cargo build', 'cargo run');
  } else {
    requirements.push('Check repository for runtime details');
    steps.push('git clone ' + repo.url, 'cd ' + repo.name, 'Follow README.md instructions');
  }
  return { runtime, steps, requirements };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get('url');
  if (!repoUrl) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });

  const match = repoUrl.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?(?:[#?].*)?$/i);
  if (!match) return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });

  const [owner, name] = [match[1], match[2]];

  try {
    const repoData = await ghFetch(`/repos/${owner}/${name}`);
    const repo: RepoMeta = {
      owner: repoData.owner.login, name: repoData.name, url: repoData.html_url,
      description: repoData.description || 'No repository description provided.',
      stars: repoData.stargazers_count, forks: repoData.forks_count,
      openIssues: repoData.open_issues_count, license: repoData.license?.spdx_id || null,
      language: repoData.language || 'Unknown', defaultBranch: repoData.default_branch,
      pushedAt: repoData.pushed_at, topics: repoData.topics || [], size: repoData.size,
    };

    const [langData, treeData, readmeData, contributorsData] = await Promise.all([
      ghFetch(`/repos/${owner}/${name}/languages`).catch(() => ({})),
      ghFetch(`/repos/${owner}/${name}/git/trees/${repo.defaultBranch}?recursive=1`).catch(() => ({ tree: [] })),
      ghFetch(`/repos/${owner}/${name}/readme`).catch(() => null),
      ghFetch(`/repos/${owner}/${name}/contributors?per_page=1`).catch(() => []),
    ]);

    const totalBytes = Object.values(langData).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0) || 1;
    const langColors: Record<string, string> = {
      TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
      Go: '#00ADD8', Java: '#b07219', C: '#555555', 'C++': '#f34b7d', CSS: '#563d7c',
      HTML: '#e34c26', Shell: '#89e051', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138',
      Kotlin: '#A97BFF', Dart: '#00B4AB', Vue: '#41b883', Svelte: '#ff3e00',
    };
    const languages: LanguageBreakdown[] = Object.entries(langData)
      .map(([name, bytes]) => ({ name, percentage: Math.round(((bytes as number) / totalBytes) * 1000) / 10, color: langColors[name] || '#8b949e' }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);

    const allFiles: GHFile[] = (treeData.tree || []).filter((f: any) => f.type === 'blob').map((f: any) => ({ path: f.path, type: 'blob', size: f.size }));
    const tree = buildTree(allFiles);

    const keyFileNames = ['package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod', '.env.example', 'README.md', 'Dockerfile'];
    const keyFiles = allFiles.filter((f) => keyFileNames.includes(f.path.split('/').pop() || ''));
    const fileContents: { path: string; content?: string }[] = [];
    for (const file of keyFiles.slice(0, 10)) {
      try {
        const contentRes = await fetch(`${GITHUB_API}/repos/${owner}/${name}/contents/${file.path}`, { headers: { ...authHeaders(), 'Accept': 'application/vnd.github.raw' } });
        if (contentRes.ok) fileContents.push({ path: file.path, content: await contentRes.text() });
      } catch {}
    }

    let dependencies: Dependency[] = [];
    let envVars: EnvVar[] = [];
    let readmeContent = '';

    for (const file of fileContents) {
      if (file.path === 'package.json' && file.content) dependencies = parsePackageJson(file.content);
      if (file.path === 'requirements.txt' && file.content) dependencies = [...dependencies, ...parseRequirementsTxt(file.content)];
      if (file.path === 'Cargo.toml' && file.content) dependencies = [...dependencies, ...parseCargoToml(file.content)];
      if (file.path === '.env.example' && file.content) envVars = parseEnvExample(file.content);
      if (file.path === 'README.md' && file.content) readmeContent = file.content;
    }

    if (!readmeContent && readmeData?.content) {
      readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
    }

    const stack = detectStack(allFiles, dependencies);
    const readme = analyzeReadme(readmeContent);
    const { found: secretsFound, masked: maskedSecrets } = scanSecrets(fileContents);
    const issues = detectIssues(fileContents, dependencies, allFiles);
    const testFramework = detectTestFramework(allFiles);
    const blueprint = generateBlueprint(repo, stack, languages, readme.score);
    const setup = generateSetup(repo, stack, dependencies);

    const securityScore = Math.max(0, 100 - secretsFound * 15 - Math.min(20, issues.filter((i) => i.severity === 'High').length * 10));
    const codeQuality = Math.max(20, 100 - issues.filter((i) => i.severity === 'High').length * 12 - issues.filter((i) => i.severity === 'Medium').length * 6 - issues.filter((i) => i.severity === 'Low').length * 3);
    const depScore = dependencies.length > 0 ? Math.max(30, 100 - Math.floor(dependencies.length / 50) * 5) : 75;
    const health = {
      overall: Math.round((codeQuality + securityScore + depScore + readme.score) / 4),
      codeQuality, security: securityScore, dependencies: depScore, docs: readme.score,
    };
    const recommendations = generateRecommendations(issues, readme, dependencies, health, testFramework);
    const optimizations = generateOptimizations(stack, dependencies, allFiles, health);

    const result: AnalysisResult = {
      repo, languages, tree, dependencies: dependencies.slice(0, 50), envVars, issues,
      stack, readme, security: { score: securityScore, secretsFound, maskedSecrets, vulnCount: 0, notes: secretsFound > 0 ? ['Review files with detected secret patterns'] : [] },
      health, setup, blueprint, stats: { fileCount: allFiles.length, keyFilesParsed: fileContents.length, contributorCount: Array.isArray(contributorsData) ? contributorsData.length : 0 },
      recommendations, optimizations, testFramework,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to analyze repository' }, { status: 500 });
  }
}
