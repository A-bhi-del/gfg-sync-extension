# GFG Sync 🚀

Automatically sync accepted GeeksforGeeks solutions to GitHub.

## Features

* Automatically detects accepted GeeksforGeeks submissions.
* Extracts complete source code from the editor.
* Extracts problem title and statement.
* Generates a README.md for each problem.
* Pushes solutions directly to GitHub.
* Updates existing solutions automatically.

## Folder Structure

```text
Problem Name/
├── README.md
└── solution.cpp
```

## Installation

### 1. Download Extension

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/gfg-sync-extension.git
```

### 2. Load Extension

* Open Chrome
* Navigate to:

```text
chrome://extensions
```

* Enable **Developer Mode**
* Click **Load Unpacked**
* Select the extension folder

### 3. Generate GitHub Personal Access Token

GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token

Required Scope:

```text
repo
```

### 4. Configure Extension

Click the extension icon and enter:

```text
GitHub Token
GitHub Username
Repository Name
```

Then click **Save Settings**.

### 5. Start Syncing

* Solve any GeeksforGeeks problem.
* Submit a correct solution.
* The extension automatically pushes:

  * solution.cpp
  * README.md

to your GitHub repository.

## Example Output

```text
GFG-Solutions/
└── Rat Maze With Multiple Jumps/
    ├── README.md
    └── solution.cpp
```

## Tech Stack

* JavaScript
* Chrome Extension API
* GitHub REST API
* GeeksforGeeks Platform Integration

## Future Improvements

* GitHub OAuth Login
* Automatic Repository Selection
* Language Detection
* Difficulty & Tags Extraction
* Chrome Web Store Release

## Disclaimer

This project is not affiliated with GeeksforGeeks or GitHub.
