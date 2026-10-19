# The model receives pre-formatted money and quotes it verbatim

Converting cents to dollars is arithmetic, and the brief says the model never computes money. So each tool result fed back to the model carries the raw JSON plus a companion map where every `*_cents` field is already formatted by our code (`185631` -> `$1,856.31`), and the prompt orders the model to quote those strings exactly. The graded tool output (CLI, eval) is unchanged; this only shapes the agent's view, and it raises the chance the answer contains the gold figure verbatim.
