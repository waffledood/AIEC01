from __future__ import annotations

from typing import Literal

from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel

from app.models import get_chat_model
from app.state import AgentState
from app.tools import get_tool_belt

MAX_ATTEMPTS = 3

SYSTEM_PROMPT = (
    "You are a helpful assistant specialized in feline (cat) health. "
    "Use the retrieve_information tool for cat-health questions, web search for "
    "current information, and Arxiv for research papers. Cite tool results when "
    "they inform your answer."
)

JUDGE_PROMPT = (
    "You are evaluating whether an AI assistant's response is helpful to the user.\n"
    "Respond with is_helpful=true if the response directly and adequately answers "
    "the user's question. Respond with is_helpful=false otherwise.\n"
    "If not helpful, provide a reason in 50 characters or fewer."
)


class HelpfulnessVerdict(BaseModel):
    is_helpful: bool
    reason: str = ""


tools = get_tool_belt()
agent_model = get_chat_model().bind_tools(tools)
judge_model = get_chat_model("gpt-5-nano").with_structured_output(HelpfulnessVerdict)


def agent(state: AgentState) -> AgentState:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + state["messages"]
    response = agent_model.invoke(messages)
    return {"messages": [response]}


def helpfulness_judge(state: AgentState) -> AgentState:
    original_question = next(
        m for m in state["messages"] if isinstance(m, HumanMessage)
    )
    last_answer = next(
        m for m in reversed(state["messages"]) if isinstance(m, AIMessage) and not m.tool_calls
    )

    verdict: HelpfulnessVerdict = judge_model.invoke([
        {"role": "system", "content": JUDGE_PROMPT},
        {"role": "user", "content": f"Question: {original_question.content}"},
        {"role": "assistant", "content": last_answer.content},
    ])

    if verdict.is_helpful or state["attempt_count"] >= MAX_ATTEMPTS:
        return {}

    feedback = HumanMessage(content=f"Your response was not helpful: {verdict.reason[:50]}. Please try again.")
    return {
        "messages": [feedback],
        "attempt_count": state["attempt_count"] + 1,
    }


def route_after_agent(state: AgentState) -> Literal["tools", "helpfulness_judge"]:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return "helpfulness_judge"


def route_after_judge(state: AgentState) -> Literal["agent", "__end__"]:
    last = state["messages"][-1]
    if isinstance(last, HumanMessage) and "not helpful" in last.content:
        return "agent"
    return "__end__"


builder = StateGraph(AgentState)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(tools))
builder.add_node("helpfulness_judge", helpfulness_judge)

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", route_after_agent)
builder.add_edge("tools", "agent")
builder.add_conditional_edges("helpfulness_judge", route_after_judge)

graph = builder.compile()
