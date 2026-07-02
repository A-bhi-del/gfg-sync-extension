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

chrome.runtime.onMessage.addListener(
    async (message) => {
        if (
            message.type !==
            "SAVE_PROBLEM"
        ) {
            return;
        }

        try {
            const problem =
                message.payload;

            const config =
                await chrome.storage.local.get([
                    "githubToken",
                    "repoOwner",
                    "repoName",
                ]);

            const {
                githubToken,
                repoOwner,
                repoName,
            } = config;

            if (
                !githubToken ||
                !repoOwner ||
                !repoName
            ) {
                console.error(
                    "❌ GitHub configuration missing"
                );
                return;
            }

            const safeTitle =
                problem.title.replace(
                    /[<>:"/\\|?*]/g,
                    ""
                );

            // ==========================
            // PUSH SOLUTION.CPP
            // ==========================

            const filePath =
                `${safeTitle}/solution.${problem.extension}`;

            const fileUrl =
                `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

            const encodedCode =
                btoa(
                    unescape(
                        encodeURIComponent(
                            problem.code
                        )
                    )
                );

            let solutionSha = null;

            const existingSolution =
                await fetch(fileUrl, {
                    headers: {
                        Authorization:
                            `Bearer ${githubToken}`,
                        Accept:
                            "application/vnd.github+json",
                    },
                });

            if (
                existingSolution.ok
            ) {
                const solutionData =
                    await existingSolution.json();

                solutionSha =
                    solutionData.sha;
            }

            const solutionResponse =
                await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${githubToken}`,
                        Accept:
                            "application/vnd.github+json",
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        message:
                            `Add ${problem.title}`,
                        content:
                            encodedCode,
                        ...(solutionSha && {
                            sha: solutionSha,
                        }),
                    }),
                });

            const solutionResult =
                await solutionResponse.json();

            console.log(
                "SOLUTION STATUS:",
                solutionResponse.status
            );

            console.log(
                solutionResult
            );

            if (
                !solutionResponse.ok
            ) {
                console.error(
                    "Solution Push Failed"
                );
                return;
            }

            console.log(
                "Solution Push Success"
            );

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
                Easy: "success",      // Green
                Medium: "important",    // Orange
                Hard: "critical",     // Red
            };

            const diff = problem.difficulty || "Unknown";
            const emoji = difficultyEmoji[diff] || "⚪";
            const color = difficultyColor[diff] || "informational";

            // Dynamic Premium Badge generation
            const difficultyBadge = `![${diff}](https://img.shields.io/badge/${diff}-${color}?style=for-the-badge&logoColor=white)`;

            const readmeContent = `# 🚀 ${problem.title}

---

### 📊 Quick Overview

| Metadata | Details |
| :--- | :--- |
| **Difficulty** | ${emoji} ${difficultyBadge} |
| **Language** | \`${problem.language}\` |
| **Problem Link** | [🔗 Challenge Link](${problem.url}) |

---

### 📝 Problem Statement

${problem.questionText.trim()}

---

### 🏢 Topic Tags

> ${tagsMarkdown}

---

### 💡 Solution Approach

The complete execution code can be found in the solution file. It uses an optimized approach to solve the problem efficiently.

👉 **View Solution:** [\`solution.${problem.extension}\`](./solution.${problem.extension})

---
<sub>*Automated repository update.*</sub>`.trim();

            const readmePath =
                `${safeTitle}/README.md`;

            const readmeUrl =
                `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${readmePath}`;

            let readmeSha = null;

            const existingReadme =
                await fetch(readmeUrl, {
                    headers: {
                        Authorization:
                            `Bearer ${githubToken}`,
                        Accept:
                            "application/vnd.github+json",
                    },
                });

            if (
                existingReadme.ok
            ) {
                const readmeData =
                    await existingReadme.json();

                readmeSha =
                    readmeData.sha;
            }

            const encodedReadme =
                btoa(
                    unescape(
                        encodeURIComponent(
                            readmeContent
                        )
                    )
                );

            const readmeResponse =
                await fetch(
                    readmeUrl,
                    {
                        method: "PUT",
                        headers: {
                            Authorization:
                                `Bearer ${githubToken}`,
                            Accept:
                                "application/vnd.github+json",
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            message:
                                `Add README for ${problem.title}`,
                            content:
                                encodedReadme,
                            ...(readmeSha && {
                                sha:
                                    readmeSha,
                            }),
                        }),
                    }
                );

            const readmeResult =
                await readmeResponse.json();

            console.log(
                "README STATUS:",
                readmeResponse.status
            );

            console.log(
                readmeResult
            );

            if (
                readmeResponse.ok
            ) {
                console.log(
                    "README Push Success"
                );
            } else {
                console.error(
                    "README Push Failed"
                );
            }

        } catch (error) {
            console.error(
                "Push Error:",
                error
            );
        }
    }
);