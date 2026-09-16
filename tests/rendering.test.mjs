import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATED_INDEX_PATH,
  GENERATED_SUPPORT_PATH,
  renderGeneratedDocs,
  validateGeneratedDocContents,
} from "../scripts/lib/render.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const catalog = {
  challenges: [
    {
      id: "HC-001",
      title: "根拠を大切にするJavaチームメイトを育てよう",
      track: "Instructions",
      status: "published",
      page: "challenges/hc-001/README.md",
      feature: "Repository Instructions",
      sourceKind: "baseline",
      optionalRoutes: [],
      isolation: {
        tier: "repository",
        conditionStrategy: "separate-repository",
      },
      support: {
        primary: "Repository Instructions",
        fallback: "manual-equivalent",
      },
    },
    {
      id: "HC-002",
      title: "計画中Challenge",
      track: "Instructions",
      status: "planned",
    },
  ],
};

test("generated index and support matrix are deterministic and omit sourceLab metadata", () => {
  const first = renderGeneratedDocs(catalog);
  const second = renderGeneratedDocs(catalog);
  assert.deepEqual([...first], [...second]);
  assert.match(first.get(GENERATED_INDEX_PATH), /HC-001/u);
  assert.match(first.get(GENERATED_SUPPORT_PATH), /manual-equivalent/u);
  assert.doesNotMatch(first.get(GENERATED_INDEX_PATH), /LAB-/u);
});

test("stale generated document mutation fails for the intended reason", () => {
  const generated = renderGeneratedDocs(catalog);
  const mutated = new Map(generated);
  mutated.set(
    GENERATED_INDEX_PATH,
    generated.get(GENERATED_INDEX_PATH).replace("HC-001", "HC-999"),
  );

  assertErrorCode(
    validateGeneratedDocContents(catalog, mutated),
    "GENERATED_DOC_STALE",
  );
});
