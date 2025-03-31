#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";
import aggregateStats from "./aggregator";
import formatOutput from "./reporters";
import IExecutionContext from "./types/IExecutionContext";
import type IAppConfig from "./types/IAppConfig";
import type ICommandLineOptions from "./types/ICommandLineOptions";
import type IDateRange from "./types/IDateRange";
import type OutputFormat from "./types/OutputFormat";
import type TimePeriod from "./types/TimePeriod";

// Default configuration file path
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), "config", "repos.json");

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): ICommandLineOptions {
    const program = new Command();

    program
        .name('git-stats-aggregator')
        .description('Aggregate git statistics across multiple repositories')
        .version('1.0.0');

    program
        .option('-f, --format <format>', 'Output format: pretty, csv, or json')
        .option('-p, --period <period>', 'Time period: last-day, last-week, last-month, last-quarter, last-year, custom')
        .option('-s, --since <date>', 'Custom start date (format: YYYY-MM-DD)')
        .option('-u, --until <date>', 'Custom end date (format: YYYY-MM-DD)')
        .option('-c, --config <path>', 'Path to configuration file')
        .option('-h, --help', 'Display help information');

    program.parse(process.argv);

    return program.opts() as ICommandLineOptions;
}

/**
 * Load and validate the configuration file
 */
function loadConfig(configPath: string): IAppConfig {
    try {
        const configData = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData) as IAppConfig;

        // Validate essential configuration properties
        if (!config.repositories || !Array.isArray(config.repositories)) {
            throw new Error('Invalid configuration: repositories must be an array');
        }

        return config;
    } catch (error) {
        console.error(chalk.red(`Error loading configuration: ${(error as Error).message}`));
        process.exit(1);
    }
}

/**
 * Calculate date range based on the specified period or custom dates
 */
function calculateDateRange(period: TimePeriod, since?: string, until?: string): IDateRange {
    const now = new Date();
    let sinceDate: Date;
    let untilDate = now;

    if (period === 'custom' && since && until) {
        return {
            since,
            until
        };
    }

    // Calculate relative date based on period
    switch (period) {
        case 'last-day':
            sinceDate = new Date(now);
            sinceDate.setDate(now.getDate() - 1);
            break;
        case 'last-week':
            sinceDate = new Date(now);
            sinceDate.setDate(now.getDate() - 7);
            break;
        case 'last-month':
            sinceDate = new Date(now);
            sinceDate.setMonth(now.getMonth() - 1);
            break;
        case 'last-quarter':
            sinceDate = new Date(now);
            sinceDate.setMonth(now.getMonth() - 3);
            break;
        case 'last-year':
            sinceDate = new Date(now);
            sinceDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            // Default to last month
            sinceDate = new Date(now);
            sinceDate.setMonth(now.getMonth() - 1);
    }

    return {
        since: sinceDate.toISOString().split('T')[0], // YYYY-MM-DD format
        until: untilDate.toISOString().split('T')[0]
    };
}

/**
 * Main application entry point
 */
async function main() {
    const options = parseCommandLineArgs();

    if (options.help) {
        console.log(`
Git Stats Aggregator

Usage:
  git-stats-aggregator [options]

Options:
  -f, --format <format>   Output format: pretty, csv, or json (default: from config)
  -p, --period <period>   Time period: last-day, last-week, last-month, last-quarter, last-year, custom (default: from config)
  -s, --since <date>      Custom start date (format: YYYY-MM-DD) - requires --period=custom
  -u, --until <date>      Custom end date (format: YYYY-MM-DD) - requires --period=custom
  -c, --config <path>     Path to configuration file (default: ./config/repos.json)
  -h, --help              Display this help information
  -v, --version           Display version information
    `);
        process.exit(0);
    }

    // Load configuration
    const configPath = options.configPath ?? DEFAULT_CONFIG_PATH;
    const config = loadConfig(configPath);

    // Use command line options or fall back to defaults from config
    const format = options.format as OutputFormat || config.defaults.format;
    const period = options.period as TimePeriod || config.defaults.period;

    // Calculate date range
    const dateRange = calculateDateRange(
        period,
        options.since,
        options.until
    );

    console.log(chalk.blue(`\nAggregating git stats from ${dateRange.since} to ${dateRange.until}\n`));

    // Create execution context
    const context: IExecutionContext = {
        config,
        dateRange,
        format
    };

    try {
        // Aggregate stats from all active repositories
        const stats = await aggregateStats(context);

        // Output the results in the specified format
        formatOutput(stats, context);
    } catch (error) {
        console.error(chalk.red(`Error: ${(error as Error).message}`));
        process.exit(1);
    }
}

// Run the application
main().catch(err => {
    console.error(chalk.red(`Unhandled error: ${err.message}`));
    process.exit(1);
});
