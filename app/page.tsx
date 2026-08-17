'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AlertTriangle, ArrowUpRight, BookOpen, Bot, Check, ChevronDown, ChevronRight,
  Code2, Download, ExternalLink, FileCode2, FileText, Folder, GitBranch, Github,
  HardDrive, KeyRound, Layers3, LayoutDashboard, Loader2, LockKeyhole,
  MessageSquare, MoreHorizontal, Network, Pause, Play, Plus, RefreshCw, Search, Send,
  Settings2, ShieldCheck, Sparkles, Square, Terminal, TrendingUp, Volume2, Zap, X,
} from 'lucide-react';

type Section = 'Overview' | 'Blueprint' | 'Files' | 'Dependencies' | 'Security' | 'AI Copilot';

type Repo = {
  owner: string; name: string; url: string; description: string; stars: number;
  forks: number; openIssues: number; license: string | null; language: string;
  defaultBranch: string; pushedAt: string; topics: string[]; size: number;
};
type LanguageBreakdown = { name: string; percentage: number; color: string };
type TreeItem = { name: string; type: 'folder' | 'file'; children?: TreeItem[]; badge?: string; path?: string; size?: number };
type Dependency = { name: string; version: string; type: string };
type EnvVar = { name: string; required: boolean; documented: boolean; source: string };
type Issue = { severity: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; file: string; detail: string };
type Recommendation = { priority: 'Critical' | 'High' | 'Medium' | 'Low'; title: string; detail: string; impact: string; effort: string };
type Optimization = { category: string; tip: string; detail: string };
type AnalysisResult = {
  repo: Repo; languages: LanguageBreakdown[]; tree: TreeItem[];
  dependencies: Dependency[]; envVars: EnvVar[]; issues: Issue[];
  stack: { name: string; category: string; logo: string }[];
  readme: { score: number; sections: string[]; present: string[]; missing: string[] };
  security: { score: number; secretsFound: number; maskedSecrets: string[]; vulnCount: number; notes: string[] };
  health: { overall: number; codeQuality: number; security: number; dependencies: number; docs: number };
  setup: { runtime: string; steps: string[]; requirements: string[] };
  blueprint: { summary: string; architecture: { frontend: string; backend: string; database: string; auth: string; deployment: string } };
  stats: { fileCount: number; keyFilesParsed: number; contributorCount: number };
  recommendations: Recommendation[];
  optimizations: Optimization[];
  testFramework: { name: string; fileCount: number; detected: boolean };
};

const defaultRepo: Repo = {
  owner: 'vercel', name: 'next.js', url: 'https://github.com/vercel/next.js',
  description: 'The React Framework for the Web', stars: 128400, forks: 27400,
  openIssues: 1400, license: 'MIT', language: 'TypeScript', defaultBranch: 'main',
  pushedAt: '', topics: [], size: 0,
};

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Blueprint', icon: Sparkles }, { label: 'Files', icon: Folder },
  { label: 'Dependencies', icon: Layers3 }, { label: 'Security', icon: ShieldCheck }, { label: 'AI Copilot', icon: Bot },
];

const suggestions = ['Where is authentication handled?', 'How do I run this project locally?', 'What should I fix first?'];

function ScoreRing({ value, label, tone = 'green' }: { value: number; label: string; tone?: 'green' | 'cyan' | 'amber' }) {
  const toneClass = tone === 'green' ? 'score-green' : tone === 'cyan' ? 'score-cyan' : 'score-amber';
  return <div className="score-card"><div className={`score-ring ${toneClass}`} style={{ '--score': `${value * 3.6}deg` } as React.CSSProperties}><span>{value}</span></div><div className="score-label">{label}</div></div>;
}

