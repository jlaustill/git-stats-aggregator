interface IGitStats {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    totalDelta: number;
    ratio: number;
    commitCount: number;
}

export default IGitStats;
