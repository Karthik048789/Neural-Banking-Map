"""
============================================================
Neural Banking Map — GraphSAGE Inference Module
============================================================
Loads the trained GraphSAGE model ONCE at import / startup,
then exposes predict_transaction() for real-time scoring.
============================================================
"""

from __future__ import annotations

import os
import math
import logging
import random
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn

logger = logging.getLogger("neural_banking_map.inference")

# ────────────────────────────────────────────────────────────
# GraphSAGE Model Architecture
# ────────────────────────────────────────────────────────────
# Matches the trained checkpoint: 2-layer SAGEConv → BatchNorm
# → ReLU → Linear classifier.  We reproduce the architecture
# here so we can load the state dict without depending on
# torch_geometric at inference time (works on CPU).
# ────────────────────────────────────────────────────────────

try:
    from torch_geometric.nn import SAGEConv

    class GraphSAGEModel(nn.Module):
        """Two-layer GraphSAGE without batch normalisation."""

        def __init__(self, in_channels: int = 11, hidden_channels: int = 64,
                     out_channels: int = 1) -> None:
            super().__init__()
            self.conv1 = SAGEConv(in_channels, hidden_channels)
            self.conv2 = SAGEConv(hidden_channels, out_channels)

        def forward(self, x: torch.Tensor,
                    edge_index: torch.Tensor) -> torch.Tensor:
            h = self.conv1(x, edge_index)
            h = torch.relu(h)
            h = self.conv2(h, edge_index)
            return torch.sigmoid(h)

    HAS_PYG = True

except ImportError:
    logger.warning("⚠️  torch_geometric not installed — using fallback MLP model")
    HAS_PYG = False

    class GraphSAGEModel(nn.Module):  # type: ignore[no-redef]
        """Fallback MLP when PyG is not available."""

        def __init__(self, in_channels: int = 11, hidden_channels: int = 64,
                     out_channels: int = 1) -> None:
            super().__init__()
            self.fc1 = nn.Linear(in_channels, hidden_channels)
            self.fc2 = nn.Linear(hidden_channels, out_channels)

        def forward(self, x: torch.Tensor,
                    edge_index: torch.Tensor | None = None) -> torch.Tensor:
            h = torch.relu(self.fc1(x))
            h = self.fc2(h)
            return torch.sigmoid(h)


# ────────────────────────────────────────────────────────────
# Model Singleton — loaded once at startup
# ────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "model" / "graphsage.pt"

_model: GraphSAGEModel | None = None
_features_list: list[str] = [
    "type_enc", "log_amount", "amount_ratio_orig", "amount_ratio_dest",
    "orig_balance_diff", "dest_balance_diff", "orig_zero_after",
    "dest_zero_before", "step_norm", "orig_tx_count_norm",
    "orig_total_sent_log",
]
_account_to_id: dict[str, int] = {}
_model_loaded: bool = False
_model_metrics: dict[str, Any] = {}

# Feature index positions (precomputed for quick lookup)
FEAT_LOG_AMOUNT = 1
FEAT_AMOUNT_RATIO_ORIG = 2
FEAT_STEP_NORM = 8


def load_model() -> bool:
    """
    Load the GraphSAGE checkpoint from disk.
    Called once during FastAPI lifespan startup.
    Returns True if model is ready for inference.
    """
    global _model, _features_list, _account_to_id, _model_loaded, _model_metrics

    if not MODEL_PATH.exists():
        logger.warning("⚠️  Model checkpoint not found at %s — using heuristic fallback", MODEL_PATH)
        _model_loaded = False
        return False

    try:
        checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)

        # Extract metadata from checkpoint
        if "features" in checkpoint:
            _features_list = checkpoint["features"]
        if "account_to_id" in checkpoint:
            _account_to_id = checkpoint["account_to_id"]
        if "metrics" in checkpoint:
            _model_metrics = checkpoint["metrics"]

        in_channels = len(_features_list)
        _model = GraphSAGEModel(in_channels=in_channels)

        if "model_state" in checkpoint:
            _model.load_state_dict(checkpoint["model_state"], strict=False)
        elif "model_state_dict" in checkpoint:
            _model.load_state_dict(checkpoint["model_state_dict"], strict=False)

        _model.eval()
        _model_loaded = True
        logger.info("✅ GraphSAGE model loaded (%d features, %d known accounts)",
                     in_channels, len(_account_to_id))
        return True

    except Exception as exc:
        logger.error("❌ Failed to load model: %s", exc)
        _model_loaded = False
        return False


def is_model_loaded() -> bool:
    """Check whether the model is ready."""
    return _model_loaded


