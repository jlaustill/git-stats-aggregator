# Git Stats Aggregator

A command-line tool that aggregates git statistics across multiple repositories to help teams track contributions and hold themselves accountable.

## Overview

Git Stats Aggregator collects and summarizes contribution metrics (commits, files changed, lines added/deleted) from multiple git repositories in one unified view. This makes it easy to:

- Track team productivity across distributed codebases
- Identify active and inactive areas of development
- Generate reports for sprints, quarters, or custom time periods
- Consolidate contributions from developers who use multiple identities

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/git-stats-aggregator.git
cd git-stats-aggregator

# Install dependencies
npm install

# Set up configuration
cp config/repos.example.json config/repos.json
# Edit config/repos.json to match your repositories and team
```

## Configuration

Edit `config/repos.json` to configure your repositories and user mappings:

```json
{
  "defaults": {
    "period": "last-month",
    "format": "pretty"
  },
  "repositories": [
    {
      "name": "react",
      "path": "/Users/developer/code/react",
      "active": true
    },
    {
      "name": "redux",
      "path": "/Users/developer/code/redux",
      "active": true
    }
  ],
  "userMappings": [
    {
      "primaryName": "Jane Smith",
      "alternateIdentities": [
        "jane.smith"
      ]
    }
  ],
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.lock"
  ]
}
```

### Configuration Options

- **defaults**: Default time period and output format
- **repositories**: List of repositories to analyze
    - **name**: Display name for the repository
    - **path**: Absolute path to the repository on your local machine
    - **active**: Whether to include this repository in the analysis
- **userMappings**: Maps alternate git identities to a primary name
- **excludePatterns**: File patterns to exclude from the analysis

## Usage

```bash
# Use default settings from config/repos.json
npm run start

# Or with specific options
npm run start -- --period last-week --format json
```

### Command Line Options

```
Options:
  -f, --format <format>   Output format: pretty, csv, or json (default: from config)
  -p, --period <period>   Time period: last-day, last-week, last-month, last-quarter, last-year, custom (default: from config)
  -s, --since <date>      Custom start date (format: YYYY-MM-DD) - requires --period=custom
  -u, --until <date>      Custom end date (format: YYYY-MM-DD) - requires --period=custom
  -c, --config <path>     Path to configuration file (default: ./config/repos.json)
  -h, --help              Display this help information
  -v, --version           Display version information
```

## Example Output

### Pretty Format (Default)

```
Aggregating git stats from 2025-03-03 to 2025-03-31
Processing repository: react
Processing repository: redux
Processing repository: mui
Processing repository: typescript

User name                      | Files changed   | Lines added     | Lines deleted   | Total lines (delta)  | Add./Del. ratio (1:n) | Commit count   
------------------------------ | --------------- | --------------- | --------------- | -------------------- | --------------------- | ---------------
Jane Smith                     | 56              | 3518            | 1287            | 2231                 | 0.365833              | 32            
John Doe                       | 134             | 1505            | 686             | 819                  | 0.455814              | 58             
Alex Johnson                   | 146             | 2036            | 1712            | 324                  | 0.840864              | 38             
Sam Wilson                     | 71              | 1088            | 710             | 378                  | 0.652574              | 31             
```

### JSON Format

```json
{
  "period": {
    "since": "2025-03-03",
    "until": "2025-03-31"
  },
  "users": [
    {
      "name": "Jane Smith",
      "commits": 32,
      "filesChanged": 56,
      "linesAdded": 3518,
      "linesDeleted": 1287,
      "linesDelta": 2231,
      "ratio": 0.365833
    },
    {
      "name": "John Doe",
      "commits": 58,
      "filesChanged": 134,
      "linesAdded": 1505,
      "linesDeleted": 686,
      "linesDelta": 819,
      "ratio": 0.455814
    }
  ]
}
```

### CSV Format

```
Name,Files Changed,Lines Added,Lines Deleted,Lines Delta,Ratio,Commits
Jane Smith,56,3518,1287,2231,0.365833,32
John Doe,134,1505,686,819,0.455814,58
Alex Johnson,146,2036,1712,324,0.840864,38
Sam Wilson,71,1088,710,378,0.652574,31
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue with suggestions for improvements.

For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
