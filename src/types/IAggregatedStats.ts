import type IGitStats from "./IGitStats";

interface IAggregatedStats {
    [userName: string]: IGitStats;
}

export default IAggregatedStats;
