import chalk from "chalk";
import type IUserStats from "../types/IUserStats";

/**
 * Format the stats for console output with colors and table layout
 */
function formatConsole(stats: IUserStats[]): void {
    // Define column widths
    const columns = {
        userName: 30,
        filesChanged: 15,
        linesAdded: 15,
        linesDeleted: 15,
        totalDelta: 20,
        ratio: 21,
        commitCount: 15
    };

    // Print header
    console.log(
        chalk.white(
            `${padRight('User name', columns.userName)} | ` +
            `${padRight('Files changed', columns.filesChanged)} | ` +
            `${padRight('Lines added', columns.linesAdded)} | ` +
            `${padRight('Lines deleted', columns.linesDeleted)} | ` +
            `${padRight('Total lines (delta)', columns.totalDelta)} | ` +
            `${padRight('Add./Del. ratio (1:n)', columns.ratio)} | ` +
            `${padRight('Commit count', columns.commitCount)}`
        )
    );

    // Print separator
    console.log(
        chalk.white(
            `${'-'.repeat(columns.userName)} | ` +
            `${'-'.repeat(columns.filesChanged)} | ` +
            `${'-'.repeat(columns.linesAdded)} | ` +
            `${'-'.repeat(columns.linesDeleted)} | ` +
            `${'-'.repeat(columns.totalDelta)} | ` +
            `${'-'.repeat(columns.ratio)} | ` +
            `${'-'.repeat(columns.commitCount)}`
        )
    );

    // Print each user's stats
    for (const user of stats) {
        console.log(
            `${padRight(user.userName, columns.userName)} | ` +
            `${chalk.magenta(padRight(user.filesChanged.toString(), columns.filesChanged))} | ` +
            `${chalk.green(padRight(user.linesAdded.toString(), columns.linesAdded))} | ` +
            `${chalk.red(padRight(user.linesDeleted.toString(), columns.linesDeleted))} | ` +
            `${chalk.white(padRight(user.totalDelta.toString(), columns.totalDelta))} | ` +
            `${chalk.white(padRight(user.ratio.toFixed(6), columns.ratio))} | ` +
            `${chalk.white(padRight(user.commitCount.toString(), columns.commitCount))}`
        );
    }
}

/**
 * Pad a string to the right with spaces to reach the specified length
 */
function padRight(str: string, length: number): string {
    return str.padEnd(length);
}

export default formatConsole;