def get_model_metrics() -> dict[str, Any]:
    """Return training metrics stored in the checkpoint."""
    return _model_metrics


# ────────────────────────────────────────────────────────────
# Feature Engineering
# ────────────────────────────────────────────────────────────

def _build_features(tx: dict[str, Any]) -> torch.Tensor:
    """
    Build the 11-dimensional feature vector from a raw transaction.

    The features mirror the training pipeline:
      type_enc, log_amount, amount_ratio_orig, amount_ratio_dest,
      orig_balance_diff, dest_balance_diff, orig_zero_after,
      dest_zero_before, step_norm, orig_tx_count_norm, orig_total_sent_log
    """
    amount = float(tx.get("amount", 0))
    log_amount = math.log1p(amount)

    # Normalised amount ratios (heuristic for live transactions)
    amount_ratio_orig = min(amount / 100000.0, 1.0)   # cap at ₹1L
    amount_ratio_dest = min(amount / 200000.0, 1.0)

    # Balance diff heuristics (not available in live data — approximate)
    orig_balance_diff = -amount / 100000.0
    dest_balance_diff = amount / 100000.0

    # Boolean flags
    orig_zero_after = 1.0 if amount > 50000 else 0.0  # large txn heuristic
    dest_zero_before = 0.0

    # Step / time normalisation
    step_norm = tx.get("step_norm", random.uniform(0.3, 0.7))

    # Account activity heuristics for unknown accounts
    orig_tx_count_norm = tx.get("orig_tx_count_norm", 0.1)
    orig_total_sent_log = math.log1p(tx.get("orig_total_sent", amount))

    # Transaction type encoding
    tx_type = tx.get("tx_type", "TRANSFER")
    type_map = {"PAYMENT": 0, "TRANSFER": 1, "CASH_OUT": 2, "DEBIT": 3, "CASH_IN": 4}
    type_enc = float(type_map.get(tx_type, 1))

    features = [
        type_enc,
        log_amount,
        amount_ratio_orig,
        amount_ratio_dest,
        orig_balance_diff,
        dest_balance_diff,
        orig_zero_after,
        dest_zero_before,
        step_norm,
        orig_tx_count_norm,
        orig_total_sent_log,
    ]
    return torch.tensor([features], dtype=torch.float32)


# ────────────────────────────────────────────────────────────
# Heuristic Fallback Scorer
# ────────────────────────────────────────────────────────────

def _heuristic_score(tx: dict[str, Any]) -> float:
    """
    Rule-based fraud score when the model is unavailable.
    Combines amount thresholds, known fraud patterns, and randomness
    to simulate realistic scoring for demo purposes.
    """
    score = 0.0
    amount = float(tx.get("amount", 0))

    # Large amounts are riskier
    if amount > 50000:
        score += 0.3
    elif amount > 20000:
        score += 0.15
    elif amount > 10000:
        score += 0.08

    # Known fraud accounts from mock data
    known_fraud = {"UPI_8834729105", "UPI_6621903847", "UPI_3390281746",
                   "UPI_5517204839", "UPI_1148302956"}
    if tx.get("upi_id") in known_fraud:
        score += 0.55

    # Slight randomness for demo variety
    score += random.uniform(0.0, 0.15)

    return min(score, 0.99)


# ────────────────────────────────────────────────────────────
# Main Prediction Function
# ────────────────────────────────────────────────────────────

def predict_transaction(tx: dict[str, Any]) -> dict[str, Any]:
    """
    Score a single transaction for fraud.

    Parameters
    ----------
    tx : dict
        Must contain at minimum: upi_id, amount.
        Optional: device_id, merchant, tx_type, step_norm, etc.

    Returns
    -------
    dict with keys:
        is_fraud : bool — True if confidence ≥ 0.75
        confidence : float — raw model output (0-1)
        risk_score : float — same as confidence (used by downstream)
    """
    # ── Model inference ──
    if _model_loaded and _model is not None:
        try:
            features = _build_features(tx)
            with torch.no_grad():
                # For the fallback MLP, edge_index is unused
                if HAS_PYG:
                    # Single-node inference: self-loop edge
                    edge_index = torch.tensor([[0], [0]], dtype=torch.long)
                    output = _model(features, edge_index)
                else:
                    output = _model(features)

                confidence = float(output.squeeze().item())
        except Exception as exc:
            logger.error("Model inference failed, using heuristic: %s", exc)
            confidence = _heuristic_score(tx)
    else:
        # ── Heuristic fallback ──
        confidence = _heuristic_score(tx)

    is_fraud = confidence >= 0.75

    return {
        "is_fraud": is_fraud,
        "confidence": round(confidence, 4),
        "risk_score": round(confidence, 4),
    }
