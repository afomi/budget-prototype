# Vacaville sample provenance

Publisher: City of Vacaville. Document: FY2526 Final Budget Document.
Table: Lighting & Landscaping Districts, Public Works Department, Functional Distribution.
Printed page 123; PDF page 175. Column: FY 2025/26 Proposed Budget.
The column label is preserved even though the file is named Final Budget Document.

| Item ID | Source row | Source dollars |
| --- | --- | ---: |
| alamo-creek-park | Alamo Creek Park | 246,279 |
| nelson-park | Nelson Park | 162,778 |
| patwin-park | Patwin Park | 150,575 |
| | Three-row subtotal | 559,632 |

This is an excerpt, not the full parks budget. These are maintenance-zone functional distributions, not capital projects.

The hypothetical request changes Patwin to $155,575 (+$5,000), for an excerpt total of $564,632. This change, justification, and review questions are fictional. No additional funding source has been assumed or verified.

The original PDF is in the local OpenSolano workspace as FY2526 Final Budget Document.pdf.

PDF SHA-256: d7ccd2d44978083860bd510f1188f428cf1a5760f479b14d8232400a6495ce75

    pdftotext -f 175 -l 175 -layout "FY2526 Final Budget Document.pdf" -

[Extracted public page](vacaville-fy2025-26-page-123.txt).
Cross-checks: OpenSolano scripts/out/parks_budget_zones.csv and scripts/parse_parks_budget.py; Parks Commission ORG_CHART.md, Annual budget section.

[City finance department](https://www.ci.vacaville.ca.us/government/finance). The supplied working copy was checked locally; the public originals are linked below.

Only the public budget excerpt is copied. Private commission notes are not included. Approved branch status describes prototype document review, not City budget adoption or endorsement.

## Public originals and related decision documents

- [FY2025–26 City budget book](https://www.cityofvacaville.gov/home/showpublisheddocument/25075/638858610347170000#page=175). The local working copy supplies the page excerpt below.
- [Page 123, a rendered facsimile from the supplied budget PDF](vacaville-budget-page-123.pdf) and [page image](vacaville-budget-page-123.png).
- [May 27, 2025 Council staff report and preliminary Engineer’s Report](https://vacaville.granicus.com/MetaViewer.php?clip_id=2021&meta_id=117456&view_id=6). PDF p.4 identifies District 1 / account 2101 / Patwin NP; the report’s Table 3 on PDF p.52 labels budget fund 2101. This is a preliminary assessment-report packet, not a signed approval of our fictional request.
- [June 24, 2025 budget-adoption staff report and recommended resolutions](https://vacaville.granicus.com/MetaViewer.php?clip_id=2027&meta_id=117995&view_id=6). Useful as a real example of a recommendation, fiscal-impact statement, and proposed decision language.

Public Works is the department; Lighting & Landscaping Districts is the budget unit; Patwin is a district-level functional distribution. The prototype’s grounds/irrigation/inspection components are proposed work-package detail, not official City account codes.

The single-page PDF is a compact rendered facsimile; use the City’s full budget book for the original searchable PDF.
