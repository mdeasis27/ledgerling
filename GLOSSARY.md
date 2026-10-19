# Ledgerling

A person asks plain-language questions about their own bank transactions and gets answers whose every figure came from a tool, never from the model's arithmetic.

## Ledger

**Ledger**:
The full set of transactions loaded from one statement file, in file order.
_Avoid_: Dataset, statement data

**Transaction**:
One row of the ledger: a date, a description, a signed amount in cents, a category and an account.
_Avoid_: Entry, record, line item

**Description**:
The free-text label on a transaction as the bank wrote it; the identity of a merchant for grouping purposes.
_Avoid_: Payee, name

**Merchant**:
A transaction description treated as who the money went to. Grouping is by exact description; searching is case-insensitive.
_Avoid_: Vendor, store

**Category**:
One label from the known category list that classifies a transaction.
_Avoid_: Tag, type

**Account**:
The bank account a transaction belongs to (for example checking or credit).

## Money

**Cents**:
The only unit for money: a whole number, negative for money out, positive for money in.
_Avoid_: Dollars, amount (without unit)

**Spend**:
The sum of the absolute values of money-out amounts. Money in never reduces spend.
_Avoid_: Expenses, outflow, net spend

**Income**:
The sum of every money-in amount, whatever its category (refunds included).
_Avoid_: Earnings, inflow, revenue

**Net**:
Income minus spend for a period.
_Avoid_: Balance, savings

**Refund**:
A money-in transaction outside the income category. Counts as income, never nets against spend.

**Budget**:
A spend ceiling in cents for one category in one month; over means spend strictly above it.
_Avoid_: Limit, allowance

## Agent

**Tool**:
A named, typed function over the ledger that does all the math and returns JSON.
_Avoid_: Function, action, command

**Tool call**:
One request to run a tool with a JSON object of arguments.

**Round**:
One model reply that requests one or more tool calls; a question allows at most six.
_Avoid_: Turn, step, iteration

**Trace**:
The recorded story of one question: the question, its tool calls with their results, and the final answer.
_Avoid_: Log, transcript, session

**Placeholder trace**:
A trace marked as not coming from a real model run, shown with a visible label.

**Demo mode**:
The app with no LLM key: trace replay plus direct tool calls on the committed ledger.

**Live mode**:
The app with an LLM key set: real questions answered by a model through tools.

**Tool exactness**:
The share of tool cases whose output deep-equals the expected output.

**Agent exactness**:
The share of questions whose answer contains the gold figure.
