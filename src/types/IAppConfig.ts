import type IUserMapping from "./IUserMapping";
import type OutputFormat from "./OutputFormat";
import type IRepository from "./IRepository";
import type TimePeriod from "./TimePeriod";


interface IAppConfig {
    defaults: {
        period: TimePeriod;
        format: OutputFormat;
    };
    repositories: IRepository[];
    userMappings: IUserMapping[];
    excludePatterns: string[];
}

export default IAppConfig;
