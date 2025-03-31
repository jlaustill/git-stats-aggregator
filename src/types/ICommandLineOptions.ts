import type OutputFormat from "./OutputFormat";
import type TimePeriod from "./TimePeriod";

interface ICommandLineOptions {
    format?: OutputFormat;
    period?: TimePeriod;
    since?: string;
    until?: string;
    configPath?: string;
    help?: boolean;
}

export default ICommandLineOptions;
