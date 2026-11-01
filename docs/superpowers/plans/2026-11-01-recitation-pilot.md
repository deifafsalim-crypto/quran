# Recitation pilot implementation plan

Goal: Collect a small, teacher-reviewed recitation evaluation before buying or deploying an analyzer.
Architecture: Separate static pilot page on the existing Pages site. Recordings and teacher annotations remain in IndexedDB; exports are explicit downloads. No speech transcript is treated as evidence of a diacritic error. No analyzer is configured because the user selected preparation first.
Tech stack: Browser MediaRecorder, IndexedDB, Web Crypto, plain JS, Node test runner.

- Create pilot.html and pilot.css for recording one selected ayah and reviewing individual words.
- Create pilot-core.js for strictly validated analyzer imports bound to recording SHA-256 and exact ayah text, confidence abstention and benchmark metrics.
- Create pilot.js for recording, local persistence, audio replay, annotation and export/import.
- Collect correct, vowel and shadda cases; all intended errors require teacher confirmation. Record at most 15 seconds per clip.
- Add entry link and publish assets via the existing Pages workflow.
- Run regression tests for reference binding, incomplete results, low confidence, false positives and missed errors. Browser recording and teacher validation remain human steps; do not claim accuracy until completed.
