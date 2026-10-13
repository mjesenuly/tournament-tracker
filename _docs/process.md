# Development process

The reviewed article informs the PM → software engineer → QA loop. Video and example issue remained unavailable at initial discovery; no claim of exact verification is made.

1. PM reads discovery and product plan, grooms an issue with Goal, Acceptance criteria, Out of scope and Constraints. Orchestrator creates the real GitHub issue and records its actual URL.
2. Software engineer reads the issue and specification, implements only its scope, executes relevant tests, commits changes and reports files, commands, results and limitations.
3. Independent QA reads the acceptance criteria, inspects the implementation and executes relevant checks. QA reports PASS only if every criterion is supported by actual evidence; otherwise FAIL with reproduction instructions.
4. On FAIL, engineer fixes the reported defects and QA retests. Repeat until PASS, or record the blocker honestly.
5. Orchestrator links the verified commit and QA evidence to the actual issue and closes it after PASS. No other role closes issues. Missing configuration or untested acceptance criteria means the issue remains open.
6. Keep documentation consistent with final implementation. Check actual opening/closure timestamps against deadline 2026-10-13 09:20 UTC; never alter timestamps or invent completed work.

Local `_docs/issues/` documents are specifications, not evidence that GitHub issues exist. Every task initially has status Pending. Technical choices and limitations must be disclosed in README; a demo login is never evidence of working Google OAuth.
