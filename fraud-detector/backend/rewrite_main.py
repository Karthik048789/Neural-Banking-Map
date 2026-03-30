import os

filepath = r"z:\bits_project_nerual_banking\fraud-detector\backend\main.py"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Insert _ws_clients and _broadcast below _push_recent
search_str = """
def _push_recent(tx_event: dict[str, Any]) -> None:
    _recent_transactions.append(tx_event)
    if len(_recent_transactions) > MAX_RECENT:
        _recent_transactions.pop(0)
"""
replace_str = """
def _push_recent(tx_event: dict[str, Any]) -> None:
    _recent_transactions.append(tx_event)
    if len(_recent_transactions) > MAX_RECENT:
        _recent_transactions.pop(0)

# Connected WebSocket clients
_ws_clients: list[WebSocket] = []

async def _broadcast(message: dict[str, Any]) -> None:
    \"\"\"Send a message to all connected WebSocket clients.\"\"\"
    import json
    data = json.dumps(message)
    disconnected: list[WebSocket] = []
    for ws in _ws_clients:
        try:
            await ws.send_text(data)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        _ws_clients.remove(ws)
"""
text = text.replace(search_str, replace_str)

# 2. Add await _broadcast in process_transaction
search_str2 = """    _push_recent(tx_event)

    logger.info("""
replace_str2 = """    _push_recent(tx_event)
    await _broadcast(tx_event)

    logger.info("""
text = text.replace(search_str2, replace_str2)

# 3. Remove all the websocket mock definitions
import re
# We want to remove from # Connected WebSocket clients up to just before @ws_router
regex_str = r"# Connected WebSocket clients\s*_ws_clients: list\[WebSocket\] = \[\].*?(_stream_task: asyncio\.Task\[None\] \| None = None\s*)"
text = re.sub(regex_str, "", text, flags=re.DOTALL)

# 4. Remove _stream_task usages inside websocket_live
text = text.replace("    global _stream_task\n\n", "")

search_str3 = """    # Start background simulation if not running
    if _stream_task is None or _stream_task.done():
        _stream_task = asyncio.create_task(_simulate_stream())

    # Send recent history"""
replace_str3 = """    # Send recent history"""
text = text.replace(search_str3, replace_str3)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)

print("Rewritten main.py successfully")
