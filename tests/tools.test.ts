import { describe, expect, test } from "bun:test";
import path from "node:path";
import { matches, readCases, scoreCases } from "../src/lib/eval";
import type { Ledger } from "../src/lib/ledger";
import { loadLedger } from "../src/lib/ledger";
import { DEFAULT_CSV, FIXTURES_DIR, loadLedgerFile, readCategories } from "../src/lib/ledger-files";
import { formatCents, formatMoneyFields } from "../src/lib/money";
import { runTool } from "../src/lib/tools";

const CATS = ["groceries", "dining", "income", "shopping"];

function ledgerOf(csv: string): Ledger {
  const l = loadLedger(csv, CATS);
  if ("error" in l) throw new Error(l.error);
  return l;
}

const HEAD = "date,description,amount_cents,category,account\n";
const L = ledgerOf(
  `${HEAD}2026-01-05,"Grocer, Co.",-1000,groceries,checking
2026-01-05,Cafe,-500,dining,credit
2026-01-05,cafe,-500,dining,credit
2026-01-06,Refund,300,groceries,checking
2026-01-31,Pay,5000,income,checking
2026-02-01,Cafe,-250,dining,credit
`,
);

describe("loader", () => {
  test("quoted fields, CRLF and BOM", () => {
    const l = ledgerOf(`﻿${HEAD.replace(/\n/g, "\r\n")}2026-01-01,"A ""b"", c",-1,dining,x\r\n`);
    expect(l.transactions[0]?.description).toBe('A "b", c');
  });
  test("malformed rows are errors", () => {
    expect(loadLedger(`${HEAD}2026-13-01,x,-1,dining,a\n`, CATS)).toHaveProperty("error");
    expect(loadLedger(`${HEAD}2026-01-01,x,1.5,dining,a\n`, CATS)).toHaveProperty("error");
    expect(loadLedger("a,b\n1,2\n", CATS)).toHaveProperty("error");
  });
  test("categories seen in data are accepted", () => {
    const l = ledgerOf(`${HEAD}2026-01-01,x,-1,pets,a\n`);
    expect(
      runTool("sum_by_category", { from: "2026-01-01", to: "2026-01-01", category: "pets" }, l),
    ).toEqual({
      category: "pets",
      spend_cents: 1,
    });
  });
});

describe("sum_by_category", () => {
  const r = (args: unknown) => runTool("sum_by_category", args, L);
  test("ignores refunds and income, quoted merchant", () => {
    expect(r({ from: "2026-01-01", to: "2026-01-31" })).toEqual({
      by_category: { groceries: 1000, dining: 1000 },
    });
  });
  test("known category without spend is 0", () => {
    expect(r({ from: "2026-01-01", to: "2026-01-31", category: "income" })).toEqual({
      category: "income",
      spend_cents: 0,
    });
  });
  test("inclusive range", () => {
    expect(r({ from: "2026-02-01", to: "2026-02-01" })).toEqual({ by_category: { dining: 250 } });
  });
  test("errors", () => {
    for (const bad of [
      { from: "2026-02-30", to: "2026-03-01" },
      { from: "2026-03-01", to: "2026-02-01" },
      { from: "2026-01-01", to: "2026-01-02", category: "pets" },
      { from: "2026-01-01" },
      "nope",
      null,
    ]) {
      expect(r(bad)).toHaveProperty("error");
    }
  });
  test("null optional treated as absent", () => {
    expect(r({ from: "2026-02-01", to: "2026-02-01", category: null, extra: 1 })).toHaveProperty(
      "by_category",
    );
  });
});

describe("list_transactions", () => {
  const r = (args: unknown) => runTool("list_transactions", args, L);
  const descs = (x: unknown) =>
    (x as { transactions: { description: string }[] }).transactions.map((t) => t.description);
  test("newest first, ties in CSV order", () => {
    expect(descs(r({ from: "2026-01-01", to: "2026-01-31" }))).toEqual([
      "Pay",
      "Refund",
      "Grocer, Co.",
      "Cafe",
      "cafe",
    ]);
  });
  test("merchant is case-insensitive, limit after sort", () => {
    expect(descs(r({ from: "2026-01-01", to: "2026-02-28", merchant: "CAFE", limit: 2 }))).toEqual([
      "Cafe",
      "Cafe",
    ]);
    expect(descs(r({ from: "2026-01-01", to: "2026-02-28", limit: 0 }))).toEqual([]);
  });
  test("min/max use absolute amount", () => {
    expect(
      descs(r({ from: "2026-01-01", to: "2026-01-31", min_cents: 600, max_cents: 1000 })),
    ).toEqual(["Grocer, Co."]);
    expect(descs(r({ from: "2026-01-01", to: "2026-01-31", min_cents: 9, max_cents: 1 }))).toEqual(
      [],
    );
  });
  test("bad integers", () => {
    for (const bad of [{ min_cents: 1.5 }, { max_cents: -1 }, { limit: "3" }, { limit: -1 }]) {
      expect(r({ from: "2026-01-01", to: "2026-01-31", ...bad })).toHaveProperty("error");
    }
  });
});