function TreeNode({ item, depth = 0, onSelect }: { item: TreeItem; depth?: number; onSelect?: (item: TreeItem) => void }) {
  const [open, setOpen] = useState(depth < 2);
  const isFolder = item.type === 'folder';
  return <div>
    <button className="tree-row" style={{ paddingLeft: 12 + depth * 18 }} onClick={() => isFolder ? setOpen(!open) : onSelect?.(item)}>
      {isFolder ? (open ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : <span className="tree-indent" />}
      {isFolder ? <Folder size={15} className="folder-icon" /> : <FileCode2 size={15} className="file-icon" />}
      <span>{item.name}</span>{item.badge && <span className="file-badge">{item.badge}</span>}
    </button>
    {isFolder && open && item.children?.map((child, i) => <TreeNode key={`${child.name}-${i}`} item={child} depth={depth + 1} onSelect={onSelect} />)}
  </div>;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

function buildMarkdownReport(a: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`# RepoSync Analysis Report: ${a.repo.owner}/${a.repo.name}`);
  lines.push('');
  lines.push(`**URL:** ${a.repo.url}`);
  lines.push(`**Description:** ${a.repo.description}`);
  lines.push(`**Stars:** ${a.repo.stars.toLocaleString()} | **Forks:** ${a.repo.forks.toLocaleString()} | **Open Issues:** ${a.repo.openIssues.toLocaleString()}`);
  lines.push(`**License:** ${a.repo.license || 'None'} | **Default Branch:** ${a.repo.defaultBranch}`);
  lines.push(`**Files Indexed:** ${a.stats.fileCount.toLocaleString()} | **Key Files Parsed:** ${a.stats.keyFilesParsed}`);
  lines.push('');
  lines.push('## Project Health');
  lines.push(`- **Overall Score:** ${a.health.overall}/100`);
  lines.push(`- Code Quality: ${a.health.codeQuality}/100`);
  lines.push(`- Security: ${a.health.security}/100`);
  lines.push(`- Dependencies: ${a.health.dependencies}/100`);
  lines.push(`- Documentation: ${a.health.docs}/100`);
  lines.push('');
  lines.push('## Blueprint');
  lines.push(a.blueprint.summary);
  lines.push('');
  lines.push('### Architecture');
  lines.push(`- Frontend: ${a.blueprint.architecture.frontend}`);
  lines.push(`- Backend: ${a.blueprint.architecture.backend}`);
  lines.push(`- Database: ${a.blueprint.architecture.database}`);
  lines.push(`- Auth: ${a.blueprint.architecture.auth}`);
  lines.push(`- Deployment: ${a.blueprint.architecture.deployment}`);
  lines.push('');
  lines.push('## Detected Stack');
  a.stack.forEach((s) => lines.push(`- ${s.name} (${s.category})`));
  lines.push('');
  lines.push('## Setup');
  lines.push(`**Runtime:** ${a.setup.runtime}`);
  lines.push('**Requirements:**');
  a.setup.requirements.forEach((r) => lines.push(`- ${r}`));
  lines.push('**Steps:**');
  a.setup.steps.forEach((s) => lines.push(`- ${s}`));
  lines.push('');
  lines.push('## Recommendations');
  a.recommendations.forEach((r, i) => {
    lines.push(`${i + 1}. **[${r.priority}] ${r.title}**`);
    lines.push(`   - ${r.detail}`);
    lines.push(`   - Impact: ${r.impact}`);
    lines.push(`   - Effort: ${r.effort}`);
  });
  lines.push('');
  lines.push('## Optimizations');
  a.optimizations.forEach((o, i) => {
    lines.push(`${i + 1}. **[${o.category}] ${o.tip}**`);
    lines.push(`   - ${o.detail}`);
  });
  lines.push('');
  lines.push('## Security Scan');
  lines.push(`- Security Score: ${a.security.score}/100`);
  lines.push(`- Secrets Found: ${a.security.secretsFound}`);
  lines.push(`- Vulnerabilities: ${a.security.vulnCount} critical`);
  if (a.security.notes.length > 0) {
    lines.push('### Hardening Notes');
    a.security.notes.forEach((n) => lines.push(`- ${n}`));
  }
  lines.push('');
  lines.push('## Static Analysis Issues');
  a.issues.forEach((issue, i) => {
    lines.push(`${i + 1}. **[${issue.severity}] ${issue.title}** — ${issue.file}`);
    lines.push(`   - ${issue.detail}`);
  });
  lines.push('');
  lines.push('## Dependencies');
  a.dependencies.forEach((d) => lines.push(`- ${d.name}@${d.version} (${d.type})`));
  lines.push('');
  lines.push('## Environment Variables');
  if (a.envVars.length > 0) {
    a.envVars.forEach((v) => lines.push(`- ${v.name} (${v.required ? 'required' : 'optional'})`));
  } else {
    lines.push('- None detected');
  }
  lines.push('');
  lines.push('## Test Framework');
  lines.push(`- Framework: ${a.testFramework.name}`);
  lines.push(`- Test Files: ${a.testFramework.fileCount}`);
  lines.push(`- Detected: ${a.testFramework.detected ? 'Yes' : 'No'}`);
  lines.push('');
  lines.push('---');
  lines.push(`Generated by RepoSync on ${new Date().toLocaleDateString()}`);
  return lines.join('\n');
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [active, setActive] = useState<Section>('Overview');
  const [repoInput, setRepoInput] = useState(defaultRepo.url);
  const [repo, setRepo] = useState<Repo>(defaultRepo);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<'ready' | 'analyzing' | 'done' | 'error'>('ready');
  const [errorMsg, setErrorMsg] = useState('');
  const [copilotInput, setCopilotInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Paste a GitHub URL and analyze it, then ask me anything about the repository.' },
  ]);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<TreeItem | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [workspaceItems, setWorkspaceItems] = useState<string[]>([]);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>('markdown');
  const [exportToast, setExportToast] = useState('');

  async function analyzeRepo() {
    const match = repoInput.trim().match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?(?:[#?].*)?$/i);
    if (!match) { setStatus('error'); setErrorMsg('Enter a valid public GitHub repository URL (e.g. https://github.com/owner/repo).'); return; }
    setStatus('analyzing'); setErrorMsg('');
    try {
      const res = await fetch(`/api/analyze?url=${encodeURIComponent(repoInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze repository');
      setAnalysis(data); setRepo(data.repo); setStatus('done'); setActive('Overview');
      setMessages([{ role: 'bot', text: `I've indexed ${data.stats.fileCount.toLocaleString()} files from ${data.repo.name}. Ask me anything about the architecture, setup, or codebase.` }]);
      setSelectedFile(null);
    } catch (err: any) { setStatus('error'); setErrorMsg(err.message || 'Failed to analyze repository.'); }
  }

  function askCopilot(question = copilotInput) {
    if (!question.trim()) return;
    const a = analysis;
    let answer = 'I need to analyze a repository first. Paste a GitHub URL above and click Analyze.';
    if (a) {
      const q = question.toLowerCase();
      if (q.includes('run') || q.includes('start') || q.includes('setup') || q.includes('install')) {
        answer = `To run ${a.repo.name} locally:\n${a.setup.steps.map((s) => `  ${s}`).join('\n')}\n\nRequirements: ${a.setup.requirements.join(', ')}`;
      } else if (q.includes('auth') || q.includes('authentication')) {
        answer = `Authentication: ${a.blueprint.architecture.auth}. ${a.stack.some((s) => s.name.toLowerCase().includes('supabase')) ? 'Look for auth logic in files referencing Supabase client initialization.' : 'Check the detected stack in the Blueprint tab for auth-related dependencies.'}`;
      } else if (q.includes('fix') || q.includes('issue') || q.includes('problem') || q.includes('first')) {
        const topRec = a.recommendations.find((r) => r.priority === 'High' || r.priority === 'Critical') || a.recommendations[0];
        answer = `What to fix first: ${topRec ? `${topRec.title}. ${topRec.detail} (Impact: ${topRec.impact}, Effort: ${topRec.effort})` : 'No high-severity issues detected.'} The overall health score is ${a.health.overall}/100.`;
      } else if (q.includes('stack') || q.includes('tech') || q.includes('technology')) {
        answer = `Detected stack: ${a.stack.map((s) => `${s.name} (${s.category})`).join(', ') || 'No stack detected from manifests.'}`;
      } else if (q.includes('database') || q.includes('db')) {
        answer = `Database: ${a.blueprint.architecture.database}.`;
      } else if (q.includes('optim') || q.includes('improve') || q.includes('better')) {
        answer = `Optimization suggestions:\n${a.optimizations.map((o) => `  - [${o.category}] ${o.tip}: ${o.detail}`).join('\n')}`;
      } else if (q.includes('test')) {
        answer = `Test framework: ${a.testFramework.name}. ${a.testFramework.detected ? `${a.testFramework.fileCount} test files detected.` : 'No test files detected — consider adding tests.'}`;
      } else {
        answer = `Based on the indexed files, ${a.blueprint.summary} The repository has ${a.stats.fileCount.toLocaleString()} files. Key files parsed: ${a.stats.keyFilesParsed}.`;
      }
    }
    setMessages((current) => [...current, { role: 'user', text: question.trim() }, { role: 'bot', text: answer }]);
    setCopilotInput('');
  }

  function handleExport() {
    if (!analysis) return;
    if (exportFormat === 'markdown') {
      downloadFile(`${analysis.repo.owner}-${analysis.repo.name}-reposync-report.md`, buildMarkdownReport(analysis), 'text/markdown');
    } else {
      downloadFile(`${analysis.repo.owner}-${analysis.repo.name}-reposync-report.json`, JSON.stringify(analysis, null, 2), 'application/json');
    }
    setExportToast(`Report exported as ${exportFormat.toUpperCase()}`);
    setTimeout(() => setExportToast(''), 3000);
  }

  function addToWorkspace(item: string) {
    if (item && !workspaceItems.includes(item)) setWorkspaceItems([...workspaceItems, item]);
  }

  const isAnalyzing = status === 'analyzing';
  const a = analysis;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <img src="/ChatGPT_Image_Aug_14,_2026,_08_12_34_PM.png" alt="RepoSync" className="brand-logo" />
        <div><strong>Repo<span>Sync</span></strong><small>REPOSITORY INTELLIGENCE</small></div>
      </div>
      <div className="workspace-label">WORKSPACE <button aria-label="Add workspace item" onClick={() => setShowWorkspace(true)}><Plus size={13} /></button></div>
      <div className="repo-mini"><div className="repo-avatar"><Github size={18} /></div><div><b>{repo.owner}/{repo.name}</b><small><span className="live-dot" /> {a ? 'ANALYZED' : 'READY'}</small></div><MoreHorizontal size={16} /></div>
      <nav className="side-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={17} /><span>{label}</span>{label === 'AI Copilot' && <span className="new-pill">AI</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button onClick={() => setShowSettings(true)}><Settings2 size={16} /> Settings</button>
        <div className="status-line"><span className="live-dot" /> {a ? `Synced ${formatDate(a.repo.pushedAt)}` : 'Awaiting analysis'} <span>{a ? `${a.stats.fileCount} files` : ''}</span></div>
        <a href="/README.md" target="_blank" rel="noreferrer" className="docs-link"><BookOpen size={14} /> Documentation</a>
      </div>
    </aside>

    <section className="main-area">
      <header className="topbar">
        <div className="crumb"><span>WORKSPACE</span><ChevronRight size={14} /><b>{repo.name}</b></div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Refresh" onClick={analyzeRepo}><RefreshCw size={16} /></button>
          <button className="export-button" onClick={handleExport} disabled={!a}><Download size={15} /> Export report</button>
          <div className="avatar">JD</div>
        </div>
      </header>
      {exportToast && <div className="export-toast">{exportToast}</div>}
      <div className="content">
        <div className="intake-bar">
          <div className="intake-title">
            <div className="pulse-icon"><GitBranch size={16} /></div>
            <div><b>Analyze a repository</b><span>Paste a public GitHub URL to generate a full blueprint</span></div>
          </div>
          <div className="url-control">
            <Github size={16} />
            <input value={repoInput} onChange={(event) => setRepoInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && analyzeRepo()} aria-label="GitHub repository URL" placeholder="https://github.com/owner/repository-name" />
            <button onClick={analyzeRepo} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 size={15} className="spin" /> : <Play size={14} fill="currentColor" />} {isAnalyzing ? 'Analyzing' : 'Analyze repo'}</button>
          </div>
          {status === 'error' && <div className="input-error">{errorMsg}</div>}
        </div>

        {isAnalyzing && <div className="scanner"><Terminal size={15} /><span>&gt; FETCHING REPOSITORY METADATA...</span><Check size={14} /><span>&gt; INDEXING FILE TREE...</span><Check size={14} /><span>&gt; PARSING KEY FILES...</span><span className="cursor">_</span></div>}

        <div className="page-heading">
          <div>
            <div className="eyebrow"><span className="live-dot" /> {a ? 'ANALYSIS COMPLETE' : 'READY TO ANALYZE'} <span>·</span> {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            <h1>{active === 'Overview' ? 'Project overview' : active}</h1>
            <p>{a ? <>Everything your team needs to understand, run, and improve <a href={repo.url} target="_blank" rel="noreferrer">{repo.owner}/{repo.name} <ExternalLink size={12} /></a></> : 'Paste a GitHub URL above to generate a full developer blueprint with real repository data.'}</p>
          </div>
          {a && <div className="heading-actions"><span className="branch-tag"><GitBranch size={14} /> {a.repo.defaultBranch}</span><button className="quiet-button"><MoreHorizontal size={17} /></button></div>}
        </div>

        {!a && !isAnalyzing && <HeroVideo />}

        {a && <>
          {active === 'Overview' && <Overview a={a} expandedIssue={expandedIssue} setExpandedIssue={setExpandedIssue} onCopilot={() => setActive('AI Copilot')} addToWorkspace={addToWorkspace} />}
          {active === 'Blueprint' && <Blueprint a={a} />}
          {active === 'Files' && <Files a={a} selectedFile={selectedFile} setSelectedFile={setSelectedFile} />}
          {active === 'Dependencies' && <Dependencies a={a} />}
          {active === 'Security' && <Security a={a} />}
          {active === 'AI Copilot' && <Copilot a={a} messages={messages} input={copilotInput} setInput={setCopilotInput} ask={askCopilot} />}
        </>}
      </div>
      <footer className="site-footer">
        <span>CREATED BY <a href="https://najish-anjum-portfolio.vercel.app/" target="_blank" rel="noreferrer">NAJISH</a></span>
        <span className="footer-dot">·</span>
        <a href="https://github.com/Najishanjum" target="_blank" rel="noreferrer" className="footer-github"><Github size={15} /> GITHUB</a>
      </footer>
    </section>

    {showSettings && <SettingsModal exportFormat={exportFormat} setExportFormat={setExportFormat} onClose={() => setShowSettings(false)} />}
    {showWorkspace && <WorkspaceModal items={workspaceItems} setItems={setWorkspaceItems} input={workspaceInput} setInput={setWorkspaceInput} onClose={() => setShowWorkspace(false)} a={a} />}
  </main>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    };
    const onLoaded = () => {
      setDuration(video.duration);
      video.play().catch(() => {});
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); } else { video.pause(); }
  }, []);

  const handleStop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  }, []);

  return <div className="hero-video-section">
    <div className="hero-video-glow" />
    <div className="hero-video-content">
      <div className="hero-video-badge"><Sparkles size={13} /> REPOSITORY INTELLIGENCE PLATFORM</div>
      <h2 className="hero-video-title">Repo<span>Sync</span></h2>
      <p className="hero-video-subtitle">Understand, run, and improve any public GitHub repository — powered by AI.</p>
    </div>
    <div className="hero-video-wrapper">
      <div className="hero-video-frame">
        <div className="hero-video-frame-header">
          <span className="frame-dot red" /><span className="frame-dot yellow" /><span className="frame-dot green" />
          <span className="frame-url">reposync.dev</span>
        </div>
        <video ref={videoRef} className="hero-video" autoPlay loop playsInline>
          <source src="/RepoSync.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-controls">
          <button className="vc-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button className="vc-btn" onClick={handleStop} aria-label="Stop">
            <Square size={12} fill="currentColor" />
          </button>
          <div className="vc-timeline" onClick={handleSeek}>
            <div className="vc-timeline-fill" style={{ width: `${progress}%` }} />
            <div className="vc-timeline-thumb" style={{ left: `${progress}%` }} />
          </div>
          <span className="vc-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <span className="vc-volume"><Volume2 size={14} /></span>
        </div>
      </div>
    </div>
    <div className="hero-video-features">
      <div className="hero-feature"><GitBranch size={16} /><div><b>Deep Analysis</b><span>Index every file, dependency, and secret</span></div></div>
      <div className="hero-feature"><ShieldCheck size={16} /><div><b>Security Scan</b><span>Detect exposed credentials instantly</span></div></div>
      <div className="hero-feature"><Bot size={16} /><div><b>AI Copilot</b><span>Ask anything about any repository</span></div></div>
    </div>
  </div>;
}

