// chrome.runtime.onMessage.addListener(
//   async (message) => {
//     if (message.type !== "SAVE_PROBLEM") {
//       return;
//     }

//     try {
//       const problem = message.payload;

//       const config = await chrome.storage.local.get([
//         "githubToken",
//         "repoOwner",
//         "repoName",
//       ]);

//       const {
//         githubToken,
//         repoOwner,
//         repoName,
//       } = config;

//       console.log("CONFIG:", {
//         repoOwner,
//         repoName,
//         hasToken: !!githubToken,
//       });

//       if (
//         !githubToken ||
//         !repoOwner ||
//         !repoName
//       ) {
//         console.error(
//           "❌ GitHub configuration missing"
//         );
//         return;
//       }

//       const safeTitle =
//         problem.title.replace(
//           /[<>:"/\\|?*]/g,
//           ""
//         );

//       const filePath =
//         `${safeTitle}/solution.cpp`;

//       const encodedContent =
//         btoa(
//           unescape(
//             encodeURIComponent(
//               problem.code
//             )
//           )
//         );

//       const repoUrl =
//         `https://api.github.com/repos/${repoOwner}/${repoName}`;

//       const url =
//         `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

//       console.log("REPO URL:", repoUrl);
//       console.log("FILE URL:", url);

//       // Check Repo Access
//       const repoCheck =
//         await fetch(repoUrl, {
//           headers: {
//             Authorization:
//               `Bearer ${githubToken}`,
//             Accept:
//               "application/vnd.github+json",
//           },
//         });

//       console.log(
//         "REPO CHECK STATUS:",
//         repoCheck.status
//       );

//       const repoData =
//         await repoCheck.json();

//       console.log(
//         "REPO RESPONSE:",
//         repoData
//       );

//       if (!repoCheck.ok) {
//         console.error(
//           "❌ Repo not accessible"
//         );
//         return;
//       }

//       // Check Existing File
//       let sha = null;

//       const existingFile =
//         await fetch(url, {
//           headers: {
//             Authorization:
//               `Bearer ${githubToken}`,
//             Accept:
//               "application/vnd.github+json",
//           },
//         });

//       console.log(
//         "FILE CHECK STATUS:",
//         existingFile.status
//       );

//       if (existingFile.ok) {
//         const existingData =
//           await existingFile.json();

//         sha = existingData.sha;

//         console.log(
//           "EXISTING FILE SHA:",
//           sha
//         );
//       }

//       const response =
//         await fetch(url, {
//           method: "PUT",
//           headers: {
//             Authorization:
//               `Bearer ${githubToken}`,
//             Accept:
//               "application/vnd.github+json",
//             "Content-Type":
//               "application/json",
//           },
//           body: JSON.stringify({
//             message:
//               `Add ${problem.title}`,
//             content:
//               encodedContent,
//             ...(sha && { sha }),
//           }),
//         });

//       console.log(
//         "PUT STATUS:",
//         response.status
//       );

//       const result =
//         await response.json();

//       console.log(
//         "GITHUB RESPONSE:"
//       );

//       console.log(result);

//       if (response.ok) {
//         console.log(
//           "✅ GitHub Push Success"
//         );
//       } else {
//         console.error(
//           "❌ GitHub Push Failed"
//         );
//       }

//     } catch (error) {
//       console.error(
//         "❌ Push Error:",
//         error
//       );
//     }
//   }
// );

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
                `${safeTitle}/solution.cpp`;

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
                    "❌ Solution Push Failed"
                );
                return;
            }

            console.log(
                "✅ Solution Push Success"
            );

            // ==========================
            // PUSH README.MD
            // ==========================

            const readmeContent = `# ${problem.title}

## Problem Link

${problem.url}

## Problem Statement

${problem.questionText}

---

## Solution

See \`solution.cpp\`
`;

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
                    "✅ README Push Success"
                );
            } else {
                console.error(
                    "❌ README Push Failed"
                );
            }

        } catch (error) {
            console.error(
                "❌ Push Error:",
                error
            );
        }
    }
);