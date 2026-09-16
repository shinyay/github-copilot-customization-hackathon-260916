import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { listFilesRecursively, REPOSITORY_ROOT } from "./fs-utils.mjs";
import { parseMarkdownProse } from "./markdown.mjs";

function addError(errors, code, message) {
  errors.push({ code, message });
}

async function existsAsFileOrDirectoryReadme(targetPath) {
  try {
    const targetStat = await stat(targetPath);
    if (targetStat.isFile()) {
      return true;
    }
    if (targetStat.isDirectory()) {
      const readmeStat = await stat(path.join(targetPath, "README.md"));
      return readmeStat.isFile();
    }
  } catch {
    return false;
  }
  return false;
}

export async function validateMarkdownLinks() {
  const errors = [];
  let files;
  try {
    files = await listFilesRecursively(REPOSITORY_ROOT, {
      ignoredRootDirectories: ["node_modules", "dist", ".git"],
    });
  } catch (error) {
    addError(errors, "LINK_FILE_ENUMERATION", `Cannot safely enumerate link sources: ${error.message}`);
    return errors;
  }
  const markdownFiles = files.filter(
    (file) =>
      file.endsWith(".md") &&
      !file.startsWith("node_modules/") &&
      !file.startsWith("dist/"),
  );

  for (const relativeFile of markdownFiles) {
    const absoluteFile = path.join(
      REPOSITORY_ROOT,
      ...relativeFile.split("/"),
    );
    const contents = await readFile(absoluteFile, "utf8");
    let links;
    try {
      const prose = parseMarkdownProse(contents);
      links = [...prose.links, ...prose.images];
    } catch (error) {
      addError(
        errors,
        error.code === "MODULE_NOT_FOUND" ? "GUIDE_PARSER_UNAVAILABLE" : "MARKDOWN_PARSE",
        `Cannot parse ${relativeFile}: ${error.message}${error.code === "MODULE_NOT_FOUND" ? "; install authoring dependencies with npm ci" : ""}`,
      );
      return errors;
    }

    for (const link of links) {
      if (
        link === "" ||
        link.startsWith("#") ||
        /^[a-z][a-z0-9+.-]*:/iu.test(link)
      ) {
        continue;
      }

      const withoutFragment = link.split("#")[0].split("?")[0];
      const decoded = decodeURIComponent(withoutFragment);
      const target = path.resolve(path.dirname(absoluteFile), decoded);
      const relativeTarget = path.relative(REPOSITORY_ROOT, target);
      if (
        relativeTarget.startsWith("..") ||
        path.isAbsolute(relativeTarget) ||
        !(await existsAsFileOrDirectoryReadme(target))
      ) {
        addError(
          errors,
          "BROKEN_MARKDOWN_LINK",
          `${relativeFile} has broken local link: ${link}`,
        );
      }
    }
  }

  return errors;
}