function Overview({ a, expandedIssue, setExpandedIssue, onCopilot, addToWorkspace }: { a: AnalysisResult; expandedIssue: number | null; setExpandedIssue: (v: number | null) => void; onCopilot: () => void; addToWorkspace: (item: string) => void }) {
  const sevColor = (sev: string) => sev === 'Critical' || sev === 'High' ? 'red' : sev === 'Medium' ? 'amber' : 'cyan';
  const priorityColor = (p: string) => p === 'Critical' || p === 'High' ? 'red' : p === 'Medium' ? 'amber' : 'cyan';
  return <div className="dashboard-grid">
    <section className="hero-card">
      <div className="card-kicker"><Sparkles size={15} /> AI-GENERATED BLUEPRINT <span>v1.4</span></div>
      <h2>{a.repo.description}</h2>
      <p>{a.blueprint.summary}</p>
      <div className="hero-meta">{a.stack.slice(0, 4).map((s) => <span key={s.name}><Code2 size={14} /> {s.name}</span>)}</div>
      <button className="outline-button" onClick={onCopilot}>Ask Copilot about this project <ArrowUpRight size={14} /></button>
    </section>
    <section className="health-card">
      <div className="card-head"><div><div className="card-kicker">PROJECT HEALTH</div><h3>{a.health.overall >= 80 ? 'Strong foundation' : a.health.overall >= 60 ? 'Needs attention' : 'At risk'}</h3></div><TrendingUp size={18} className="green-icon" /></div>
      <div className="health-score"><div><strong>{a.health.overall}</strong><span>/ 100</span></div><div className="health-bar"><i style={{ width: `${a.health.overall}%` }} /></div><small>Composite of code, security, deps, docs</small></div>
      <div className="score-row"><ScoreRing value={a.health.codeQuality} label="Code quality" /><ScoreRing value={a.health.security} label="Security" tone="cyan" /><ScoreRing value={a.health.dependencies} label="Dependencies" tone="amber" /><ScoreRing value={a.health.docs} label="Docs" /></div>
    </section>
    <section className="stat-card">
      <div className="card-kicker">REPOSITORY SIGNALS</div>
      <div className="stats"><div><Github size={16} /><strong>{a.repo.stars.toLocaleString()}</strong><span>Stars</span></div><div><GitBranch size={16} /><strong>{a.repo.forks.toLocaleString()}</strong><span>Forks</span></div><div><AlertTriangle size={16} /><strong>{a.repo.openIssues.toLocaleString()}</strong><span>Open issues</span></div></div>
      {a.repo.license && <div className="license-row"><LockKeyhole size={14} /> {a.repo.license}</div>}
      <div className="language-row">{a.languages.slice(0, 5).map((l) => <span key={l.name} className="lang-chip" style={{ '--dot': l.color } as React.CSSProperties}>{l.name} <b>{l.percentage}%</b></span>)}</div>
    </section>
    <section className="action-card">
      <div className="card-head"><div><div className="card-kicker">RECOMMENDED NEXT</div><h3>Prioritized recommendations</h3></div><Zap size={18} className="amber-icon" /></div>
      {a.recommendations.slice(0, 4).map((rec, i) => <div className="recommendation" key={i}>
        <div className="recommend-icon"><AlertTriangle size={16} /></div>
        <div><b>{rec.title}</b><p>{rec.detail}</p><small className="rec-meta">Impact: {rec.impact} · Effort: {rec.effort}</small></div>
        <span className={priorityColor(rec.priority) === 'red' ? '' : 'med'}>{rec.priority.toUpperCase()}</span>
      </div>)}
      <button className="text-button" onClick={() => setExpandedIssue(null)}>View prioritized action list <ArrowUpRight size={14} /></button>
    </section>
    <section className="issues-card">
      <div className="section-head"><div><div className="card-kicker">STATIC ANALYSIS</div><h3>Issues worth your attention <span className="count-badge">{a.issues.length}</span></h3></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div>
      {a.issues.slice(0, 6).map((issue, index) => <button className="issue-row" key={index} onClick={() => setExpandedIssue(expandedIssue === index ? null : index)}><span className={`severity ${sevColor(issue.severity)}`}>{issue.severity.toUpperCase()}</span><span className="issue-main"><b>{issue.title}</b><small>{issue.file}</small>{expandedIssue === index && <em>{issue.detail}</em>}</span><span className="issue-action">Review <ArrowUpRight size={13} /></span></button>)}
    </section>
    <section className="copilot-card">
      <div className="copilot-orbit"><Bot size={24} /></div>
      <div className="card-kicker">REPO COPILOT</div>
      <h3>Ask questions. Get cited answers.</h3>
      <p>Understand unfamiliar code without hunting through thousands of files.</p>
      <button onClick={onCopilot}>Open Copilot <MessageSquare size={14} /></button>
    </section>
  </div>;
}

