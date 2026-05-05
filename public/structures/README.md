# Static structure assets

PyMOL sessions and matched PDB / AFDB structures cited from TriCyp pages.
Pages link directly to these files (no on-the-fly generation), so partial
deposition is fine — `FigureImage` and link-target fetches degrade gracefully
when an asset is missing.

## Fig 4 D / E / F examples (`/af-geometric`)

Each Fig 4 example shows an AFDB-monomer model vs the matched PDB experimental
structure. The PyMOL session contains both, aligned, with the disulfide-paired
cysteines highlighted.

| Filename | Purpose |
| --- | --- |
| `fig4d_example1.pse` | PyMOL session for Fig 4D (AFDB + PDB superposed) |
| `fig4d_example1_afdb.pdb` | AFDB-monomer model used in Fig 4D |
| `fig4d_example1_pdb.pdb` | Matched PDB experimental structure for Fig 4D |
| `fig4e_example2.pse` | PyMOL session for Fig 4E |
| `fig4e_example2_afdb.pdb` | AFDB-monomer model used in Fig 4E |
| `fig4e_example2_pdb.pdb` | Matched PDB experimental structure for Fig 4E |
| `fig4f_example3.pse` | PyMOL session for Fig 4F |
| `fig4f_example3_afdb.pdb` | AFDB-monomer model used in Fig 4F |
| `fig4f_example3_pdb.pdb` | Matched PDB experimental structure for Fig 4F |

## H-group detail examples (`/h-group/[id]` — step 6)

For each highlighted "novel cysteine-chemistry" H-group (3380.1, 804.1,
3991.1) the detail page expects PyMOL sessions of the PDB-source and
AFDB-source representatives with ESM2-predicted metal-binding cysteines
coloured magenta and sub-threshold cysteines grey.

| Filename | Purpose |
| --- | --- |
| `hgroup_3380_1_pdb.pse` | Fig 5C PDB representative session |
| `hgroup_3380_1_afdb.pse` | Fig 5C AFDB representative session |
| `hgroup_804_1_pdb.pse` | Fig 5D PDB representative session |
| `hgroup_804_1_afdb.pse` | Fig 5D AFDB representative session |
| `hgroup_3991_1_pdb.pse` | Fig 5E PDB representative session |
| `hgroup_3991_1_afdb.pse` | Fig 5E AFDB representative session |

## Notes

- `.pse` sessions should be saved from PyMOL with the cysteine-coloring scheme
  used in the paper (red disulfide, green metal, grey free thiol).
- `.pdb` files should retain author chain IDs and original residue numbering
  so the page links correlate cleanly with sequence-viewer position labels.
- File sizes >10 MB should be Zenodo-hosted instead, with this directory
  containing only a stub README pointing to the DOI; cite paper Methods
  §"Software and data availability".
