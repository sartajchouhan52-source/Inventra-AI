"""Debug script to check HITL interrupt detection."""
import asyncio
import nest_asyncio
nest_asyncio.apply()
from google.adk.runners import InMemoryRunner
from google.genai import types
from app.agent import app

PAYLOAD = '[{"sku": "SKU-MILK-01", "name": "Milk 1L", "current_stock": 2, "minimum_stock": 20, "units": "cartons", "supplier": "Farm Direct", "unit_price": 1.50}]'

async def test():
    runner = InMemoryRunner(app=app)
    session = await runner.session_service.create_session(app_name='app', user_id='dbg')
    print(f'Session: {session.id}')

    msg = types.Content(role='user', parts=[types.Part.from_text(PAYLOAD)])
    events = []
    async for event in runner.run_async(user_id='dbg', session_id=session.id, new_message=msg):
        events.append(event)
        interrupted = getattr(event, 'interrupted', None)
        content_text = ''
        if event.content and event.content.parts:
            for p in event.content.parts:
                if p.text:
                    content_text = p.text[:80]
        print(f'  event: interrupted={interrupted} | output={str(getattr(event,"output",""))[:50]} | text={content_text[:60]}')

    print(f'\nTotal events: {len(events)}')
    print('Checking session state...')
    state = await runner.session_service.get_session(app_name='app', user_id='dbg', session_id=session.id)
    print(f'  execution_id: {state.state.get("execution_id")}')
    print(f'  purchase_recommendations present: {state.state.get("purchase_recommendations") is not None}')
    print(f'  inventory_report present: {state.state.get("inventory_report") is not None}')

asyncio.run(test())
