/**
 * Claude CLI 래퍼 — Claude Max 구독자용
 * API 크레딧 대신 CLI를 통해 Claude를 호출합니다.
 * 프롬프트를 임시 파일에 저장하고 shell로 파이핑하여 긴 프롬프트도 처리.
 */

import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { createReadStream } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

const CLAUDE_BIN = "/opt/homebrew/bin/claude";

interface ClaudeCliOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  timeout?: number; // ms
}

/**
 * Claude CLI로 프롬프트를 실행하고 텍스트 응답을 반환합니다.
 * 프롬프트를 임시 파일에 저장 후 stdin으로 파이핑합니다.
 */
export async function runClaude(options: ClaudeCliOptions): Promise<string> {
  const {
    prompt,
    model = "claude-sonnet-4-6",
    timeout = 300_000, // 5분
  } = options;

  const args = [
    "--print",
    "--dangerously-skip-permissions",
    "--model", model,
  ];

  if (options.maxTokens) {
    args.push("--max-tokens", String(options.maxTokens));
  }

  // 프롬프트를 임시 파일로 저장
  const tmpFile = join(tmpdir(), `claude-prompt-${randomBytes(8).toString("hex")}.txt`);
  await writeFile(tmpFile, prompt, "utf-8");

  const env = { ...process.env };
  // CLI가 Max 구독 인증을 사용하도록 (API 키 사용 방지)
  delete env.CLAUDECODE;
  delete env.ANTHROPIC_API_KEY;

  try {
    return await new Promise<string>((resolve, reject) => {
      const child = spawn(CLAUDE_BIN, args, {
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Claude CLI 타임아웃 (${timeout}ms)`));
      }, timeout);

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(new Error(`Claude CLI 실행 실패: ${err.message}`));
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const result = stdout.trim();
        if (code !== 0) {
          reject(
            new Error(
              `Claude CLI 종료 코드 ${code}. stdout: ${stdout.slice(0, 200)} stderr: ${stderr.slice(0, 500)}`
            )
          );
          return;
        }
        if (!result) {
          reject(
            new Error(
              `Claude CLI 응답이 비어있습니다. ${stderr.slice(0, 300)}`
            )
          );
          return;
        }
        resolve(result);
      });

      // 임시 파일에서 stdin으로 파이핑
      const fileStream = createReadStream(tmpFile);
      fileStream.pipe(child.stdin);
      fileStream.on("error", (err) => {
        child.kill("SIGTERM");
        clearTimeout(timer);
        reject(new Error(`파일 읽기 오류: ${err.message}`));
      });
    });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

/**
 * Claude CLI로 프롬프트를 실행하고 JSON으로 파싱해 반환합니다.
 */
export async function runClaudeJson<T = unknown>(options: ClaudeCliOptions): Promise<T> {
  const text = await runClaude(options);
  return extractJson<T>(text);
}

/**
 * 이미지를 임시 파일로 저장하고 경로를 반환합니다.
 * Claude CLI Vision용.
 */
export async function saveTempImage(base64: string): Promise<string> {
  const filePath = join(tmpdir(), `claude-img-${Date.now()}.jpg`);
  await writeFile(filePath, Buffer.from(base64, "base64"));
  return filePath;
}

/**
 * 임시 파일 삭제
 */
export async function removeTempFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // ignore
  }
}

/**
 * 텍스트에서 JSON 추출
 */
export function extractJson<T = unknown>(text: string): T {
  // ```json 블록 먼저 시도
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  const jsonText = jsonBlockMatch ? jsonBlockMatch[1].trim() : text;

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    // JSON 객체/배열 부분만 추출 시도
    const match = jsonText.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error("응답을 JSON으로 파싱할 수 없습니다.");
  }
}
