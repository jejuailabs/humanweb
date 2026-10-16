// messages/{lang}.json에 키를 깊게 병합 (기존 값 유지, 새 키만 추가·덮어쓰기)
import { readFileSync, writeFileSync } from "node:fs";
const [lang, addFile] = process.argv.slice(2);
const path = `messages/${lang}.json`;
const base = JSON.parse(readFileSync(path, "utf8"));
const add = JSON.parse(readFileSync(addFile, "utf8"));
const merge = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = v && typeof v === "object" && !Array.isArray(v) ? merge(a[k] ?? {}, v) : v; return a; };
writeFileSync(path, JSON.stringify(merge(base, add), null, 2) + "\n");
console.log("merged", lang);
