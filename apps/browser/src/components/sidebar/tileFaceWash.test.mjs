import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
const ts = createRequire(import.meta.url)("typescript");

const text = readFileSync(new URL("./TileFace.tsx", import.meta.url), "utf8");
const file = ts.createSourceFile("TileFace.tsx", text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);

function all(node, keep, out = []) {
  if (keep(node)) out.push(node);
  ts.forEachChild(node, (child) => void all(child, keep, out));
  return out;
}

const declared = (name) => all(file, (n) => ts.isFunctionDeclaration(n) && n.name?.getText(file) === name)[0];
const calls = (node, name) => all(node, (n) => ts.isCallExpression(n) && n.expression.getText(file) === name);

test("a glass tile shows hover, press and selection with the same wash as a classic tile", () => {
  assert.equal(calls(declared("RestingTile"), "tileWash").length, 1, "the classic tile no longer takes its fill from tileWash");
  assert.equal(calls(declared("GlassTile"), "tileWash").length, 1, "the glass tile shows hover only through its tint, which moves 1.5 points of alpha between rest and lit");
});

test("the glass tile's wash is the first view in its glass and always mounted, so a glass group never adds it over the icon", () => {
  const glass = all(declared("GlassTile"), (n) => ts.isJsxElement(n) && n.openingElement.tagName.getText(file) === "GlassFill")[0];
  const [first] = glass.children.filter((c) => !(ts.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces));
  assert.ok(ts.isJsxSelfClosingElement(first) && first.tagName.getText(file) === "View", `GlassFill starts with ${first.getText(file).slice(0, 60)}, not a View that is always there`);
  assert.match(first.getText(file), /backgroundColor: wash/);
});