function Blueprint({ a }: { a: AnalysisResult }) {
  return <div className="blueprint-grid">
    <section className="panel blueprint-main">
      <div className="panel-title"><div><span className="card-kicker">PROJECT BLUEPRINT</span><h2>How {a.repo.name} fits together</h2></div><Sparkles size={17} className="cyan-icon" /></div>
      <p className="lead">{a.blueprint.summary}</p>
      <div className="architecture">
        <div className="arch-node frontend"><LayoutDashboard size={18} /><b>Frontend</b><span>{a.blueprint.architecture.frontend}</span></div>
        <div className="arch-line" />
        <div className="arch-node api"><Network size={18} /><b>API / Runtime</b><span>{a.blueprint.architecture.backend}</span></div>
        <div className="arch-line" />
        <div className="arch-node database"><HardDrive size={18} /><b>Data layer</b><span>{a.blueprint.architecture.database}</span></div>
      </div>
      <div className="blueprint-columns">
        <div><h4><Terminal size={15} /> How to run it</h4><pre>{a.setup.steps.join('\n')}</pre></div>
        <div><h4><LockKeyhole size={15} /> Requirements</h4><ul>{a.setup.requirements.map((r) => <li key={r}>{r}</li>)}</ul></div>
      </div>
      <div className="optimizations-section">
        <h4><Zap size={15} /> Optimization suggestions</h4>
        <div className="opt-list">
          {a.optimizations.map((opt, i) => <div className="opt-item" key={i}>
            <span className="opt-category">{opt.category}</span>
            <div><b>{opt.tip}</b><p>{opt.detail}</p></div>
          </div>)}
        </div>
      </div>
    </section>
    <section className="panel side-panel">
      <span className="card-kicker">DETECTED STACK</span>
      <div className="stack-list">{a.stack.length > 0 ? a.stack.map((s) => <div key={s.name}><span className="stack-logo">{s.logo}</span><b>{s.name}</b><small>{s.category}</small></div>) : <div><span className="stack-logo">?</span><b>No stack detected</b><small>Check manifests</small></div>}</div>
      <div className="test-section">
        <span className="card-kicker">TEST FRAMEWORK</span>
        <div className="test-info"><Check size={14} /> <b>{a.testFramework.name}</b> <small>{a.testFramework.fileCount} test files</small></div>
      </div>
      {a.repo.topics.length > 0 && <div className="topics-section"><span className="card-kicker">TOPICS</span><div className="topics-list">{a.repo.topics.slice(0, 8).map((t) => <span key={t} className="topic-chip">{t}</span>)}</div></div>}
    </section>
  </div>;
}

