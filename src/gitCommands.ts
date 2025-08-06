import { execSync } from "child_process";
import type IDateRange from "./types/IDateRange";
import type IUserStats from "./types/IUserStats";

/**
 * Execute a git command in the specified repository
 */
export function executeGitCommand(repoPath: string, command: string): string {
    try {
        const result: string = execSync(command, { cwd: repoPath, encoding: "utf-8", shell: "/bin/zsh",
            stdio: ['inherit', 'pipe', 'inherit'] });
        return result;
    } catch (error) {
        throw new Error(`Git command failed: ${(error as Error).message}`);
    }
}

/**
 * Get all contributors in the specified date range
 */
async function getContributors(repoPath: string, dateRange: IDateRange): Promise<string[]> {
    const command = `git shortlog -sn --no-merges --since="${dateRange.since}" --before="${dateRange.until}"`;

    try {
        const output = executeGitCommand(repoPath, command);

        if (!output) {
            return [];
        }

        // Parse the shortlog output to extract user names
        return output
            .split('\n')
            .map(line => {
                // Extract everything after the number at the beginning
                const match = line.match(/^\s*\d+\s+(.+)$/);
                return match ? match[1].trim() : '';
            })
            .filter(name => name); // Remove empty names
    } catch (error) {
        console.error(`Error getting contributors: ${(error as Error).message}`);
        return [];
    }
}

/**
 * Get stats for a specific user in a repository
 */
async function getUserStats(
    repoPath: string,
    userName: string,
    dateRange: IDateRange,
    excludePatterns: string[]
): Promise<IUserStats | null> {
    // Create exclude arguments for git log if patterns are provided
    const excludeArgs = excludePatterns
        .map(pattern => `--exclude="${pattern}"`)
        .join(' ');

    // Command to get detailed stats for this user
    const command = `git log --author="${userName}" --no-merges --shortstat ${excludeArgs} --since="${dateRange.since}" --before="${dateRange.until}"`;

    try {
        const output = await executeGitCommand(repoPath, command);

        // If no output or no stats lines, return null
        if (!output || !output.includes('file')) {
            return null;
        }

        // Extract stats from the git log output
        const statsLines = output
            .split('\n')
            .filter(line => line.includes('file') && line.includes('changed'));

        if (statsLines.length === 0) {
            return null;
        }

        // Parse stats and accumulate
        let filesChanged = 0;
        let linesAdded = 0;
        let linesDeleted = 0;

        for (const line of statsLines) {
            // Match patterns like: "2 files changed, 20 insertions(+), 10 deletions(-)"
            const fileMatch = line.match(/(\d+) file.? changed/);
            const insertMatch = line.match(/(\d+) insertion.?\(\+\)/);
            const deleteMatch = line.match(/(\d+) deletion.?\(-\)/);

            filesChanged += fileMatch ? parseInt(fileMatch[1], 10) : 0;
            linesAdded += insertMatch ? parseInt(insertMatch[1], 10) : 0;
            linesDeleted += deleteMatch ? parseInt(deleteMatch[1], 10) : 0;
        }

        // Get commit count for this user
        const commitCountCommand = `git shortlog -sn --no-merges --since="${dateRange.since}" --before="${dateRange.until}" --author="${userName}"`;
        const commitCountOutput = await executeGitCommand(repoPath, commitCountCommand);

        let commitCount = 0;
        if (commitCountOutput) {
            const match = commitCountOutput.match(/^\s*(\d+)/);
            commitCount = match ? parseInt(match[1], 10) : 0;
        }

        // Calculate derived stats
        const totalDelta = linesAdded - linesDeleted;
        const ratio = linesAdded > 0 ? linesDeleted / linesAdded : 0;

        return {
            userName,
            filesChanged,
            linesAdded,
            linesDeleted,
            totalDelta,
            ratio,
            commitCount
        };
    } catch (error) {
        console.error(`Error getting stats for ${userName}: ${(error as Error).message}`);
        return null;
    }
}

/**
 * Get stats for all contributors in a repository
 */
async function getRepoStats(
    repoPath: string,
    dateRange: IDateRange,
    excludePatterns: string[]
): Promise<IUserStats[]> {
    // Validate that this is a git repository
    try {
        executeGitCommand(repoPath, 'git rev-parse --is-inside-work-tree');
    } catch (error) {
        throw new Error(`Not a valid git repository: ${repoPath}. ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get all contributors in the specified date range
    const contributors = await getContributors(repoPath, dateRange);

    if (contributors.length === 0) {
        return [];
    }

    // Get stats for each contributor
    const statsPromises = contributors.map(
        userName => getUserStats(repoPath, userName, dateRange, excludePatterns)
    );

    const results = await Promise.all(statsPromises);

    // Filter out null results and return
    return results.filter((stats): stats is IUserStats => stats !== null);
}

export default getRepoStats;
