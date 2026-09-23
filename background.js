chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query(
        {
            url: "*://*.geeksforgeeks.org/*",
        },
        (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    chrome.tabs.reload(tab.id);
                }
            });
        }
    );
});

async function saveProblemToGitHub(problem) {
    const config = await chrome.storage.local.get([
        "githubToken",
        "repoOwner",
        "repoName",
    ]);

    const { githubToken, repoOwner, repoName } = config;

    if (!githubToken || !repoOwner || !repoName) {
        throw new Error("GitHub configuration missing! Please click the extension icon to set your Token, Username, and Repository.");
    }

    const safeTitle = (problem.title || "GFG_Problem").replace(
        /[<>:"/\\|?*]/g,
        ""
    ).trim();

    // ==========================
    // PUSH SOLUTION FILE
    // ==========================
    const filePath = `${safeTitle}/solution.${problem.extension || "cpp"}`;
    const fileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const encodedCode = btoa(
        unescape(encodeURIComponent(problem.code || "// No code captured"))
    );

    let solutionSha = null;
    const existingSolution = await fetch(fileUrl, {
        headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
        },
    });

    if (existingSolution.ok) {
        const solutionData = await existingSolution.json();
        solutionSha = solutionData.sha;
    } else if (existingSolution.status === 401) {
        throw new Error("GitHub Authentication Failed (401). Please check your Personal Access Token.");
    } else if (existingSolution.status === 404) {
        // 404 for file check is expected if the file doesn't exist yet, but verify if repo exists
        // We'll proceed with PUT. If the repo doesn't exist, PUT will return 404.
    }

    const solutionResponse = await fetch(fileUrl, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: `Sync ${problem.title} solution`,
            content: encodedCode,
            ...(solutionSha && { sha: solutionSha }),
        }),
    });

    const solutionResult = await solutionResponse.json();

    if (!solutionResponse.ok) {
        if (solutionResponse.status === 404) {
            throw new Error(`Repository "${repoOwner}/${repoName}" not found (404). Ensure it exists and token has 'repo' scope.`);
        }
        throw new Error(solutionResult.message || `Solution push failed with HTTP ${solutionResponse.status}`);
    }

    // ==========================
    // PUSH README.MD
    // ==========================
    const tagsMarkdown = problem.tags?.length
        ? problem.tags.map((tag) => `\`${tag}\``).join(" ")
        : "_None available_";

    const difficultyEmoji = {
        Easy: "🟢",
        Medium: "🟡",
        Hard: "🔴",
    };

    const difficultyColor = {
        Easy: "success",
        Medium: "important",
        Hard: "critical",
    };

    const diff = problem.difficulty || "Medium";
    const emoji = difficultyEmoji[diff] || "⚪";
    const color = difficultyColor[diff] || "informational";

    const difficultyBadge = `![${diff}](https://img.shields.io/badge/${diff}-${color}?style=for-the-badge&logoColor=white)`;

    const readmeContent = `# 🚀 ${problem.title}

---

### 📊 Quick Overview

| Metadata | Details |
| :--- | :--- |
| **Difficulty** | ${emoji} ${difficultyBadge} |
| **Language** | \`${problem.language || "Unknown"}\` |
| **Problem Link** | [🔗 Challenge Link](${problem.url || "https://www.geeksforgeeks.org/"}) |

---

### 📝 Problem Statement

${(problem.questionText || "").trim()}

---

### 🏢 Topic Tags

> ${tagsMarkdown}

---

### 💡 Solution File

👉 **View Solution:** [\`solution.${problem.extension || "cpp"}\`](./solution.${problem.extension || "cpp"})

---
<sub>*Synced automatically with [GFG Sync](https://github.com/)*</sub>`.trim();

    const readmePath = `${safeTitle}/README.md`;
    const readmeUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${readmePath}`;

    let readmeSha = null;
    const existingReadme = await fetch(readmeUrl, {
        headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
        },
    });

    if (existingReadme.ok) {
        const readmeData = await existingReadme.json();
        readmeSha = readmeData.sha;
    }

    const encodedReadme = btoa(
        unescape(encodeURIComponent(readmeContent))
    );

    const readmeResponse = await fetch(readmeUrl, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: `Add README for ${problem.title}`,
            content: encodedReadme,
            ...(readmeSha && { sha: readmeSha }),
        }),
    });

    const readmeResult = await readmeResponse.json();

    if (!readmeResponse.ok) {
        console.warn("README Push Failed:", readmeResult);
    }

    const problemFolderUrl = `https://github.com/${repoOwner}/${repoName}/tree/main/${encodeURIComponent(safeTitle)}`;

    return {
        success: true,
        title: problem.title,
        folderUrl: problemFolderUrl,
        filePath: filePath,
    };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAVE_PROBLEM") {
        saveProblemToGitHub(message.payload)
            .then((result) => {
                if (chrome.action?.setBadgeText) {
                    chrome.action.setBadgeText({ text: "OK" });
                    chrome.action.setBadgeBackgroundColor({ color: "#2f8d46" });
                    setTimeout(() => {
                        chrome.action.setBadgeText({ text: "" });
                    }, 5000);
                }
                sendResponse({ success: true, ...result });
            })
            .catch((error) => {
                console.error("Save Problem Error:", error);
                if (chrome.action?.setBadgeText) {
                    chrome.action.setBadgeText({ text: "ERR" });
                    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
                    setTimeout(() => {
                        chrome.action.setBadgeText({ text: "" });
                    }, 5000);
                }
                sendResponse({ success: false, error: error.message || "Unknown error occurred" });
            });

        return true; // Keep channel open for asynchronous sendResponse
    }
});