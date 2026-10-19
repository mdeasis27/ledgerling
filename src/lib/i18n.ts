import type { ToolName } from "./tools";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export type ArgName =
  | "from"
  | "to"
  | "category"
  | "merchant"
  | "min_cents"
  | "max_cents"
  | "limit"
  | "n"
  | "month"
  | "budget_cents";

export type Dict = {
  meta: { title: string; description: string };
  nav: { allProjects: string; language: string };
  hero: { oneLiner: string; chips: string[] };
  analogy: {
    title: string;
    body: string;
    glossaryTitle: string;
    terms: { term: string; def: string }[];
  };
  try: {
    title: string;
    intro: string;
    tracesTitle: string;
    pickQuestion: string;
    replay: string;
    stepLabel: string;
    resultLabel: string;
    answerLabel: string;
    placeholderBadge: string;
    recordedBy: string;
    noTraces: string;
    formTitle: string;
    toolLabel: string;
    run: string;
    running: string;
    outputLabel: string;
    optional: string;
    liveTitle: string;
    liveOff: string;
    askLabel: string;
    askButton: string;
    asking: string;
    liveBadge: string;
    rateLimited: string;
    liveFailed: string;
    backToDemo: string;
    tools: Record<ToolName, string>;
    fields: Record<ArgName, string>;
  };
  compare: {
    title: string;
    intro: string;
    exactnessLabel: string;
    exactnessNote: string;
    agentLabel: string;
    agentValue: string;
    monthsTitle: string;
    month: string;
    income: string;
    spend: string;
    net: string;
    refundsTitle: string;
    refundsBody: string;
    honestSpend: string;
    naiveSum: string;
  };
  fits: {
    title: string;
    worthTitle: string;
    worth: string[];
    notTitle: string;
    notNeeded: string[];
  };
  proves: { title: string; body: string };
  engineers: {
    summary: string;
    mechanismTitle: string;
    mechanism: string[];
    testsTitle: string;
    tests: string;
    stack: string;
    repoLabel: string;
  };
};

const en: Dict = {
  meta: {
    title: "Ledgerling",
    description: "Ask your bank statement questions. Tools do the math, the model only talks.",
  },
  nav: { allProjects: "← All projects", language: "Language" },
  hero: {
    oneLiner:
      "Ask your bank statement questions. Typed tools do the math, so the model never has to.",
    chips: ["Tool calling", "Integer cents", "Works without a key", "EN / ES"],
  },
  analogy: {
    title: "Think of a cashier with a calculator",
    body: "I ask a clerk how much I spent on food last month. A good clerk does not guess. They open the ledger, press the calculator, and read me the total. Ledgerling works the same way: the language model is the clerk who understands my question, and a small set of tools is the calculator and the ledger. The model can ask for a number, but it cannot make one up.",
    glossaryTitle: "Four words I use",
    terms: [
      { term: "Ledger", def: "The list of my transactions loaded from one statement file." },
      { term: "Tool", def: "A small function that reads the ledger and returns exact numbers." },
      { term: "Cents", def: "Money as whole numbers, so there is never a rounding error." },
      {
        term: "Trace",
        def: "A saved story of one question: the tool calls, their results and the answer.",
      },
    ],
  },
  try: {
    title: "Try it",
    intro:
      "Replay a saved question, or call any tool yourself and read the raw JSON. None of this needs a key.",
    tracesTitle: "Replay a question",
    pickQuestion: "Question to replay",
    replay: "Replay",
    stepLabel: "Tool call",
    resultLabel: "Result",
    answerLabel: "Answer",
    placeholderBadge: "Placeholder, not a real model run",
    recordedBy: "Recorded from a live run with",
    noTraces: "No saved questions could be loaded.",
    formTitle: "Call a tool",
    toolLabel: "Tool",
    run: "Run tool",
    running: "Running…",
    outputLabel: "JSON output",
    optional: "optional",
    liveTitle: "Ask your own question",
    liveOff:
      "Live questions are off here because no model key is set. The replay and the tool form above still work.",
    askLabel: "Your question",
    askButton: "Ask",
    asking: "Asking…",
    liveBadge: "Live answer from a model",
    rateLimited: "Too many questions from this address. Try again later or use the replay.",
    liveFailed: "The model could not answer right now. You can use the replay instead.",
    backToDemo: "Back to the saved questions",
    tools: {
      sum_by_category: "Spend per category",
      list_transactions: "List transactions",
      top_merchants: "Top merchants",
      monthly_summary: "Monthly summary",
      budget_status: "Budget status",
    },
    fields: {
      from: "From (YYYY-MM-DD)",
      to: "To (YYYY-MM-DD)",
      category: "Category",
      merchant: "Merchant contains",
      min_cents: "Minimum amount (cents)",
      max_cents: "Maximum amount (cents)",
      limit: "Limit",
      n: "How many",
      month: "Month (YYYY-MM)",
      budget_cents: "Budget (cents)",
    },
  },
  compare: {
    title: "Compare",
    intro: "These numbers are computed by the product when this page is built, not typed in.",
    exactnessLabel: "Tool exactness on the sample cases",
    exactnessNote: "cases match exactly",
    agentLabel: "Agent exactness",
    agentValue: "87 / 100 (13 of 15, live)",
    monthsTitle: "Income, spend and net by month",
    month: "Month",
    income: "Income",
    spend: "Spend",
    net: "Net",
    refundsTitle: "Why refunds never reduce spend",
    refundsBody:
      "Spend only counts money going out. If a refund were subtracted, a month with a return would look cheaper than what I really paid.",
    honestSpend: "Spend over all months",
    naiveSum: "Same data if refunds were subtracted",
  },
  fits: {
    title: "Where it fits",
    worthTitle: "Worth it when",
    worth: [
      "I want plain answers about my own transactions and I need to trust every figure.",
      "I want an assistant that can show exactly which calls produced its answer.",
    ],
    notTitle: "Not needed when",
    notNeeded: [
      "A spreadsheet pivot table already answers my question.",
      "I only need a fixed monthly report with no questions.",
    ],
  },
  proves: {
    title: "What it proves",
    body: "I can give a language model a narrow set of exact tools and keep it honest. I wrote the tools so they are deterministic and tested, I kept money in integer cents, and I made the demo work with no key at all. I also refuse to show invented model output as real: a placeholder says so on its face.",
  },
  engineers: {
    summary: "For engineers",
    mechanismTitle: "Mechanism",
    mechanism: [
      "Five tools over a parsed CSV ledger. Spend sums absolute negative amounts, income sums every positive amount, ranges are inclusive, and bad input returns an error object.",
      "The agent speaks a JSON text protocol on top of a text-only chat call: the model replies with calls or an answer, I run the tools and loop, at most 6 rounds.",
      "Each tool result goes back with pre-formatted money, and the model must quote it, so it never converts or adds.",
      "Demo mode replays saved traces and a tool form. Live mode turns on when a model key is set.",
    ],
    testsTitle: "How it is tested",
    tests:
      "Tests run on bun test: every tool rule on small inline ledgers, the sample cases at 100 percent, the agent loop with a scripted fake model, the command line scripts as subprocesses, and a check that every saved trace still matches the tools.",
    stack: "Stack: Bun, Next.js App Router, TypeScript strict, Biome",
    repoLabel: "Source code",
  },
};

