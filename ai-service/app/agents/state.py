"""
LangGraph Agent State Schema
"""
from typing import Annotated, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """State passed through the LangGraph agent graph."""
    messages: Annotated[list[BaseMessage], add_messages]
    business_id: int
    language: str
