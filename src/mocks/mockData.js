/**
 * Realistic Mock Data for Neural Banking Map
 * For BITS Pilani Hackathon Demo
 */

export const mockStats = {
  total_txns: 1245082,
  fraud_count: 247,
  accuracy: 99.82,
  avg_response_ms: 28.4,
  top_fraud_nodes: [
    { id: "upi_7721_alpha", risk_score: 98.4 },
    { id: "upi_0092_gamma", risk_score: 94.1 },
    { id: "merchant_881_pay", risk_score: 91.8 },
    { id: "upi_5543_beta", risk_score: 89.2 },
    { id: "device_px_992", risk_score: 87.5 },
  ],
};

export const mockFlaggedAccounts = [
  { account_id: "upi_7721_alpha", risk_score: 98.4, ring_size: 14, total_amount: 342000.50, timestamp: "2024-03-30T10:15:00Z", is_frozen: true },
  { account_id: "upi_0092_gamma", risk_score: 94.1, ring_size: 8, total_amount: 88500.00, timestamp: "2024-03-30T10:45:22Z", is_frozen: true },
  { account_id: "merchant_881_pay", risk_score: 91.8, ring_size: 42, total_amount: 1250000.00, timestamp: "2024-03-30T11:02:10Z", is_frozen: false },
  { account_id: "upi_5543_beta", risk_score: 89.2, ring_size: 5, total_amount: 45000.00, timestamp: "2024-03-30T11:20:45Z", is_frozen: false },
  { account_id: "device_px_992", risk_score: 87.5, ring_size: 22, total_amount: 670000.00, timestamp: "2024-03-30T11:45:30Z", is_frozen: true },
];

export const mockReport = (id) => ({
  account_id: id || "upi_7721_alpha",
  ring_nodes: ["upi_7721_alpha", "upi_b_002", "upi_c_003", "dev_x_99", "merch_z_11"],
  edges: [
    { from: "upi_7721_alpha", to: "upi_b_002", amount: 15000, isCycle: true },
    { from: "upi_b_002", to: "upi_c_003", amount: 15000, isCycle: true },
    { from: "upi_c_003", to: "upi_7721_alpha", amount: 15000, isCycle: true },
  ],
  sar_draft: `SUSPICIOUS ACTIVITY REPORT (SAR) - DRAFT
-----------------------------------------
ENTITY: ${id || "upi_7721_alpha"}
DETECTION TIME: ${timestamp||"2024-03-30 10:15:00"}
CONFIDENCE SCORE: 98.4%
PATTERN DETECTED: ${ring_nodes||"Circular Transfer (A->B->C->A)"}
TOTAL EXPOSURE: ${total_amount||"₹3,42,000.50"}

NARRATIVE:
The system detected a high-confidence circular fraud ring involving two 
hop accounts and a final return to the originator within a 24-hour window.
This pattern is indicative of credit history layering or money laundering
to bypass standard velocity checks. The origin device ID has been linked
to 11 other failed login attempts today.

RECOMMENDATION: Immediate freeze of all related UPI IDs.`,
  confidence: 98.4,
  is_frozen: true,
});

export const mockGraphFraud = {
  nodes: [
    { id: "MASTER_ID_X", type: "upi", role: "mastermind" },
    { id: "Victim_A", type: "upi", role: "victim" },
    { id: "Relay_B", type: "upi", role: "relay" },
    { id: "Device_99", type: "device", role: "device" },
    { id: "Merchant_Pay", type: "merchant", role: "victim" },
  ],
  edges: [
    { from: "MASTER_ID_X", to: "Relay_B", amount: 45000, isCycle: true },
    { from: "Relay_B", to: "MASTER_ID_X", amount: 45000, isCycle: true },
    { from: "Victim_A", to: "MASTER_ID_X", amount: 34000, isCycle: false },
    { from: "MASTER_ID_X", to: "Merchant_Pay", amount: 12000, isCycle: false },
    { from: "MASTER_ID_X", to: "Device_99", amount: 0, isCycle: false },
  ],
};

// Tool to generate random transaction for Live Feed
export const generateLiveTransaction = () => {
  const is_fraud = Math.random() < 0.2; // 20% fraud chance
  const upi_ids = ["upi_user_1", "upi_user_2", "upi_user_3", "upi_user_4", "upi_user_5"];
  const merchants = ["Amazon", "Zomato", "Swiggy", "PhonePe", "GooglePay"];
  
  return {
    upi_id: upi_ids[Math.floor(Math.random() * upi_ids.length)],
    amount: Math.floor(Math.random() * 50000) + 100,
    is_fraud,
    confidence: is_fraud ? (Math.random() * 25 + 75).toFixed(2) : (Math.random() * 10).toFixed(2),
    timestamp: new Date().toISOString(),
    txn_id: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    type: Math.random() > 0.5 ? "P2P" : "P2M",
    merchant: merchants[Math.floor(Math.random() * merchants.length)],
  };
};