function Files({ a, selectedFile, setSelectedFile }: { a: AnalysisResult; selectedFile: TreeItem | null; setSelectedFile: (f: TreeItem | null) => void }) {
  return <div className="files-layout">
    <section className="panel file-browser">
      <div className="panel-title"><div><span className="card-kicker">INDEXED REPOSITORY</span><h2>File explorer</h2></div><div className="file-search"><Search size={14} /><input placeholder="Filter files..." /></div></div>
      <div className="branch-selector"><GitBranch size={14} /> {a.repo.defaultBranch} <ChevronDown size={14} /><span>{a.stats.fileCount.toLocaleString()} files indexed</span></div>
      <div className="tree-root"><Folder size={15} /> <b>{a.repo.name}</b></div>
      {a.tree.map((item, i) => <TreeNode key={`${item.name}-${i}`} item={item} onSelect={setSelectedFile} />)}
    </section>
    <section className="panel file-detail">
      <div className="file-detail-top"><span className="file-type"><FileText size={15} /></span><div><span className="card-kicker">AI EXPLANATION</span><h3>{selectedFile ? selectedFile.name : 'Select a file'}</h3><small>{selectedFile ? `${selectedFile.path} · ${selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}` : 'Click any file in the tree to see an AI-generated explanation'}</small></div><button className="quiet-button"><MoreHorizontal size={17} /></button></div>
      {selectedFile ? <div className="explanation"><Sparkles size={16} /><p>This file is part of the <code>{a.repo.name}</code> repository. Based on its name and location, it likely contains {selectedFile.name.endsWith('.json') ? 'configuration or manifest data' : selectedFile.name.endsWith('.md') ? 'documentation' : selectedFile.name.endsWith('.ts') || selectedFile.name.endsWith('.tsx') ? 'TypeScript source code' : selectedFile.name.endsWith('.py') ? 'Python source code' : 'project source code'}. The repository uses {a.stack.slice(0, 2).map((s) => s.name).join(' and ') || 'standard tooling'}.</p></div> : <div className="explanation"><Sparkles size={16} /><p>Click any file in the tree to see an AI-generated explanation of its purpose and contents.</p></div>}
    </section>
  </div>;
}

