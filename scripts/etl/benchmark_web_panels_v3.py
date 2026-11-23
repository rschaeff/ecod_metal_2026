#!/usr/bin/env python3
"""TriCyP v3 benchmark panels + benchmark_metrics.json for the website (2026-11-23).

Same figures and JSON layout as scripts/etl/benchmark_web_panels.py (the v2 / September version),
but on the v3 evaluation set reported in the manuscript: QC's v3 benchmark set (40,374 proteins)
minus the 892 with no AFDB structure matching the labelled sequence = 39,482 proteins / 151,438
cysteines. Labels, tool scores and the held-out TriCyP scores are assembled exactly as in
~/work/small_metal_binders_2026/revision/task_relabel/l2/bench_gap/bench_expanded.py (the source of
the manuscript's Fig 2 / S2 Fig / S2 Table numbers); plotting and JSON writing reuse the functions
of the September script, with the v3 operating thresholds (0.740 / 0.625).

Iron sub-strata need the cofactor of each metal cysteine, which the v3 label set does not carry:
it is taken from QC's v3 step6 contacts (nearest contact over the cysteine's PDB references, as in
task_relabel/l2/metal_noise/metal_noise_v3.py), het code SF4 / HEM / FES / F3S.

Runs on leda (needs the manuscript repo and its benchmark outputs):
    python3 scripts/etl/benchmark_web_panels_v3.py
"""
import os, re, sys, json, pickle, datetime
import numpy as np, pandas as pd

B = "/home/rschaeff/work/small_metal_binders_2026"; R = B + "/revision"; H = R + "/task_relabel"
G = H + "/l2/bench_gap/"
WEB = os.path.expanduser("~/dev/ecod_metal_2026")
sys.path.insert(0, B + "/scripts"); sys.path.insert(0, R + "/group1")
import benchmark_roc as br
import benchmark_web_panels as wp
import G_metal_noise as GM

wp.OUT_DIR = os.environ.get("OUT_DIR", WEB + "/public/figures")
wp.JSON_OUT = os.environ.get("JSON_OUT", WEB + "/src/lib/data/benchmark_metrics.json")
wp.OP_THRESHOLD_DISULFIDE = 0.740   # v3 F1 optimum on all held-out labelled cysteines
wp.OP_THRESHOLD_METAL = 0.625
T = "TriCyP (held-out)"             # internal / legend name; the website shows "TriCyP"
wp.WEB_TOOL_NAME = {T: "TriCyP", "LMetalSite": "LMetalSite", "GPSite": "GPSite", "SSBONDPredict": "SSBONDPredict"}
LAB = {"0": "Neg", "1": "Dis", "2": "Met"}

# ---- evaluation set and scores: as bench_expanded.py ----
rows = [l.rstrip("\n").split("\t") for l in open(H + "/data/rows_v3final.tsv")][1:]
gt_all = {(w[0], int(w[1])): LAB[w[2]] for w in rows}
elem = br.load_metal_type_map(H + "/data/met_elements_v3final.tsv")
qc_set = set(pd.read_csv(H + "/l2/calibration/benchmark_dataset", sep="\t").Protein)
st = pd.read_csv(G + "to_run_structures.tsv", sep="\t")
no_struct = set(st[(~st.qc_match) & (~st.v6_match)].protein)
expanded = qc_set - no_struct

gp, gph, lm, ss = pickle.load(open(H + "/benchmark/tool_scores.pkl", "rb"))
qs = br.parse_fasta(G + "qc_v3_benchmark_seqs.fa")
ngp, ngph = br.parse_gpsite_both([B + "/results/benchmark/gpsite_v3gap"])
nlm = br.parse_lmetalsite([B + "/results/benchmark/lmetalsite_v3gap"], qs)
nss = br.parse_ssbondpredict([B + "/results/benchmark/ssbondpre_v3gap"])
def merge(old, new):
    newp = {p for p, _ in new}
    out = {k: v for k, v in old.items() if k[0] not in newp}; out.update(new); return out
gp = merge(gp, ngp); lm = merge(lm, nlm)
ran_ss = {l.split("\t")[0] for f in os.listdir(B + "/data/benchmark/chunks_gpsite_v3gap") if f.endswith(".structures.tsv")
          for l in open(B + "/data/benchmark/chunks_gpsite_v3gap/" + f)}
ss = {k: v for k, v in ss.items() if k[0] not in ran_ss}; ss.update(nss)
tm, td = {}, {}
for l in list(open(R + "/regen_runs/v3_final/heldout.tsv"))[1:]:
    w = l.split("\t"); k = (w[0], int(w[1])); td[k] = float(w[4]); tm[k] = float(w[5])

gt = {k: v for k, v in gt_all.items() if k[0] in expanded}
nP = len({p for p, _ in gt})
print(f"evaluation set: {nP:,} proteins, {len(gt):,} cysteines")
assert (nP, len(gt)) == (39482, 151438), "not the manuscript's evaluation set"
ss_full = {k: ss.get(k, 0.0) for k in gt}