describe("top_merchants", () => {
  test("groups by exact description, ties by code unit", () => {
    expect(runTool("top_merchants", { from: "2026-01-01", to: "2026-02-28", n: 10 }, L)).toEqual({
      merchants: [
        { description: "Grocer, Co.", spend_cents: 1000 },
        { description: "Cafe", spend_cents: 750 },
        { description: "cafe", spend_cents: 500 },
      ],
    });
  });
  test("n below 1 is an error", () => {
    expect(
      runTool("top_merchants", { from: "2026-01-01", to: "2026-02-28", n: 0 }, L),
    ).toHaveProperty("error");
  });
});

describe("monthly_summary and budget_status", () => {
  test("income counts every positive amount", () => {
    expect(runTool("monthly_summary", { month: "2026-01" }, L)).toEqual({
      month: "2026-01",
      income_cents: 5300,
      spend_cents: 2000,
      net_cents: 3300,
    });
  });
  test("empty month and bad month", () => {
    expect(runTool("monthly_summary", { month: "2030-01" }, L)).toEqual({
      month: "2030-01",
      income_cents: 0,
      spend_cents: 0,
      net_cents: 0,
    });
    expect(runTool("monthly_summary", { month: "2026-13" }, L)).toHaveProperty("error");
  });
  test("over only when strictly greater", () => {
    const b = (budget_cents: number) =>
      runTool("budget_status", { category: "groceries", month: "2026-01", budget_cents }, L);
    expect(b(1000)).toMatchObject({ remaining_cents: 0, over: false });
    expect(b(999)).toMatchObject({ remaining_cents: -1, over: true });
    expect(
      runTool("budget_status", { category: "x", month: "2026-01", budget_cents: 1 }, L),
    ).toHaveProperty("error");
    expect(
      runTool("budget_status", { category: "dining", month: "2026-01", budget_cents: -1 }, L),
    ).toHaveProperty("error");
  });
  test("unknown tool", () => {
    expect(runTool("nope", {}, L)).toHaveProperty("error");
  });
});

describe("eval scorer and fixtures", () => {
  test("visible tool cases score 100", () => {
    const ledger = loadLedgerFile(DEFAULT_CSV);
    if ("error" in ledger) throw new Error(ledger.error);
    const res = scoreCases(readCases(path.join(FIXTURES_DIR, "tool-cases.json")), ledger);
    expect(res.failures).toEqual([]);
    expect(res.score).toBe(100);
  });
  test("February income includes refunds", () => {
    const ledger = loadLedgerFile(DEFAULT_CSV);
    if ("error" in ledger) throw new Error(ledger.error);
    expect(runTool("monthly_summary", { month: "2026-02" }, ledger)).toMatchObject({
      income_cents: 629949,
    });
  });
  test("categories file is readable", () => {
    expect(readCategories()).toContain("groceries");
  });
  test("wildcard and equality", () => {
    expect(matches({ error: "x" }, { error: "*" })).toBe(true);
    expect(matches({ error: "x", a: 1 }, { error: "*" })).toBe(false);
    expect(matches({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(matches([1, 2], [2, 1])).toBe(false);
    expect(matches({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe("money", () => {
  test("formats cents in both locales", () => {
    expect(formatCents(185631)).toBe("$1,856.31");
    expect(formatCents(-5)).toBe("-$0.05");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123456789, "es")).toBe("1.234.567,89 US$");
  });
  test("collects money fields", () => {
    expect(formatMoneyFields({ by_category: { rent: 185000 }, over: true })).toEqual({
      "by_category.rent": "$1,850.00",
    });
    expect(formatMoneyFields({ merchants: [{ description: "A", spend_cents: 100 }] })).toEqual({
      "merchants[0].spend_cents": "$1.00",
    });
  });
});
