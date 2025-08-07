import * as prettier from "prettier";
import { exec, spawn } from "child_process";

const prettierLanguages: Record<string, prettier.BuiltInParserName> = {
  javascript: "babel",
  typescript: "typescript",
  json: "json",
  html: "html",
  css: "css",
  markdown: "markdown"
};

export async function beautifyCode(code: string, languageId: string): Promise<string> {
  // Use Prettier for supported languages
  if (prettierLanguages[languageId]) {
    const parser = prettierLanguages[languageId];
    return await prettier.format(code, { parser });
  }

  // Use Black for Python
  if (languageId === "python") {
    await ensureBlackSupported(); // will throw if Python or black is missing/incompatible
    return await formatWithBlack(code);
  }

  // Fallback error
  throw new Error(`❌ Beautification not supported for '${languageId}' yet.`);
}

async function ensureBlackSupported(): Promise<void> {
  return new Promise((resolve, reject) => {
    exec("python3 --version", (err, stdout) => {
      if (err) {
        return reject(new Error("❌ Python not found. Please install Python 3.12.6+ and 'black'."));
      }

      const versionMatch = stdout.trim().match(/Python\s+(\d+\.\d+\.\d+)/);
      const version = versionMatch?.[1] ?? "";

      if (version.startsWith("3.12.5")) {
        return reject(new Error("❌ Python 3.12.5 has a known issue with 'black'. Please upgrade to 3.12.6 or downgrade to 3.12.4."));
      }

      exec("black --version", (err2) => {
        if (err2) {
          return reject(new Error("❌ 'black' not installed. Run: pip install black"));
        }

        return resolve();
      });
    });
  });
}

async function formatWithBlack(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const black = spawn("black", ["-", "--quiet"]);

    let formatted = "";
    let error = "";

    black.stdout.on("data", (data: Buffer) => {
      formatted += data.toString();
    });

    black.stderr.on("data", (data: Buffer) => {
      error += data.toString();
    });

    black.on("close", (code: number) => {
      if (code === 0) {
        resolve(formatted);
      } else {
        reject(new Error(`Black formatting failed:\n${error}`));
      }
    });

    black.stdin.write(code);
    black.stdin.end();
  });
}
