import type IExecutionContext from "../types/IExecutionContext";
import type IUserStats from "../types/IUserStats";
import formatConsole from "./console";
import formatCsv from "./csv";
import formatJson from "./json";

/**
 * Format and output the aggregated statistics
 */
function formatOutput(stats: IUserStats[], context: IExecutionContext): void {
    switch (context.format) {
        case 'csv':
            formatCsv(stats);
            break;
        case 'json':
            formatJson(stats);
            break;
        case 'pretty':
        default:
            formatConsole(stats);
            break;
    }
}

export default formatOutput;
