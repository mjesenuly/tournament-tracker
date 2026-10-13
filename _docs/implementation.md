# Implementation traceability

| Task | Original local commit | Implemented scope |
|---|---|---|
| TT-01 | b0921e1, 89d70a2 | React/Express/SQLite foundation and startup |
| TT-02 | c881468 | Google ID token validation and secure sessions; live verification blocked |
| TT-03 | b120451 | Organizer metadata and public dashboard |
| TT-04 | bf8a046 | Private applications and atomic approval |
| TT-05 | 2d0212d | Round robin and scheduling |
| TT-06 | d7c6cd9 | Results, standings, goals; historical fix in TT-07 |
| TT-07 | 6e6848d | Second window replacements and kickoff membership snapshots |
| TT-08 | Recorded by orchestrator after commit | Regression, DOM interactions, readable formatting, CI and documentation |

Source files were uploaded through the GitHub UI because direct authenticated git publishing was not available. GitHub creates separate publication commit hashes; original local hashes above are development evidence, not claims those commits exist remotely. The orchestrator records actual remote links in issue handoffs. Independent QA and actual issue statuses determine completion. Live provider sign-in is still unverified, and no cloud deployment has been performed.