function Dependencies({ a }: { a: AnalysisResult }) {
  const depCount = a.dependencies.length;
  return <div className="two-column">
    <section className="panel">
      <div className="panel-title"><div><span className="card-kicker">PACKAGE HEALTH</span><h2>Dependencies</h2></div><span className="healthy-chip"><Check size={13} /> {depCount} packages</span></div>
      <div className="dep-summary"><div><strong>{depCount}</strong><span>Total packages</span></div><div><strong className="green-text">{a.dependencies.filter((d) => !d.version.startsWith('^') && !d.version.startsWith('~')).length}</strong><span>Pinned</span></div><div><strong className="amber-text">{a.dependencies.filter((d) => d.version.startsWith('^') || d.version.startsWith('~')).length}</strong><span>Range versions</span></div><div><strong className="red-text">{a.issues.filter((i) => i.title.includes('dependency') || i.title.includes('Dep')).length}</strong><span>Flagged</span></div></div>
      {a.dependencies.length > 0 ? a.dependencies.slice(0, 20).map((dep) => <div className="dep-row" key={dep.name}><span className="dep-icon">{dep.name.slice(0, 1).toUpperCase()}</span><div><b>{dep.name}</b><small>{dep.type}</small></div><code>{dep.version}</code><span className={dep.version.startsWith('^') || dep.version.startsWith('~') ? 'dep-status warn' : 'dep-status'}>{dep.version.startsWith('^') || dep.version.startsWith('~') ? 'range' : 'pinned'}</span></div>) : <div className="dep-row"><span className="dep-icon">?</span><div><b>No dependencies found</b><small>No manifest files detected</small></div></div>}
    </section>
    <section className="panel checklist">
      <span className="card-kicker">SETUP CHECKLIST</span>
      <h2>{a.setup.runtime} project</h2>
      <p>Runtime: {a.setup.runtime}. We detected {a.stats.keyFilesParsed} key files.</p>
      {a.setup.requirements.map((item) => <div className="check-item" key={item}><span className="check"><Check size={12} /></span><span>{item}</span></div>)}
      {a.envVars.length > 0 && <div className="env-section"><span className="card-kicker">ENVIRONMENT VARIABLES</span>{a.envVars.map((v) => <div className="check-item" key={v.name}><span className="check empty" /><span>{v.name}</span><small>{v.required ? 'required' : 'optional'}</small></div>)}</div>}
      <div className="setup-commands"><span className="card-kicker">SETUP COMMANDS</span><pre>{a.setup.steps.join('\n')}</pre></div>
    </section>
  </div>;
}

