#!/usr/bin/env python3
"""Render per-panel website figures from the v2 benchmark evaluation.

Tracked in the TriCyp website repo for traceability, but cannot run
standalone here — it expects the manuscript repo at
`~/work/small_metal_binders_2026/scripts/benchmark_roc.py` to be
importable, plus the v2 benchmark dataset / tool predictions on disk.
The canonical execution copy lives at
`~/work/small_metal_binders_2026/scripts/benchmark_web_panels.py`.

Reuses scripts/benchmark_roc.py as a module: data parsers, exclusion
loading, and build_arrays. Produces six single-panel PNGs sized for the
TriCyp /benchmark page plus a metal-stratified ROC strip for figS1.

Also writes a benchmark_metrics.json next to the website's paperData.ts
so BENCHMARK_TABLE / BENCHMARK_IRON_ONLY can derive from the same
(tool, task, stratum) AUROC + AP values that go into the figure
annotations.

The website expects panels A-C = disulfide, D-F = metal (the manuscript's
post-RC1 ordering). The internal benchmark_roc script uses the opposite
order; this wrapper relabels accordingly.

Usage:
    python3 scripts/benchmark_web_panels.py
    OUT_DIR=/srv/tricyp/figures python3 scripts/benchmark_web_panels.py

Outputs:
    fig2a_disulfide_roc.png       (single panel ROC, ESM2 + SSBONDPredict)
    fig2b_disulfide_pr.png        (single panel PR)
    fig2c_disulfide_threshold.png (precision/recall/F1 vs probability threshold)
    fig2d_metal_roc.png
    fig2e_metal_pr.png
    fig2f_metal_threshold.png
    figS1_metal_stratification.png  (metal-type ROC strip: shared metals + iron)
"""
from __future__ import annotations

import os
import sys
from collections import defaultdict

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    auc,
    average_precision_score,
    precision_recall_curve,
    roc_curve,
)

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import benchmark_roc as br  # noqa: E402

DEFAULT_OUT = os.path.expanduser("~/dev/ecod_metal_2026/public/figures")
OUT_DIR = os.environ.get("OUT_DIR", DEFAULT_OUT)

DEFAULT_JSON_OUT = os.path.expanduser(
    "~/dev/ecod_metal_2026/src/lib/data/benchmark_metrics.json"
)
JSON_OUT = os.environ.get("JSON_OUT", DEFAULT_JSON_OUT)

METAL_TYPE_TSV = os.path.join(br.BASEDIR, "data/benchmark/met_metal_type_v2.tsv")

# Tool-name canonicalisation: the script uses "ESM2 (held-out)" /
# "ESM2 (ensemble)" internally to disambiguate prediction channels;
# the website uses "ESM2-3state" everywhere. Mapping kept here so the
# JSON is in the website's vocabulary.
WEB_TOOL_NAME = {
    "ESM2 (held-out)": "ESM2-3state",
    "LMetalSite":      "LMetalSite",
    "GPSite":          "GPSite",
    "SSBONDPredict":   "SSBONDPredict",
}

# Operating thresholds chosen on the held-out validation set, mirroring
# src/lib/paperData.ts BENCHMARK_THRESHOLDS.
OP_THRESHOLD_DISULFIDE = 0.742
OP_THRESHOLD_METAL = 0.972

# Single-panel figures: a square panel reads better at the dashboard
# size the page requests them at than a wide panel does.
PANEL_FIGSIZE = (5.6, 5.0)
STRIP_FIGSIZE = (10.5, 4.4)
DPI = 200


# ---------------------------------------------------------------------------
# Re-usable single-panel plotters
# ---------------------------------------------------------------------------
def _decorate_roc(ax: plt.Axes) -> None:
    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
    ax.set_xlabel("False positive rate")
    ax.set_ylabel("True positive rate")
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)
    ax.legend(loc="lower right", frameon=False)


def _decorate_pr(ax: plt.Axes, prevalence: float) -> None:
    ax.axhline(y=prevalence, color="k", ls="--", lw=1, alpha=0.5,
               label=f"Prevalence {prevalence:.3f}")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)
    ax.legend(loc="lower left", frameon=False)


def _save(fig: plt.Figure, path: str) -> None:
    fig.tight_layout()
    fig.savefig(path, dpi=DPI, bbox_inches="tight")
    plt.close(fig)
    print(f"  wrote {path}")


def plot_single_roc(results: dict, colors: dict, outpath: str) -> None:
    fig, ax = plt.subplots(figsize=PANEL_FIGSIZE)
    for name, (y_true, y_score) in results.items():
        fpr, tpr, _ = roc_curve(y_true, y_score)
        auroc = auc(fpr, tpr)
        ax.plot(fpr, tpr, color=colors[name], lw=2,
                label=f"{name} (AUROC = {auroc:.3f})")
    _decorate_roc(ax)
    _save(fig, outpath)


