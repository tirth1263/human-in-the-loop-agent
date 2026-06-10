from __future__ import annotations

import os
from typing import Any, Iterator

from agno.agent import Agent
from agno.exceptions import RetryAgentRun, StopAgentRun
from agno.models.nebius import Nebius
from agno.tools import FunctionCall, tool
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table


MODEL_ID = "meta-llama/Llama-3.3-70B-Instruct"
MAX_RETRIES = 3

console = Console()
retry_state = {"count": 0}


def _pause_live_rendering() -> Any | None:
    """Pause Agno's live stream while Rich asks for human input."""
    live = getattr(console, "_live", None)
    if live is None:
        return None

    try:
        live.stop()
        return live
    except Exception:
        return None


def _resume_live_rendering(live: Any | None) -> None:
    if live is None:
        return

    try:
        live.start()
    except Exception:
        pass


def approval_hook(function_call: FunctionCall) -> None:
    """Require a human decision before any tool action is executed."""
    live = _pause_live_rendering()
    tool_name = getattr(function_call.function, "name", "unknown_tool")
    arguments = function_call.arguments or {}

    table = Table(show_header=False, box=None, padding=(0, 1))
    table.add_row("[bold]Proposed action[/bold]", f"[cyan]{tool_name}[/cyan]")
    table.add_row("[bold]Arguments[/bold]", str(arguments))
    table.add_row("[bold]Retries used[/bold]", f"{retry_state['count']} / {MAX_RETRIES}")

    console.print()
    console.print(
        Panel(
            table,
            title="[bold yellow]Human approval required[/bold yellow]",
            border_style="yellow",
        )
    )

    choice = Prompt.ask(
        "Approve this action?",
        choices=["y", "n", "retry"],
        default="y",
        show_choices=True,
    ).strip().lower()

    _resume_live_rendering(live)

    if choice == "n":
        console.print("[red]Operation cancelled by the human reviewer.[/red]")
        raise StopAgentRun(
            "Rejected by human reviewer",
            agent_message="The proposed action was rejected by the human reviewer.",
        )

    if choice == "retry":
        retry_state["count"] += 1

        if retry_state["count"] > MAX_RETRIES:
            console.print("[red]Maximum retry limit reached.[/red]")
            raise StopAgentRun(
                "Maximum retries reached",
                agent_message="The run stopped because the retry limit was reached.",
            )

        console.print(
            f"[yellow]Retry requested. Attempt {retry_state['count']} of {MAX_RETRIES}.[/yellow]"
        )
        raise RetryAgentRun(
            "The human reviewer requested a better or different tool argument. Try again.",
            agent_message="Let me try again with a different response.",
        )

    retry_state["count"] = 0


@tool(pre_hook=approval_hook)
def get_fact(fact: str) -> Iterator[str]:
    """Share an interesting fact after human approval."""
    yield fact


@tool(pre_hook=approval_hook)
def get_quote(quote: str) -> Iterator[str]:
    """Share a motivational quote after human approval."""
    yield quote


@tool(pre_hook=approval_hook)
def get_joke(joke: str) -> Iterator[str]:
    """Share a light, friendly joke after human approval."""
    yield joke


def build_agent() -> Agent:
    api_key = os.getenv("NEBIUS_API_KEY")
    if not api_key:
        console.print(
            Panel(
                "NEBIUS_API_KEY is missing. Copy .env.example to .env and add your key from "
                "https://tokenfactory.nebius.com/.",
                title="[bold red]Configuration required[/bold red]",
                border_style="red",
            )
        )
        raise SystemExit(1)

    return Agent(
        name="Human in the Loop Agent",
        description="An agent that shares facts, quotes, and jokes only after human approval.",
        instructions="""
You are a fun and informative assistant.

Use the appropriate tool to share exactly one of these content types:
- an interesting fact
- a motivational quote
- a light, friendly joke

Before a tool runs, the human reviewer will approve, reject, or request a retry.
When a tool returns content:
1. For facts, start with "Here's an interesting fact:"
2. For quotes, start with "Here's a motivational quote:"
3. For jokes, start with "Here's a joke:"

If the reviewer asks for a retry, create different content.
If the reviewer rejects the action, stop gracefully.
""",
        tools=[get_fact, get_quote, get_joke],
        markdown=True,
        model=Nebius(id=MODEL_ID, api_key=api_key),
    )


def main() -> None:
    load_dotenv()

    console.print(
        Panel(
            "[bold]Human-in-the-Loop Agent[/bold]\n"
            "Every tool call must be approved before it executes.",
            border_style="cyan",
        )
    )

    prompt = Prompt.ask(
        "What should the agent share?",
        default="Share something fun!",
    )

    retry_state["count"] = 0
    agent = build_agent()
    agent.print_response(prompt, stream=True, console=console)


if __name__ == "__main__":
    main()

