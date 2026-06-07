import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, clients, orders, dashboard, messages, discount_programs
from routers import campaigns, audience, ab_tests, placements, payments
from routers import contracts, tasks, vendors, leads, client_contacts
from routers import monitoring

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="Ad Agency API",
    description="Full-stack advertising agency management system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(messages.router)
app.include_router(discount_programs.router)
app.include_router(campaigns.router)
app.include_router(campaigns.channels_router)
app.include_router(audience.router)
app.include_router(audience.campaign_segments_router)
app.include_router(ab_tests.router)
app.include_router(placements.router)
app.include_router(placements.calendar_router)
app.include_router(payments.router)
app.include_router(payments.webhook_router)
app.include_router(contracts.router)
app.include_router(tasks.router)
app.include_router(vendors.router)
app.include_router(leads.router)
app.include_router(client_contacts.router)
app.include_router(monitoring.router)


@app.get("/")
def root():
    return {"message": "Ad Agency API", "docs": "/docs"}
