"""
Neural Banking Map — Transaction Simulator
Generates MIXED traffic: ~80% normal merchant payments + ~20% fraud rings.
"""
import time
import random
import requests
from threading import Thread

API_URL = "http://localhost:8000/transaction"

# ── Entities ──
USERS = [f"UPI_{i:04d}" for i in range(1, 51)]
DEVICES = [f"DEV_{i:04d}" for i in range(1, 30)]
MERCHANTS = [
    "MERCH_QuickMart", "MERCH_PayEasy", "MERCH_FoodHub",
    "MERCH_TravelGo", "MERCH_ShopNow", "MERCH_GasStation",
    "MERCH_CafeBliss", "MERCH_Grocery99", "MERCH_FuelPoint",
    "MERCH_BookStore",
]


def send_transaction(upi_id, amount, device_id, merchant):
    payload = {
        "upi_id": upi_id,
        "amount": round(amount, 2),
        "device_id": device_id,
        "merchant": merchant,
    }
    try:
        res = requests.post(API_URL, json=payload, timeout=5)
        data = res.json()
        tag = "🔴 FRAUD" if data.get("is_fraud") else "🟢 SAFE "
        print(f"[{tag}] {upi_id} → {merchant} | ₹{amount:,.0f} | conf={data.get('confidence', 0):.2f}")
        if data.get("is_fraud") and data.get("ring_nodes"):
            print(f"       ⮑  Ring: {data['ring_nodes']}")
    except requests.exceptions.RequestException as e:
        print(f"[Error] {e}")


def simulate_normal_traffic():
    """Generate normal, small merchant payments."""
    while True:
        upi_id = random.choice(USERS)
        device_id = random.choice(DEVICES)
        merchant = random.choice(MERCHANTS)     # Always to a MERCHANT
        amount = random.uniform(10, 4000)       # Small amounts

        send_transaction(upi_id, amount, device_id, merchant)
        time.sleep(random.uniform(1.0, 3.0))


def simulate_fraud_ring():
    """Generate periodic fraud rings: high-amount P2P cycles."""
    while True:
        time.sleep(random.uniform(15, 40))

        # Pick 3-5 users to form a ring
        ring_size = random.choice([3, 4, 5])
        ring_users = random.sample(USERS, ring_size)
        device = random.choice(DEVICES)
        base_amount = random.uniform(55000, 92000)

        ring_str = " → ".join(ring_users + [ring_users[0]])
        print(f"\n{'='*60}")
        print(f"🔺 INITIATING FRAUD RING ({ring_size} nodes): {ring_str}")
        print(f"{'='*60}")

        for i in range(ring_size):
            sender = ring_users[i]
            receiver = ring_users[(i + 1) % ring_size]
            amount = base_amount + random.uniform(-500, 500)

            send_transaction(sender, amount, device, receiver)
            time.sleep(0.8)

        print(f"{'='*60}\n")


if __name__ == "__main__":
    print(f"\n🧠 Neural Banking Simulator")
    print(f"   Target: {API_URL}")
    print(f"   Normal traffic: ₹10-4000 → Merchants (SAFE)")
    print(f"   Fraud rings: ₹55k-92k → P2P cycles (FRAUD)")
    print(f"   Press Ctrl+C to stop.\n")

    t1 = Thread(target=simulate_normal_traffic, daemon=True)
    t2 = Thread(target=simulate_fraud_ring, daemon=True)

    t1.start()
    t2.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
