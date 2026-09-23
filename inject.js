console.log("INJECT FILE LOADED");

function getLanguageExtension(language) {
    if (!language) return "cpp";
    const lang = language.toLowerCase();
    if (lang.includes("c++") || lang.includes("cpp")) return "cpp";
    if (lang.includes("java") && !lang.includes("script")) return "java";
    if (lang.includes("python") || lang.includes("py")) return "py";
    if (lang.includes("c#") || lang.includes("cs")) return "cs";
    if (lang.includes("javascript") || lang.includes("js") || lang.includes("node")) return "js";
    if (lang.includes("c") && !lang.includes("c++") && !lang.includes("c#")) return "c";
    if (lang.includes("typescript") || lang.includes("ts")) return "ts";
    if (lang.includes("go") || lang.includes("golang")) return "go";
    if (lang.includes("rust")) return "rs";
    if (lang.includes("kotlin")) return "kt";
    return "cpp";
}

function getProblemData() {
    try {
        const editor = document.querySelector("#ace-editor");

        const questionElement =
            document.querySelector(".problems_problem_content__Xm_eO") ||
            document.querySelector("[class*='problems_problem_content']") ||
            document.querySelector(".problem-statement") ||
            document.querySelector("#problems-left-container");

        let code = "";
        if (window.ace && editor) {
            code = window.ace.edit(editor).getValue();
        } else if (editor) {
            code = editor.innerText || editor.textContent || "";
        }

        const title = (document.title || "")
            .split("|")[0]
            .replace(/Practice\s*$/i, "")
            .replace(/GeeksforGeeks/i, "")
            .trim();

        const languageEl =
            document.querySelector(".divider.text") ||
            document.querySelector(".select-lang-btn") ||
            document.querySelector("[class*='language-select']") ||
            document.querySelector("[class*='select-language']");

        const language = languageEl?.innerText?.trim() || "C++";
        const extension = getLanguageExtension(language);

        const difficultyEl =
            document.querySelector(".problems_header_description__t_8PB strong") ||
            document.querySelector("[class*='problems_header_description'] strong") ||
            document.querySelector(".problems_header_description strong") ||
            document.querySelector("[class*='difficulty']");

        const difficulty = difficultyEl?.innerText?.trim() || "Medium";

        const topicSections = [
            ...document.querySelectorAll(".problems_accordion_tags__JJ2DX"),
            ...document.querySelectorAll("[class*='problems_accordion_tags']"),
        ];

        const topicSection = topicSections.find(
            (section) =>
                section.querySelector("strong")?.innerText?.trim() === "Topic Tags"
        );

        let tags = [];
        if (topicSection) {
            tags = [
                ...topicSection.querySelectorAll(".problems_tag_label__A4Ism, [class*='problems_tag_label']"),
            ].map((tag) => tag.innerText.trim()).filter(Boolean);
        } else {
            tags = [
                ...document.querySelectorAll(".problems_tag_label__A4Ism, [class*='problems_tag_label']"),
            ].map((tag) => tag.innerText.trim()).filter(Boolean);
        }

        let questionHTML = "";
        let questionText = "";

        if (questionElement) {
            questionHTML = questionElement.innerHTML;
            const temp = document.createElement("div");
            temp.innerHTML = questionElement.innerHTML;

            questionText = temp.innerText
                .replace(/Input:/g, "\n\n### Input:\n")
                .replace(/Output:/g, "\n\n### Output:\n")
                .replace(/Explanation:/g, "\n\n### Explanation:\n")
                .replace(/Constraints:/g, "\n\n### Constraints:\n");
        }

        return {
            title: title || "GFG Problem",
            questionHTML,
            questionText: questionText || "Problem statement not found.",
            code,
            language,
            extension,
            difficulty,
            tags,
            url: window.location.href,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Problem extraction failed:", error);
        return null;
    }
}

// Handler for on-demand extraction
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "GFG_REQUEST_DATA") {
        const problemData = getProblemData();
        window.postMessage(
            {
                type: "GFG_PROBLEM_DATA_RESPONSE",
                data: problemData,
                requestId: event.data.requestId,
            },
            "*"
        );
    }
});

function checkAndNotifyAccepted(data) {
    if (!data) return;

    const isAccepted =
        (data.status === "SUCCESS" && data.view_mode === "correct") ||
        (data.view_mode === "correct") ||
        (data.status === "SUCCESS" && data.sub_type === "submit") ||
        (typeof data.message === "string" && data.message.toLowerCase().includes("problem solved successfully"));

    if (isAccepted) {
        console.log("GFG Accepted detected via network interception");
        const problemData = getProblemData();
        if (problemData) {
            window.postMessage(
                {
                    type: "GFG_ACCEPTED",
                    data: problemData,
                },
                "*"
            );
        }
    }
}

// 1. Intercept window.fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
        const clonedResponse = response.clone();
        clonedResponse
            .json()
            .then((data) => {
                checkAndNotifyAccepted(data);
            })
            .catch(() => {});
    } catch (error) {}

    return response;
};

// 2. Intercept XMLHttpRequest as fallback
const originalXHR = window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (...args) {
    this.addEventListener("load", function () {
        try {
            if (this.responseText) {
                const data = JSON.parse(this.responseText);
                checkAndNotifyAccepted(data);
            }
        } catch (e) {}
    });
    return originalXHR.apply(this, args);
};