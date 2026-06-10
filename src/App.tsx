import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Github,
  GitBranch,
  Play,
  RotateCcw,
  ShieldCheck,
  TerminalSquare,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";

type ContentType = "fact" | "quote" | "joke";
type RunStatus = "idle" | "waiting" | "approved" | "retrying" | "rejected";

type DemoItem = {
  tool: "get_fact" | "get_quote" | "get_joke";
  argumentName: "fact" | "quote" | "joke";
  content: string;
  responsePrefix: string;
};

const MAX_RETRIES = 3;

const demoItems: Record<ContentType, DemoItem[]> = {
  fact: [
    {
      tool: "get_fact",
      argumentName: "fact",
      content:
        "The first computer programmer was Ada Lovelace, who wrote notes for Charles Babbage's Analytical Engine in the 1840s.",
      responsePrefix: "Here's an interesting fact:",
    },
    {
      tool: "get_fact",
      argumentName: "fact",
      content:
        "Honey never truly spoils when it is sealed and stored properly because its low moisture and acidity resist microbial growth.",
      responsePrefix: "Here's an interesting fact:",
    },
    {
      tool: "get_fact",
      argumentName: "fact",
      content:
        "Octothorpe is a formal name for the # symbol, a word popularized by engineers at Bell Labs.",
      responsePrefix: "Here's an interesting fact:",
    },
    {
      tool: "get_fact",
      argumentName: "fact",
      content:
        "The word robot comes from the Czech word robota, meaning forced labor or work.",
      responsePrefix: "Here's an interesting fact:",
    },
  ],
  quote: [
    {
      tool: "get_quote",
      argumentName: "quote",
      content: "Small, consistent actions compound into visible progress.",
      responsePrefix: "Here's a motivational quote:",
    },
    {
      tool: "get_quote",
      argumentName: "quote",
      content: "Clarity grows when you keep showing up for the next honest step.",
      responsePrefix: "Here's a motivational quote:",
    },
    {
      tool: "get_quote",
      argumentName: "quote",
      content: "A calm review before action is still momentum.",
      responsePrefix: "Here's a motivational quote:",
    },
    {
      tool: "get_quote",
      argumentName: "quote",
      content: "The best systems make careful choices feel natural.",
      responsePrefix: "Here's a motivational quote:",
    },
  ],
  joke: [
    {
      tool: "get_joke",
      argumentName: "joke",
      content: "Why did the AI agent ask for approval? It wanted to make a supervised decision.",
      responsePrefix: "Here's a joke:",
    },
    {
      tool: "get_joke",
      argumentName: "joke",
      content: "I told my agent to think outside the box, so it asked who approved the box.",
      responsePrefix: "Here's a joke:",
    },
    {
      tool: "get_joke",
      argumentName: "joke",
      content: "A tool call walked into production. Security asked, 'Do you have a human with you?'",
      responsePrefix: "Here's a joke:",
    },
    {
      tool: "get_joke",
      argumentName: "joke",
      content: "The agent retried its joke three times. The fourth attempt was reviewed by committee.",
      responsePrefix: "Here's a joke:",
    },
  ],
};

const statusCopy: Record<RunStatus, string> = {
  idle: "Ready",
  waiting: "Awaiting human decision",
  approved: "Approved and executed",
  retrying: "Retry requested",
  rejected: "Stopped by reviewer",
};

const typeLabels: Record<ContentType, string> = {
  fact: "Fact",
  quote: "Quote",
  joke: "Joke",
};

