# 07: Try it: call any tool from a form

**What to build:** in the Try it section, a visitor picks a tool, fills labelled inputs generated from the tool catalogue, presses Run and sees pretty-printed JSON (errors too). The form posts to `POST /api/tool`, which loads the committed ledger on the server and calls the same `runTool` as the CLI. Works with no environment variables. See grilling Q22, Q23.

**Blocked by:** 02, 03, 06

**Status:** resolved

- [x] Route handler tested by calling it with a `Request`: valid call, validation error, unknown tool, malformed body
- [x] The fixture CSV ships with the deployment (output file tracing includes)
- [x] Inputs are labelled and keyboard operable; the result region is announced (`aria-live`)
- [x] The category input offers the known categories; month and date inputs accept the documented formats
- [x] All labels exist in both locales
