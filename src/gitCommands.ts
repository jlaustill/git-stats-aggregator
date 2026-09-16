import { execFileSync } from "child_process";
import type IDateRange from "./types/IDateRange";
import type IUserStats from "./types/IUserStats";

/** Record separator emitted before each commit's author name. */
const AUTHOR_MARKER = "\u0001";

/**
 * Git ref names that are safe to interpolate into a command.
 *
 * git is invoked without a shell, so metacharacters are already inert. What an
 * argv array does NOT prevent is a ref beginning with "-", which git reads as a
 * flag rather than a branch — a typo that would quietly measure the wrong thing
 * instead of failing. That is what this rejects.
 */
const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export function assertSafeRef(ref: string): string {
    if (!SAFE_REF.test(ref) || ref.includes("..")) {
        throw new Error(
            `Refusing to use "${ref}" as a git ref. Expected letters, digits and . _ / - , ` +
            `not starting with "-", containing no "..".`
        );
    }
    return ref;
}

/**
 * Run git in the specified repository.
 *
 * Arguments are passed as an argv array rather than a command string, so no
 * shell is involved at all. That removes the quoting hazard around branch names
 * and pathspecs, and means the tool behaves identically whether the caller's
 * shell is bash, zsh, or something else — nothing here depends on one.
 */
export function git(repoPath: string, args: string[]): string {
    try {
        return execFileSync("git", args, {
            cwd: repoPath,
            encoding: "utf-8",
            maxBuffer: 256 * 1024 * 1024,
            stdio: ["inherit", "pipe", "inherit"]
        });
    } catch (error) {
        throw new Error(`git ${args.join(" ")} failed: ${(error as Error).message}`);
    }
}

/**
 * Turn configured exclude patterns into real git pathspecs.
 *
 * `git log --exclude=<glob>` filters REFS, not paths, so the previous use of it
 * silently did nothing and vendored dependencies and lock files were counted in
 * every total. Path exclusion has to be a pathspec after `--`, and needs the
 * `glob` magic word for `**` to mean what people expect.
 */
function buildPathspec(excludePatterns: string[]): string[] {
    if (excludePatterns.length === 0) {
        return [];
    }
    return ["--", ".", ...excludePatterns.map(pattern => `:(exclude,glob)${pattern}`)];
}

/**
 * Collect per-author stats for a repository in a single pass.
 *
 * Previously this ran `git log --author="<name>"` once per contributor. That is a
 * REGEX matched against "Name <email>", so any name that is a prefix of another
 * matched both — `--author="Sam"` returns Sam AND Sam Taylor — and the
 * overlapping commits were counted twice once the identities were merged.
 * Reading every commit once and grouping on the exact author name removes the
 * ambiguity, and costs one git invocation per repository rather than two per
 * contributor.
 */
function collectRepoStats(
    repoPath: string,
    ref: string,
    dateRange: IDateRange,
    excludePatterns: string[]
): IUserStats[] {
    const output = git(repoPath, [
        "log",
        assertSafeRef(ref),
        "--no-merges",
        "--numstat",
        `--format=${AUTHOR_MARKER}%aN`,
        `--since=${dateRange.since}`,
        `--before=${dateRange.until}`,
        ...buildPathspec(excludePatterns)
    ]);
    if (!output) {
        return [];
    }

    const byAuthor = new Map<string, IUserStats>();
    let current: IUserStats | null = null;

    for (const line of output.split("\n")) {
        if (line.startsWith(AUTHOR_MARKER)) {
            const userName = line.slice(AUTHOR_MARKER.length).trim();
            if (!userName) {
                current = null;
                continue;
            }
            let entry = byAuthor.get(userName);
            if (!entry) {
                entry = {
                    userName,
                    filesChanged: 0,
                    linesAdded: 0,
                    linesDeleted: 0,
                    totalDelta: 0,
                    ratio: 0,
                    commitCount: 0
                };
                byAuthor.set(userName, entry);
            }
            entry.commitCount += 1;
            current = entry;
            continue;
        }

        if (!current || !line.trim()) {
            continue;
        }

        // numstat lines are "<added>\t<deleted>\t<path>", with "-" for binaries.
        const parts = line.split("\t");
        if (parts.length < 3) {
            continue;
        }
        const [added, deleted] = parts;
        current.filesChanged += 1;
        if (added !== "-") {
            current.linesAdded += parseInt(added, 10) || 0;
        }
        if (deleted !== "-") {
            current.linesDeleted += parseInt(deleted, 10) || 0;
        }
    }

    for (const stats of byAuthor.values()) {
        stats.totalDelta = stats.linesAdded - stats.linesDeleted;
        stats.ratio = stats.linesAdded > 0 ? stats.linesDeleted / stats.linesAdded : 0;
    }

    return [...byAuthor.values()];
}

/**
 * Get stats for all contributors in a repository
 */
async function getRepoStats(
    repoPath: string,
    dateRange: IDateRange,
    excludePatterns: string[],
    ref = "HEAD"
): Promise<IUserStats[]> {
    // Validate that this is a git repository
    try {
        git(repoPath, ["rev-parse", "--is-inside-work-tree"]);
    } catch (error) {
        throw new Error(`Not a valid git repository: ${repoPath}. ${error instanceof Error ? error.message : String(error)}`);
    }

    return collectRepoStats(repoPath, ref, dateRange, excludePatterns);
}

export default getRepoStats;