const es: Dict = {
  meta: {
    title: "Ledgerling",
    description:
      "Hago preguntas a mi estado de cuenta. Las herramientas calculan, el modelo solo conversa.",
  },
  nav: { allProjects: "← Todos los proyectos", language: "Idioma" },
  hero: {
    oneLiner:
      "Hago preguntas a mi estado de cuenta. Herramientas tipadas hacen las cuentas, así el modelo no tiene que hacerlas.",
    chips: ["Llamadas a herramientas", "Centavos enteros", "Funciona sin clave", "EN / ES"],
  },
  analogy: {
    title: "Piensa en un cajero con calculadora",
    body: "Le pregunto a un empleado cuánto gasté en comida el mes pasado. Un buen empleado no adivina. Abre el libro, usa la calculadora y me lee el total. Ledgerling funciona igual: el modelo de lenguaje es el empleado que entiende mi pregunta, y un conjunto pequeño de herramientas es la calculadora y el libro. El modelo puede pedir un número, pero no puede inventarlo.",
    glossaryTitle: "Cuatro palabras que uso",
    terms: [
      {
        term: "Libro",
        def: "La lista de mis transacciones cargada desde un archivo de estado de cuenta.",
      },
      {
        term: "Herramienta",
        def: "Una función pequeña que lee el libro y devuelve números exactos.",
      },
      { term: "Centavos", def: "El dinero como números enteros, así nunca hay error de redondeo." },
      {
        term: "Traza",
        def: "La historia guardada de una pregunta: las llamadas, sus resultados y la respuesta.",
      },
    ],
  },
  try: {
    title: "Pruébalo",
    intro:
      "Repite una pregunta guardada, o llama tú mismo a cualquier herramienta y lee el JSON crudo. Nada de esto necesita una clave.",
    tracesTitle: "Repetir una pregunta",
    pickQuestion: "Pregunta a repetir",
    replay: "Repetir",
    stepLabel: "Llamada a herramienta",
    resultLabel: "Resultado",
    answerLabel: "Respuesta",
    placeholderBadge: "Marcador de posición, no es una ejecución real del modelo",
    recordedBy: "Grabado de una ejecución real con",
    noTraces: "No se pudieron cargar preguntas guardadas.",
    formTitle: "Llamar a una herramienta",
    toolLabel: "Herramienta",
    run: "Ejecutar herramienta",
    running: "Ejecutando…",
    outputLabel: "Salida JSON",
    optional: "opcional",
    liveTitle: "Haz tu propia pregunta",
    liveOff:
      "Las preguntas en vivo están apagadas porque no hay clave de modelo. La repetición y el formulario de arriba siguen funcionando.",
    askLabel: "Tu pregunta",
    askButton: "Preguntar",
    asking: "Preguntando…",
    liveBadge: "Respuesta en vivo de un modelo",
    rateLimited:
      "Demasiadas preguntas desde esta dirección. Inténtalo más tarde o usa la repetición.",
    liveFailed: "El modelo no pudo responder ahora. Puedes usar la repetición.",
    backToDemo: "Volver a las preguntas guardadas",
    tools: {
      sum_by_category: "Gasto por categoría",
      list_transactions: "Listar transacciones",
      top_merchants: "Comercios principales",
      monthly_summary: "Resumen mensual",
      budget_status: "Estado del presupuesto",
    },
    fields: {
      from: "Desde (AAAA-MM-DD)",
      to: "Hasta (AAAA-MM-DD)",
      category: "Categoría",
      merchant: "El comercio contiene",
      min_cents: "Monto mínimo (centavos)",
      max_cents: "Monto máximo (centavos)",
      limit: "Límite",
      n: "Cuántos",
      month: "Mes (AAAA-MM)",
      budget_cents: "Presupuesto (centavos)",
    },
  },
  compare: {
    title: "Comparar",
    intro:
      "Estos números los calcula el producto al construir esta página, no están escritos a mano.",
    exactnessLabel: "Exactitud de herramientas en los casos de muestra",
    exactnessNote: "casos coinciden exactamente",
    agentLabel: "Exactitud del agente",
    agentValue: "87 / 100 (13 de 15, en vivo)",
    monthsTitle: "Ingresos, gasto y neto por mes",
    month: "Mes",
    income: "Ingresos",
    spend: "Gasto",
    net: "Neto",
    refundsTitle: "Por qué los reembolsos no reducen el gasto",
    refundsBody:
      "El gasto solo cuenta el dinero que sale. Si se restara un reembolso, un mes con una devolución parecería más barato de lo que realmente pagué.",
    honestSpend: "Gasto en todos los meses",
    naiveSum: "Los mismos datos si se restaran los reembolsos",
  },
  fits: {
    title: "Dónde encaja",
    worthTitle: "Vale la pena cuando",
    worth: [
      "Quiero respuestas simples sobre mis propias transacciones y necesito confiar en cada cifra.",
      "Quiero un asistente que muestre exactamente qué llamadas produjeron su respuesta.",
    ],
    notTitle: "No hace falta cuando",
    notNeeded: [
      "Una tabla dinámica ya responde mi pregunta.",
      "Solo necesito un informe mensual fijo y sin preguntas.",
    ],
  },
  proves: {
    title: "Qué demuestra",
    body: "Puedo darle a un modelo de lenguaje un conjunto estrecho de herramientas exactas y mantenerlo honesto. Escribí las herramientas para que sean deterministas y estén probadas, guardé el dinero en centavos enteros y logré que la demo funcione sin ninguna clave. Tampoco muestro salida inventada de un modelo como si fuera real: un marcador de posición lo dice a simple vista.",
  },
  engineers: {
    summary: "Para ingenieros",
    mechanismTitle: "Mecanismo",
    mechanism: [
      "Cinco herramientas sobre un libro leído de un CSV. El gasto suma los montos negativos en valor absoluto, el ingreso suma todo monto positivo, los rangos son inclusivos y la entrada inválida devuelve un objeto de error.",
      "El agente habla un protocolo de texto JSON sobre una llamada de chat que solo devuelve texto: el modelo responde con llamadas o una respuesta, yo ejecuto las herramientas y repito, como máximo 6 rondas.",
      "Cada resultado vuelve con el dinero ya formateado y el modelo debe citarlo, así nunca convierte ni suma.",
      "El modo demo repite trazas guardadas y ofrece un formulario de herramientas. El modo en vivo se activa cuando hay una clave de modelo.",
    ],
    testsTitle: "Cómo se prueba",
    tests:
      "Las pruebas corren con bun test: cada regla de las herramientas en libros pequeños, los casos de muestra al 100 por ciento, el bucle del agente con un modelo falso guionado, los scripts de línea de comandos como subprocesos, y una verificación de que cada traza guardada sigue coincidiendo con las herramientas.",
    stack: "Stack: Bun, Next.js App Router, TypeScript strict, Biome",
    repoLabel: "Código fuente",
  },
};

export const dictionaries: Record<Locale, Dict> = { en, es };