def plot_single_pr(results: dict, colors: dict, outpath: str) -> None:
    # Prevalence is the same across tools (same labels), use the first.
    first_y_true = next(iter(results.values()))[0]
    prevalence = float(first_y_true.mean())

    fig, ax = plt.subplots(figsize=PANEL_FIGSIZE)
    for name, (y_true, y_score) in results.items():
        precision, recall, _ = precision_recall_curve(y_true, y_score)
        ap = average_precision_score(y_true, y_score)
        ax.plot(recall, precision, color=colors[name], lw=2,
                label=f"{name} (AP = {ap:.3f})")
    _decorate_pr(ax, prevalence)
    _save(fig, outpath)


def plot_single_threshold(y_true: np.ndarray, y_score: np.ndarray,
                          color: str, op_threshold: float, outpath: str) -> None:
    fig, ax = plt.subplots(figsize=PANEL_FIGSIZE)
    thresholds = np.arange(0.0, 1.001, 0.005)
    n_pos = int(y_true.sum())

    precisions, recalls, f1s = [], [], []
    for t in thresholds:
        called = y_score >= t
        tp = int((called & (y_true == 1)).sum())
        fp = int((called & (y_true == 0)).sum())
        prec = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        rec = tp / n_pos if n_pos > 0 else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        precisions.append(prec); recalls.append(rec); f1s.append(f1)

    ax.plot(thresholds, precisions, color=color, lw=2, label="Precision")
    ax.plot(thresholds, recalls,    color=color, lw=2, ls="--", label="Recall")
    ax.plot(thresholds, f1s,        color="gray", lw=1.5, ls=":", label="F1")
    ax.axvline(op_threshold, color="black", lw=1, alpha=0.5)

    op_called = y_score >= op_threshold
    op_tp = int((op_called & (y_true == 1)).sum())
    op_fp = int((op_called & (y_true == 0)).sum())
    op_prec = op_tp / (op_tp + op_fp) if (op_tp + op_fp) > 0 else 1.0
    op_rec = op_tp / n_pos if n_pos > 0 else 0.0
    ax.plot(op_threshold, op_prec, "s", color=color, ms=8, zorder=5)
    ax.plot(op_threshold, op_rec, "o", color=color, ms=8, zorder=5,
            fillstyle="none")

    ax.set_xlabel("Probability threshold")
    ax.set_ylabel("Score")
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.05)
    ax.legend(loc="lower left", frameon=False)
    ax.grid(True, alpha=0.3)
    _save(fig, outpath)


# ---------------------------------------------------------------------------
# Metal-type stratified ROC strip (figS1)
# ---------------------------------------------------------------------------
def load_metal_type_map() -> dict:
    """Return {(protein, residue_int): (metal, cofactor)} from met_metal_type_v2.tsv.

    Residue is stored as int to match br.parse_ground_truth's key type.
    """
    out = {}
    with open(METAL_TYPE_TSV) as f:
        f.readline()  # header
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 4:
                continue
            protein, residue, metal, cofactor = parts[0], int(parts[1]), parts[2], parts[3]
            out[(protein, residue)] = (metal.upper(), cofactor)
    return out


def stratified_yyhats(gt: dict, scores: dict, metal_map: dict,
                      met_predicate) -> tuple[np.ndarray, np.ndarray]:
    """Build (y_true, y_score) arrays for the Met-vs-rest task with Met
    positives restricted to those matching met_predicate(metal, cofactor).
    Unmatched Mets are skipped entirely (not counted as negatives)."""
    y_true, y_score = [], []
    for (protein, pos), label in gt.items():
        if (protein, pos) not in scores:
            continue
        if label == "Met":
            elem, cof = metal_map.get((protein, pos), ("", ""))
            if not met_predicate(elem, cof):
                continue
            y_true.append(1)
        else:
            y_true.append(0)
        y_score.append(scores[(protein, pos)])
    return np.array(y_true), np.array(y_score)


SHARED_METALS = {"ZN", "CA", "MG", "MN"}

# Metal-stratum predicates over (metal, cofactor) entries from
# met_metal_type_v2.tsv. The 'all' stratum matches every Met positive
# (including unmapped ones — see build_arrays in benchmark_roc).
METAL_STRATUM_PREDICATES = {
    "shared_metals":     (lambda m, c: m in SHARED_METALS),
    "iron_only":         (lambda m, c: m == "FE"),
    "iron_4fe4s":        (lambda m, c: m == "FE" and c == "SF4"),
    "iron_heme":         (lambda m, c: m == "FE" and c == "HEM"),
    "iron_2fe2s_3fe4s":  (lambda m, c: m == "FE" and c in {"F3S", "FES"}),
}