# ---- cofactor per metal cysteine from v3 step6 contacts ----
MN = H + "/l2/metal_noise/"
step6 = {}
for line in open(MN + "step6_result"):
    w = line.rstrip("\n").split("\t")
    if len(w) < 9: continue
    try: dist = float(w[3])
    except ValueError: continue
    k = (w[0], w[1])
    if k not in step6 or dist < step6[k][2]: step6[k] = (w[5], w[6], dist)
refs = {}
for line in open(MN + "step17A_result"):
    w = line.rstrip("\n").split("\t")
    if len(w) < 5 or w[3] != "2": continue
    refs.setdefault((w[1], int(w[2])), GM.parse_refs(w[4]))
metal_map = {}
for k, v in gt.items():
    if v != "Met": continue
    best = None
    for pdb, ch, rn in refs.get(k, []):
        hit = step6.get((f"{pdb}_{ch}", str(rn)))
        if hit and (best is None or hit[2] < best[2]): best = hit
    metal_map[k] = (elem.get(k, ""), best[1].upper() if best else "")
fe = [c for e, c in metal_map.values() if e == "FE"]
print("Fe cofactors:", pd.Series(fe).value_counts().to_dict())

# ---- arrays, figures, JSON (September functions) ----
metal_yyhats = {n: br.build_arrays(gt, s, "Met", n)[:2]
                for n, s in ((T, tm), ("LMetalSite", lm), ("GPSite", gp))}
disulfide_yyhats = {n: br.build_arrays(gt, s, "Dis", n)[:2]
                    for n, s in ((T, td), ("SSBONDPredict", ss_full))}
os.makedirs(wp.OUT_DIR, exist_ok=True)
dc = {T: "#d62728", "SSBONDPredict": "#9467bd"}
mc = {T: "#d62728", "LMetalSite": "#2ca02c", "GPSite": "#1f77b4"}
J = lambda f: os.path.join(wp.OUT_DIR, f)
wp.plot_single_roc(disulfide_yyhats, dc, J("fig2a_disulfide_roc.png"))
wp.plot_single_pr(disulfide_yyhats, dc, J("fig2b_disulfide_pr.png"))
wp.plot_single_threshold(*disulfide_yyhats[T], "#2166ac", wp.OP_THRESHOLD_DISULFIDE,
                         J("fig2c_disulfide_threshold.png"))
wp.plot_single_roc(metal_yyhats, mc, J("fig2d_metal_roc.png"))
wp.plot_single_pr(metal_yyhats, mc, J("fig2e_metal_pr.png"))
wp.plot_single_threshold(*metal_yyhats[T], "#d62728", wp.OP_THRESHOLD_METAL,
                         J("fig2f_metal_threshold.png"))
raw = {T: tm, "LMetalSite": lm, "GPSite": gp}

def plot_metal_stratification(raw_scores, outpath):
    """wp.plot_metal_stratification with the TriCyP legend name (its colours are keyed by name)."""
    import matplotlib.pyplot as plt
    from sklearn.metrics import roc_curve, auc
    fig, axes = plt.subplots(1, 2, figsize=wp.STRIP_FIGSIZE, sharey=True)
    for ax, (label, pred) in zip(axes, [("Shared metals (Zn / Ca / Mg / Mn)", wp.METAL_STRATUM_PREDICATES["shared_metals"]),
                                        ("Iron (Fe / Fe-S / heme)", wp.METAL_STRATUM_PREDICATES["iron_only"])]):
        for tool, scores in raw_scores.items():
            y, sc = wp.stratified_yyhats(gt, scores, metal_map, pred)
            if y.sum() == 0: continue
            fpr, tpr, _ = roc_curve(y, sc)
            ax.plot(fpr, tpr, color=mc[tool], lw=2, label=f"{tool} (AUROC = {auc(fpr, tpr):.3f}, n+ = {int(y.sum())})")
        ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
        ax.set_title(label, fontsize=11); ax.set_xlabel("False positive rate")
        ax.set_xlim(-0.02, 1.02); ax.set_ylim(-0.02, 1.02); ax.legend(loc="lower right", frameon=False, fontsize=9)
    axes[0].set_ylabel("True positive rate")
    fig.suptitle("Metal-type stratified ROC (Met vs rest)", fontsize=12, y=1.02)
    wp._save(fig, outpath)

plot_metal_stratification(raw, J("figS1_metal_stratification.png"))
wp.write_metrics_json(disulfide_yyhats, metal_yyhats, raw, gt, metal_map)

d = json.load(open(wp.JSON_OUT))
d["source"] = "scripts/etl/benchmark_web_panels_v3.py (TriCyP v3; bench_expanded.py evaluation set)"
d["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
d["evaluation_set"] = {"n_proteins": nP, "n_proteins_excluded": len(no_struct & qc_set), "n_cysteines": len(gt),
                       "description": "QC v3 benchmark set (40,374 proteins) minus 892 without a sequence-matched AFDB structure"}
json.dump(d, open(wp.JSON_OUT, "w"), indent=2); open(wp.JSON_OUT, "a").write("\n")
for m in d["metrics"]: print(m)
