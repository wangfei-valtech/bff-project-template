/**
 * 用于校验 i18n 资源文件 key 结构一致性的检查脚本。
 *
 * 规则：
 * - 以 `src/i18n/resources` 下字典序第一个 JSON 文件为基准语言。
 * - 校验其它 JSON 文件是否缺失/多余同名 key，或对象结构（对象与非对象）层级不一致。
 * - 输出结构差异并以非 0 退出码结束，用于 npm 脚本的自动化校验。
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const resourcesDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/i18n/resources",
);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatKeyPath(parentPath, key) {
  return parentPath ? `${parentPath}.${key}` : key;
}

function compareStructures(reference, candidate, candidateFile, parentPath, errors) {
  const referenceKeys = Object.keys(reference);
  const candidateKeys = new Set(Object.keys(candidate));

  for (const key of referenceKeys) {
    const keyPath = formatKeyPath(parentPath, key);

    if (!candidateKeys.has(key)) {
      errors.push(`${candidateFile}: 缺少 key “${keyPath}”。`);
      continue;
    }

    const referenceValue = reference[key];
    const candidateValue = candidate[key];
    const referenceIsObject = isObject(referenceValue);
    const candidateIsObject = isObject(candidateValue);

    if (referenceIsObject !== candidateIsObject) {
      errors.push(`${candidateFile}: key “${keyPath}” 与基准资源的对象层级不一致。`);
      continue;
    }

    if (referenceIsObject) {
      compareStructures(referenceValue, candidateValue, candidateFile, keyPath, errors);
    }
  }

  for (const key of candidateKeys) {
    if (!Object.hasOwn(reference, key)) {
      errors.push(`${candidateFile}: 存在基准资源没有的 key “${formatKeyPath(parentPath, key)}”。`);
    }
  }
}

function readResource(fileName) {
  const content = readFileSync(resolve(resourcesDirectory, fileName), "utf8");
  const resource = JSON.parse(content);

  if (!isObject(resource)) {
    throw new Error(`${fileName}: 顶层必须是 JSON 对象。`);
  }

  return resource;
}

function main() {
  const resourceFiles = readdirSync(resourcesDirectory)
    .filter((fileName) => extname(fileName) === ".json")
    .sort();

  if (resourceFiles.length < 2) {
    throw new Error("至少需要两个语言资源 JSON 文件。\n");
  }

  const [referenceFile, ...candidateFiles] = resourceFiles;
  const reference = readResource(referenceFile);
  const errors = [];

  for (const candidateFile of candidateFiles) {
    compareStructures(reference, readResource(candidateFile), candidateFile, "", errors);
  }

  if (errors.length > 0) {
    throw new Error(
      `i18n resources key 结构不一致：\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  console.log(`i18n resources 检查通过：${resourceFiles.join(", ")}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