def plot_metal_stratification(raw_scores: dict, gt: dict, metal_map: dict,
                              outpath: str) -> None:
    fig, axes = plt.subplots(1, 2, figsize=STRIP_FIGSIZE, sharey=True)

    colors = {
        "ESM2 (held-out)": "#d62728",
        "LMetalSite":      "#2ca02c",
        "GPSite":          "#1f77b4",
    }

    for ax, (label, predicate) in zip(
        axes,
        [
            ("Shared metals (Zn / Ca / Mg / Mn)",
             METAL_STRATUM_PREDICATES["shared_metals"]),
            ("Iron only (Fe / Fe-S / heme)",
             METAL_STRATUM_PREDICATES["iron_only"]),
        ],
    ):
        for tool, scores in raw_scores.items():
            y_true, y_score = stratified_yyhats(gt, scores, metal_map, predicate)
            if y_true.sum() == 0:
                continue
            fpr, tpr, _ = roc_curve(y_true, y_score)
            auroc = auc(fpr, tpr)
            ax.plot(fpr, tpr, color=colors[tool], lw=2,
                    label=f"{tool} (AUROC = {auroc:.3f}, n+ = {int(y_true.sum())})")
        ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
        ax.set_title(label, fontsize=11)
        ax.set_xlabel("False positive rate")
        ax.set_xlim(-0.02, 1.02)
        ax.set_ylim(-0.02, 1.02)
        ax.legend(loc="lower right", frameon=False, fontsize=9)
    axes[0].set_ylabel("True positive rate")

    fig.suptitle("Metal-type stratified ROC (Met vs rest)", fontsize=12, y=1.02)
    _save(fig, outpath)


# ---------------------------------------------------------------------------
# Metrics JSON export
# ---------------------------------------------------------------------------
def _round_or_none(x) -> float | None:
    """Round to 4 dp; pass None through unchanged."""
    return None if x is None else round(float(x), 4)


def _metric_row(tool_web: str, task: str, stratum: str,
                y_true: np.ndarray, y_score: np.ndarray) -> dict:
    if y_true.size == 0 or y_true.sum() == 0:
        auroc, ap = None, None
    else:
        fpr, tpr, _ = roc_curve(y_true, y_score)
        auroc = auc(fpr, tpr)
        ap = average_precision_score(y_true, y_score)
    return {
        "tool": tool_web,
        "task": task,
        "stratum": stratum,
        "auroc": _round_or_none(auroc),
        "ap": _round_or_none(ap),
        "n_pos": int(y_true.sum()),
        "n_total": int(y_true.size),
    }