function Security({ a }: { a: AnalysisResult }) {
  return <div className="two-column">
    <section className="panel security-main">
      <div className="panel-title"><div><span className="card-kicker">SECURITY SCAN</span><h2>{a.security.score >= 80 ? 'Looks solid' : a.security.score >= 60 ? 'Needs review' : 'At risk'}</h2></div><div className="security-score">{a.security.score} <span>/100</span></div></div>
      <div className="scan-banner"><ShieldCheck size={20} /><div><b>{a.security.secretsFound === 0 ? 'No exposed secrets detected' : `${a.security.secretsFound} secret pattern${a.security.secretsFound !== 1 ? 's' : ''} found`}</b><span>Scanned {a.stats.fileCount.toLocaleString()} tracked files · {a.security.secretsFound > 0 ? 'All masked' : 'Clean'}</span></div>{a.security.secretsFound === 0 ? <Check size={16} /> : <AlertTriangle size={16} className="amber-icon" />}</div>
      {a.security.maskedSecrets.length > 0 && <div className="secrets-list"><span className="card-kicker">MASKED MATCHES</span>{a.security.maskedSecrets.slice(0, 5).map((s, i) => <div className="secret-row" key={i}><KeyRound size={13} /> <code>{s}</code></div>)}</div>}
      <div className="security-grid"><div><span>Secret patterns</span><b className={a.security.secretsFound > 0 ? 'red-text' : 'green-text'}>{a.security.secretsFound} found</b></div><div><span>Known vulnerabilities</span><b className="green-text">{a.security.vulnCount} critical</b></div><div><span>Unsafe configs</span><b className="amber-text">{a.issues.filter((i) => i.severity === 'Medium').length} review</b></div><div><span>Auth surface</span><b>{a.blueprint.architecture.auth === 'Not detected' ? 'Unknown' : 'Detected'}</b></div></div>
      <div className="secret-note"><KeyRound size={15} /><span>Matches are always masked. Values are never stored or displayed.</span></div>
    </section>
    <section className="panel security-tips">
      <span className="card-kicker">HARDENING NOTES</span>
      <h2>{a.security.notes.length > 0 ? `${a.security.notes.length} item${a.security.notes.length !== 1 ? 's' : ''} to review` : 'All clear'}</h2>
      {a.security.notes.length > 0 ? a.security.notes.map((note, i) => <div className="tip" key={i}><div className="tip-number">{String(i + 1).padStart(2, '0')}</div><div><b>{note}</b><p>Review the flagged files and rotate any exposed credentials.</p></div></div>) : <div className="tip"><div className="tip-number">01</div><div><b>No issues found</b><p>The security scan found no critical issues in the indexed files.</p></div></div>}
      {a.readme.missing.length > 0 && <div className="tip"><div className="tip-number">{String(a.security.notes.length + 1).padStart(2, '0')}</div><div><b>Document security practices</b><p>README is missing: {a.readme.missing.join(', ')}</p></div></div>}
    </section>
  </div>;
}

