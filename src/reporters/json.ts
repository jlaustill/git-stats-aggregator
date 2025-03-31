import type IUserStats from "../types/IUserStats";

/**
 * Format the stats as JSON and print to stdout
 */
function formatJson(stats: IUserStats[]): void {
    // Format with proper indentation for readability
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userCount: stats.length,
        stats
    }, null, 2));
}

export default formatJson;