def write_metrics_json(disulfide_yyhats: dict, metal_yyhats: dict,
                       metal_raw_scores: dict, gt: dict,
                       metal_map: dict) -> None:
    import json
    rows: list[dict] = []

    # Disulfide — only the 'all' stratum (no metal-type stratification).
    for tool_internal, (y_t, y_s) in disulfide_yyhats.items():
        rows.append(_metric_row(WEB_TOOL_NAME[tool_internal],
                                "disulfide", "all", y_t, y_s))

    # Metal — 'all' stratum.
    for tool_internal, (y_t, y_s) in metal_yyhats.items():
        rows.append(_metric_row(WEB_TOOL_NAME[tool_internal],
                                "metal_binding", "all", y_t, y_s))

    # Metal — stratified by metal type / cofactor.
    for stratum, predicate in METAL_STRATUM_PREDICATES.items():
        for tool_internal, scores in metal_raw_scores.items():
            y_t, y_s = stratified_yyhats(gt, scores, metal_map, predicate)
            rows.append(_metric_row(WEB_TOOL_NAME[tool_internal],
                                    "metal_binding", stratum, y_t, y_s))

    payload = {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "source": "scripts/benchmark_web_panels.py over scripts/benchmark_roc.py",
        "evaluation_set": {
            "n_proteins_excluded": len(br.load_excluded_proteins(br.EMPTY_PDBS)
                                       | br.load_excluded_proteins(br.SEQ_MISMATCHES)),
            "n_cysteines": len(gt),
        },
        "metrics": rows,
    }

    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    with open(JSON_OUT, "w") as fh:
        json.dump(payload, fh, indent=2)
        fh.write("\n")
    print(f"  wrote {JSON_OUT} ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    os.makedirs(OUT_DIR, exist_ok=True)

    print("Loading exclusions...")
    excluded = br.load_excluded_proteins(br.EMPTY_PDBS)
    excluded |= br.load_excluded_proteins(br.SEQ_MISMATCHES)
    print(f"  {len(excluded)} excluded proteins")

    print("Parsing sequences and ground truth...")
    sequences = br.parse_fasta(br.SEQS_FASTA)
    gt_full = br.parse_ground_truth(br.BENCHMARK)
    gt = {k: v for k, v in gt_full.items() if k[0] not in excluded}
    print(f"  {len(gt)} cysteines in evaluation set")

    print("Parsing tool scores...")
    gpsite      = br.parse_gpsite(br.GPSITE_DIRS)
    lmetalsite  = br.parse_lmetalsite(br.LMETALSITE_DIRS, sequences)
    ssbond      = br.parse_ssbondpredict(br.SSBONDPRE_DIRS)
    esm2_metal, esm2_dis = br.parse_esm2(br.ESM2_PREDS)
    print(f"  GPSite={len(gpsite)} LMetalSite={len(lmetalsite)} "
          f"SSBOND={len(ssbond)} ESM2_metal={len(esm2_metal)} "
          f"ESM2_dis={len(esm2_dis)}")

    # SSBONDPredict only scores CYS-CYS pairs; cysteines outside any
    # predicted pair score 0 (matches benchmark_roc.py treatment).
    ssbond_full = {(p, r): ssbond.get((p, r), 0.0) for (p, r) in gt.keys()}

    # Build per-tool y/yhat arrays for the held-out evaluation.
    print("Building evaluation arrays...")
    metal_yyhats = {}
    for name, scores in (
        ("ESM2 (held-out)", esm2_metal),
        ("LMetalSite",      lmetalsite),
        ("GPSite",          gpsite),
    ):
        y_t, y_s, *_ = br.build_arrays(gt, scores, "Met", name)
        metal_yyhats[name] = (y_t, y_s)

    disulfide_yyhats = {}
    for name, scores in (
        ("ESM2 (held-out)", esm2_dis),
        ("SSBONDPredict",   ssbond_full),
    ):
        y_t, y_s, *_ = br.build_arrays(gt, scores, "Dis", name)
        disulfide_yyhats[name] = (y_t, y_s)

    # Single-panel exports — disulfide first (panels A, B, C) to match
    # the website's manuscript-aligned ordering.
    print("Rendering Fig 2 panels...")
    disulfide_colors = {
        "ESM2 (held-out)": "#d62728",
        "SSBONDPredict":   "#9467bd",
    }
    metal_colors = {
        "ESM2 (held-out)": "#d62728",
        "LMetalSite":      "#2ca02c",
        "GPSite":          "#1f77b4",
    }

    plot_single_roc(disulfide_yyhats, disulfide_colors,
                    os.path.join(OUT_DIR, "fig2a_disulfide_roc.png"))
    plot_single_pr(disulfide_yyhats, disulfide_colors,
                   os.path.join(OUT_DIR, "fig2b_disulfide_pr.png"))
    esm2_dis_yt, esm2_dis_ys = disulfide_yyhats["ESM2 (held-out)"]
    plot_single_threshold(esm2_dis_yt, esm2_dis_ys, "#2166ac",
                          OP_THRESHOLD_DISULFIDE,
                          os.path.join(OUT_DIR, "fig2c_disulfide_threshold.png"))

    plot_single_roc(metal_yyhats, metal_colors,
                    os.path.join(OUT_DIR, "fig2d_metal_roc.png"))
    plot_single_pr(metal_yyhats, metal_colors,
                   os.path.join(OUT_DIR, "fig2e_metal_pr.png"))
    esm2_met_yt, esm2_met_ys = metal_yyhats["ESM2 (held-out)"]
    plot_single_threshold(esm2_met_yt, esm2_met_ys, "#d62728",
                          OP_THRESHOLD_METAL,
                          os.path.join(OUT_DIR, "fig2f_metal_threshold.png"))

    # Metal-type stratified strip for Fig S1.
    print("Rendering Fig S1 stratified strip...")
    metal_map = load_metal_type_map()
    print(f"  {len(metal_map)} metal-type mappings")
    metal_raw_scores = {
        "ESM2 (held-out)": esm2_metal,
        "LMetalSite":      lmetalsite,
        "GPSite":          gpsite,
    }
    plot_metal_stratification(
        metal_raw_scores, gt, metal_map,
        os.path.join(OUT_DIR, "figS1_metal_stratification.png"),
    )

    # Persist all (tool, task, stratum) AUROC + AP values so the web
    # page reads them from the same source as the figures. Mirrors
    # src/lib/data/benchmark_metrics.json under the website repo if
    # JSON_OUT is unset.
    print("Writing benchmark_metrics.json...")
    write_metrics_json(disulfide_yyhats, metal_yyhats,
                       metal_raw_scores, gt, metal_map)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
