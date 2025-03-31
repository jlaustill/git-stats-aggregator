import type IAppConfig from "./IAppConfig";
import type IDateRange from "./IDateRange";
import type OutputFormat from "./OutputFormat";

interface IExecutionContext {
    config: IAppConfig;
    dateRange: IDateRange;
    format: OutputFormat;
}

export default IExecutionContext;
