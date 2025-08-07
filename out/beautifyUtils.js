"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.beautifyCode = beautifyCode;
const prettier = __importStar(require("prettier"));
const child_process_1 = require("child_process");
const prettierLanguages = {
    javascript: "babel",
    typescript: "typescript",
    json: "json",
    html: "html",
    css: "css",
    markdown: "markdown"
};
async function beautifyCode(code, languageId) {
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
async function ensureBlackSupported() {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)("python3 --version", (err, stdout) => {
            if (err) {
                return reject(new Error("❌ Python not found. Please install Python 3.12.6+ and 'black'."));
            }
            const versionMatch = stdout.trim().match(/Python\s+(\d+\.\d+\.\d+)/);
            const version = versionMatch?.[1] ?? "";
            if (version.startsWith("3.12.5")) {
                return reject(new Error("❌ Python 3.12.5 has a known issue with 'black'. Please upgrade to 3.12.6 or downgrade to 3.12.4."));
            }
            (0, child_process_1.exec)("black --version", (err2) => {
                if (err2) {
                    return reject(new Error("❌ 'black' not installed. Run: pip install black"));
                }
                return resolve();
            });
        });
    });
}
async function formatWithBlack(code) {
    return new Promise((resolve, reject) => {
        const black = (0, child_process_1.spawn)("black", ["-", "--quiet"]);
        let formatted = "";
        let error = "";
        black.stdout.on("data", (data) => {
            formatted += data.toString();
        });
        black.stderr.on("data", (data) => {
            error += data.toString();
        });
        black.on("close", (code) => {
            if (code === 0) {
                resolve(formatted);
            }
            else {
                reject(new Error(`Black formatting failed:\n${error}`));
            }
        });
        black.stdin.write(code);
        black.stdin.end();
    });
}