function Copilot({ a, messages, input, setInput, ask }: { a: AnalysisResult; messages: { role: 'user' | 'bot'; text: string }[]; input: string; setInput: (v: string) => void; ask: (q?: string) => void }) {
  return <div className="copilot-layout">
    <section className="panel chat-panel">
      <div className="chat-header"><div className="copilot-orbit small"><Bot size={18} /></div><div><h2>Repo Copilot</h2><span><span className="live-dot" /> Grounded in {a.stats.fileCount.toLocaleString()} indexed files</span></div><button className="quiet-button"><MoreHorizontal size={17} /></button></div>
      <div className="messages">{messages.map((message, index) => <div className={`message ${message.role}`} key={index}><div className="message-avatar">{message.role === 'bot' ? <Bot size={15} /> : 'JD'}</div><div className="message-body">{message.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}</div></div>)}</div>
      <div className="suggestion-row">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}</div>
      <form className="chat-input" onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask anything about this repository..." /><button aria-label="Send question"><Send size={16} /></button></form>
    </section>
    <aside className="panel context-panel">
      <span className="card-kicker">CONTEXT WINDOW</span>
      <h3>What Copilot can see</h3>
      <div className="context-stat"><strong>{a.stats.fileCount.toLocaleString()}</strong><span>files indexed</span></div>
      <div className="context-stat"><strong>{a.stats.keyFilesParsed}</strong><span>key files parsed</span></div>
      <div className="context-stat"><strong>{a.dependencies.length}</strong><span>dependencies</span></div>
      <div className="context-list"><span><Check size={13} /> File paths</span><span><Check size={13} /> Manifest files</span><span><Check size={13} /> README sections</span><span><Check size={13} /> Detected stack</span></div>
      <button className="text-button">View indexing details <ArrowUpRight size={14} /></button>
    </aside>
  </div>;
}

function SettingsModal({ exportFormat, setExportFormat, onClose }: { exportFormat: 'markdown' | 'json'; setExportFormat: (f: 'markdown' | 'json') => void; onClose: () => void }) {
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2><Settings2 size={18} /> Settings</h2>
        <button className="icon-button" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">
        <div className="settings-group">
          <label className="settings-label">Export format</label>
          <p className="settings-desc">Choose the file format when exporting analysis reports.</p>
          <div className="format-options">
            <button className={exportFormat === 'markdown' ? 'format-option active' : 'format-option'} onClick={() => setExportFormat('markdown')}>
              <FileText size={16} /> <span>Markdown (.md)</span>
            </button>
            <button className={exportFormat === 'json' ? 'format-option active' : 'format-option'} onClick={() => setExportFormat('json')}>
              <Code2 size={16} /> <span>JSON (.json)</span>
            </button>
          </div>
        </div>
        <div className="settings-group">
          <label className="settings-label">Analysis depth</label>
          <p className="settings-desc">Deep analysis scans more files and generates richer recommendations.</p>
          <div className="settings-toggle-row">
            <span>Deep analysis enabled</span>
            <span className="settings-badge">On</span>
          </div>
        </div>
        <div className="settings-group">
          <label className="settings-label">Security scanning</label>
          <p className="settings-desc">Scans for exposed secrets, unsafe patterns, and missing security files.</p>
          <div className="settings-toggle-row">
            <span>Secret detection enabled</span>
            <span className="settings-badge">On</span>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

function WorkspaceModal({ items, setItems, input, setInput, onClose, a }: { items: string[]; setItems: (v: string[]) => void; input: string; setInput: (v: string) => void; onClose: () => void; a: AnalysisResult | null }) {
  function add() {
    if (input.trim() && !items.includes(input.trim())) setItems([...items, input.trim()]);
    setInput('');
  }
  function remove(item: string) {
    setItems(items.filter((i) => i !== item));
  }
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2><Folder size={18} /> Workspace</h2>
        <button className="icon-button" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">
        <p className="settings-desc">Add recommendations, files, or notes to track. These stay in your workspace for reference.</p>
        <div className="workspace-add">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Add an item to track..." />
          <button onClick={add}><Plus size={16} /> Add</button>
        </div>
        {a && a.recommendations.length > 0 && (
          <div className="workspace-suggestions">
            <label className="settings-label">Suggested from analysis</label>
            {a.recommendations.slice(0, 3).map((rec, i) => <button key={i} className="workspace-suggestion" onClick={() => { if (!items.includes(rec.title)) setItems([...items, rec.title]); }}><Plus size={13} /> {rec.title}</button>)}
          </div>
        )}
        <div className="workspace-list">
          {items.length > 0 ? items.map((item, i) => <div className="workspace-item" key={i}><Check size={14} /> <span>{item}</span> <button onClick={() => remove(item)}><X size={14} /></button></div>) : <p className="workspace-empty">No items yet. Add one above or pick from the suggestions.</p>}
        </div>
      </div>
    </div>
  </div>;
}