function App() {
  const [contentType, setContentType] = useState<ContentType>("fact");
  const [itemIndex, setItemIndex] = useState(0);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [auditLog, setAuditLog] = useState<string[]>([
    "Agent initialized with Nebius Llama 3.3 70B.",
    "Waiting for a content request.",
  ]);

  const currentItem = useMemo(() => {
    const items = demoItems[contentType];
    return items[itemIndex % items.length];
  }, [contentType, itemIndex]);

  const proposedArguments = useMemo(
    () => ({
      [currentItem.argumentName]: currentItem.content,
    }),
    [currentItem],
  );

  function resetForType(nextType: ContentType) {
    setContentType(nextType);
    setItemIndex(0);
    setStatus("idle");
    setRetryCount(0);
    setAuditLog([
      `Content mode changed to ${typeLabels[nextType].toLowerCase()}.`,
      "Waiting for a content request.",
    ]);
  }

  function requestApproval() {
    setStatus("waiting");
    setAuditLog((entries) => [
      `Prepared ${currentItem.tool} with ${currentItem.argumentName} argument.`,
      "Pre-execution hook paused the tool call.",
      ...entries.slice(0, 4),
    ]);
  }

  function approveAction() {
    if (status !== "waiting") return;
    setStatus("approved");
    setRetryCount(0);
    setAuditLog((entries) => [
      "Human reviewer approved the tool call.",
      `${currentItem.responsePrefix} ${currentItem.content}`,
      ...entries.slice(0, 4),
    ]);
  }

  function retryAction() {
    if (status !== "waiting") return;

    if (retryCount >= MAX_RETRIES) {
      setStatus("rejected");
      setAuditLog((entries) => [
        "Retry limit reached. Agent execution stopped gracefully.",
        ...entries.slice(0, 5),
      ]);
      return;
    }

    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    setItemIndex((index) => index + 1);
    setStatus("retrying");
    setAuditLog((entries) => [
      `Retry requested by reviewer. Attempt ${nextRetry} of ${MAX_RETRIES}.`,
      "Model will propose new tool arguments.",
      ...entries.slice(0, 4),
    ]);

    window.setTimeout(() => {
      setStatus("waiting");
      setAuditLog((entries) => [
        "New proposal ready for human approval.",
        ...entries.slice(0, 5),
      ]);
    }, 450);
  }

  function rejectAction() {
    if (status !== "waiting") return;
    setStatus("rejected");
    setAuditLog((entries) => [
      "Human reviewer rejected the proposed action.",
      "StopAgentRun ended the tool loop without executing.",
      ...entries.slice(0, 4),
    ]);
  }

  function resetDemo() {
    setStatus("idle");
    setRetryCount(0);
    setItemIndex(0);
    setAuditLog([
      "Agent initialized with Nebius Llama 3.3 70B.",
      "Waiting for a content request.",
    ]);
  }

  const canDecide = status === "waiting";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Python AI Agent</p>
          <h1>Human-in-the-Loop Agent</h1>
        </div>
        <nav aria-label="Project links">
          <a href="https://github.com/tirth1263/human-in-the-loop-agent" target="_blank" rel="noreferrer">
            <Github size={18} aria-hidden="true" />
            GitHub
          </a>
          <a href="https://tokenfactory.nebius.com/" target="_blank" rel="noreferrer">
            <ExternalLink size={18} aria-hidden="true" />
            Nebius API
          </a>
        </nav>
      </header>

      <section className="workspace-grid" aria-label="Human in the loop demo">
        <div className="console-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Interactive Review</p>
              <h2>Approval Console</h2>
            </div>
            <span className={`status-pill status-${status}`}>{statusCopy[status]}</span>
          </div>

          <div className="segmented-control" aria-label="Content type">
            {(Object.keys(typeLabels) as ContentType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={contentType === type ? "active" : ""}
                onClick={() => resetForType(type)}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>

          <div className="proposal-table" aria-label="Proposed tool call">
            <div>
              <span>Tool</span>
              <strong>{currentItem.tool}</strong>
            </div>
            <div>
              <span>Arguments</span>
              <code>{JSON.stringify(proposedArguments, null, 2)}</code>
            </div>
            <div>
              <span>Retry budget</span>
              <strong>
                {retryCount} / {MAX_RETRIES}
              </strong>
            </div>
          </div>

          <div className="primary-actions">
            <button type="button" className="command-button" onClick={requestApproval}>
              <Play size={18} aria-hidden="true" />
              Run Approval Check
            </button>
            <button type="button" className="ghost-button" onClick={resetDemo}>
              <RotateCcw size={18} aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="review-actions" aria-label="Human decision">
            <button type="button" onClick={approveAction} disabled={!canDecide} title="Approve tool execution">
              <CheckCircle2 size={20} aria-hidden="true" />
              Approve
            </button>
            <button type="button" onClick={retryAction} disabled={!canDecide} title="Request a new proposal">
              <RotateCcw size={20} aria-hidden="true" />
              Retry
            </button>
            <button type="button" onClick={rejectAction} disabled={!canDecide} title="Stop the agent run">
              <XCircle size={20} aria-hidden="true" />
              Reject
            </button>
          </div>
        </div>

        <WorkflowPanel status={status} />

        <section className="audit-panel" aria-label="Audit trail">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Runtime Trace</p>
              <h2>Audit Trail</h2>
            </div>
            <TerminalSquare size={22} aria-hidden="true" />
          </div>
          <ol>
            {auditLog.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ol>
        </section>
      </section>

      <section className="detail-strip" aria-label="Project highlights">
        <article>
          <ShieldCheck size={22} aria-hidden="true" />
          <h3>Pre-execution control</h3>
          <p>Every action pauses before a tool runs, making approval explicit and auditable.</p>
        </article>
        <article>
          <RotateCcw size={22} aria-hidden="true" />
          <h3>Bounded retries</h3>
          <p>The reviewer can request better arguments up to three times before the run stops.</p>
        </article>
        <article>
          <FileText size={22} aria-hidden="true" />
          <h3>Fun content tools</h3>
          <p>The Python agent can share facts, motivational quotes, and friendly jokes.</p>
        </article>
      </section>

      <section className="setup-band" aria-label="Setup commands">
        <div>
          <p className="eyebrow">Run Locally</p>
          <h2>Python 3.10 plus a Nebius API key</h2>
        </div>
        <pre>
          <code>{`pip install -r requirements.txt
cp .env.example .env
python main.py`}</code>
        </pre>
      </section>
    </main>
  );
}

function WorkflowPanel({ status }: { status: RunStatus }) {
  return (
    <section className="workflow-panel" aria-label="Workflow diagram">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Execution Path</p>
          <h2>Human-Gated Tool Call</h2>
        </div>
        <GitBranch size={22} aria-hidden="true" />
      </div>

      <div className={`workflow-map workflow-${status}`}>
        <div className="workflow-node developer">
          <UserCheck size={22} aria-hidden="true" />
          <span>Developer</span>
        </div>
        <div className="workflow-line horizontal line-developer-agent" />
        <div className="workflow-node agent">
          <Bot size={22} aria-hidden="true" />
          <span>Agent</span>
        </div>
        <div className="workflow-line horizontal line-agent-tools" />
        <div className="workflow-node tools">
          <Wrench size={22} aria-hidden="true" />
          <span>Tools</span>
        </div>
        <div className="workflow-line vertical line-tools-review" />
        <div className="workflow-node human">
          <ClipboardCheck size={22} aria-hidden="true" />
          <span>Review</span>
        </div>
        <div className="workflow-result approved">
          <CheckCircle2 size={22} aria-hidden="true" />
          <span>Response</span>
        </div>
        <div className="workflow-result rejected">
          <XCircle size={22} aria-hidden="true" />
          <span>Stopped</span>
        </div>
      </div>
    </section>
  );
}

export default App;
