import chalk from "chalk";
import getRepoStats from "./gitCommands";
import type IAggregatedStats from "./types/IAggregatedStats";
import type IExecutionContext from "./types/IExecutionContext";
import type IUserStats from "./types/IUserStats";

/**
 * Normalize user name based on configured mappings
 */
function normalizeUserName(userName: string, context: IExecutionContext): string {
    for (const mapping of context.config.userMappings) {
        if (userName === mapping.primaryName || mapping.alternateIdentities.includes(userName)) {
            return mapping.primaryName;
        }
    }
    return userName;
}

/**
 * Aggregate statistics across all active repositories
 */
async function aggregateStats(context: IExecutionContext): Promise<IUserStats[]> {
    const { config, dateRange } = context;
    const aggregated: IAggregatedStats = {};

    // Process each active repository
    for (const repo of config.repositories.filter(r => r.active)) {
        try {
            console.log(chalk.yellow(`Processing repository: ${repo.name}`));

            // Get stats for this repository
            const repoStats = await getRepoStats(repo.path, dateRange, config.excludePatterns);

            // Aggregate stats by normalized user name
            for (const userStat of repoStats) {
                const normalizedName = normalizeUserName(userStat.userName, context);

                if (!aggregated[normalizedName]) {
                    // Initialize stats for this user
                    aggregated[normalizedName] = {
                        filesChanged: 0,
                        linesAdded: 0,
                        linesDeleted: 0,
                        totalDelta: 0,
                        ratio: 0,
                        commitCount: 0
                    };
                }

                // Add stats from this repo to user's aggregated stats
                const stats = aggregated[normalizedName];
                stats.filesChanged += userStat.filesChanged;
                stats.linesAdded += userStat.linesAdded;
                stats.linesDeleted += userStat.linesDeleted;
                stats.totalDelta += userStat.totalDelta;
                stats.commitCount += userStat.commitCount;

                // Recalculate ratio
                if (stats.linesAdded > 0) {
                    stats.ratio = stats.linesDeleted / stats.linesAdded;
                }
            }
        } catch (error) {
            console.error(chalk.red(`Error processing ${repo.name}: ${(error as Error).message}`));
            // Continue with other repositories instead of failing completely
        }
    }

    // Convert aggregated stats to array format
    const result: IUserStats[] = Object.entries(aggregated).map(([userName, stats]) => ({
        userName,
        ...stats
    }));

    // Sort by commit count (descending)
    return result.sort((a, b) => b.commitCount - a.commitCount);
}

export default aggregateStats;
