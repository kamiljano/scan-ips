import { CheckerValidation, textDecoder } from "./checker";
import tryFetch from "../../utils/try-fetch";
import ini from "ini";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const getDotGitUrl = (url: string): string => {
  const dotGitUrlMatch = url.match(/^.*\/\.git/);
  if (!dotGitUrlMatch) {
    throw new Error("URL does not contain .git");
  }
  return dotGitUrlMatch[0];
};

const getGitRepo = async (url: string): Promise<string | undefined> => {
  try {
    const response = await tryFetch(`${getDotGitUrl(url)}/config`, {
      timeout: 10000,
    });
    const body = await response.text();
    return ini.parse(body)['remote "origin"'].url;
  } catch (err) {
    console.log("Git confing could not be fetched", err);
  }
  return undefined;
};

const isCloneable = async (gitUrl: string) => {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "git-checker"));
  return new Promise<boolean>((resolve) => {
    const clone = spawn("git", ["clone", gitUrl, tempDir]);
    clone.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const isDirectoryExposed = async (url: string): Promise<boolean> => {
  try {
    const response = await tryFetch(getDotGitUrl(url), { timeout: 10000 });
    const body = await response.text();
    return (
      body.includes("<html") &&
      body.includes(">HEAD<") &&
      body.includes(">index<")
    );
  } catch (err) {
    return false;
  }
};

export const git: CheckerValidation = async (ctx) => {
  if (ctx.body && ctx.body.length) {
    const body = textDecoder.decode(ctx.body);
    if (body.startsWith("ref:")) {
      const [directoryExposed, gitRepo] = await Promise.all([
        isDirectoryExposed(ctx.url),
        getGitRepo(ctx.url),
      ]);
      const meta: Record<string, string | boolean> = {
        url: ctx.url,
        directoryExposed,
      };

      if (gitRepo) {
        meta.gitRepo = gitRepo;
        meta.cloneable = await isCloneable(gitRepo);
      }

      return {
        success: true,
        meta,
      };
    }
  }

  return {
    success: false,
  };
};
