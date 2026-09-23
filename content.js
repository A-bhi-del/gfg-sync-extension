console.log("GFG Sync Content Script Loaded");

// 1. Inject inject.js into the main page world
const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
(document.head || document.documentElement).appendChild(script);

// 2. State Management
let currentWidgetState = "IDLE"; // "IDLE" | "SYNCING" | "SUCCESS" | "ERROR"
let lastSuccessUrl = "";
let lastErrorMessage = "";

// SVG Icons
const ICONS = {
    GITHUB: `<svg class="gfg-sync-icon" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`,
    CHECK: `<svg class="gfg-sync-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    ERROR: `<svg class="gfg-sync-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    SYNC: `<svg class="gfg-sync-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
};

// 3. Find the "Suggest Feedback" element or the "Problem Solved Successfully" header row
function findFeedbackOrVerdictSlot() {
    // Priority 1: Find the "Suggest Feedback" link/button
    const allElements = Array.from(document.querySelectorAll("a, button, span, div, p, u"));
    for (const el of allElements) {
        const text = el.innerText?.trim();
        if (text === "Suggest Feedback" || text?.toLowerCase() === "suggest feedback") {
            return {
                type: "FEEDBACK",
                element: el,
                parent: el.parentElement,
            };
        }
    }

    // Priority 2: Find "Problem Solved Successfully" row in Compilation Results
    for (const el of allElements) {
        const text = el.innerText?.trim();
        if (
            text === "Problem Solved Successfully" ||
            text?.startsWith("Problem Solved Successfully")
        ) {
            const row = el.closest("[class*='header'], [class*='sub_header'], div") || el.parentElement;
            return {
                type: "ROW",
                element: el,
                parent: row,
            };
        }
    }

    return null;
}

// 4. Render Widget by replacing "Suggest Feedback"
function renderSyncWidget(state, extraData = {}) {
    currentWidgetState = state;

    const slot = findFeedbackOrVerdictSlot();
    const existingWidget = document.getElementById("gfg-sync-widget-container");

    if (!slot) {
        // If not inside the submission / compilation results window, remove any detached widget
        if (existingWidget) existingWidget.remove();
        return;
    }

    let widgetEl = existingWidget;
    if (!widgetEl) {
        widgetEl = document.createElement("div");
        widgetEl.id = "gfg-sync-widget-container";
    }

    // If Suggest Feedback element found, hide it and place widget directly in its spot
    if (slot.type === "FEEDBACK") {
        slot.element.style.display = "none";
        if (widgetEl.previousElementSibling !== slot.element && widgetEl.parentElement !== slot.parent) {
            slot.element.insertAdjacentElement("beforebegin", widgetEl);
        }
    } else if (slot.type === "ROW") {
        if (widgetEl.parentElement !== slot.parent) {
            slot.parent.appendChild(widgetEl);
        }
    }

    let innerContent = "";

    switch (state) {
        case "SYNCING":
            innerContent = `
                <div class="gfg-sync-card">
                    <div class="gfg-sync-loading-container">
                        <div class="gfg-sync-spinner"></div>
                        <span>Syncing to GitHub...</span>
                    </div>
                </div>
            `;
            break;

        case "SUCCESS":
            const url = extraData.url || lastSuccessUrl;
            innerContent = `
                <div class="gfg-sync-card">
                    <div class="gfg-sync-status-success">
                        ${ICONS.CHECK}
                        <span>Synced to GitHub!</span>
                    </div>
                    ${
                        url
                            ? `<a href="${url}" target="_blank" class="gfg-sync-link">View ↗</a>`
                            : ""
                    }
                    <button class="gfg-sync-action-btn" id="gfg-sync-manual-btn" style="margin-left: 3px; padding: 2px 5px; font-size: 10px;">
                        Re-sync
                    </button>
                </div>
            `;
            break;

        case "ERROR":
            const errMsg = extraData.error || lastErrorMessage || "Sync Failed";
            innerContent = `
                <div class="gfg-sync-card">
                    <div class="gfg-sync-status-error" title="${errMsg}">
                        ${ICONS.ERROR}
                        <span>${errMsg.length > 18 ? errMsg.substring(0, 16) + "..." : errMsg}</span>
                    </div>
                    <button class="gfg-sync-retry-btn" id="gfg-sync-retry-btn">
                        Retry
                    </button>
                </div>
            `;
            break;

        case "IDLE":
        default:
            innerContent = `
                <div class="gfg-sync-card">
                    <button class="gfg-sync-action-btn" id="gfg-sync-manual-btn">
                        ${ICONS.SYNC}
                        <span>Sync with GitHub</span>
                    </button>
                </div>
            `;
            break;
    }

    widgetEl.innerHTML = innerContent;

    // Attach click listeners
    const manualBtn = widgetEl.querySelector("#gfg-sync-manual-btn");
    if (manualBtn) {
        manualBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            triggerManualSync();
        });
    }

    const retryBtn = widgetEl.querySelector("#gfg-sync-retry-btn");
    if (retryBtn) {
        retryBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            triggerManualSync();
        });
    }
}

// 5. Trigger Manual Sync on Demand
function triggerManualSync() {
    if (currentWidgetState === "SYNCING") return;

    renderSyncWidget("SYNCING");

    const requestId = "req_" + Date.now();

    const responseHandler = (event) => {
        if (
            event.source === window &&
            event.data?.type === "GFG_PROBLEM_DATA_RESPONSE" &&
            event.data?.requestId === requestId
        ) {
            window.removeEventListener("message", responseHandler);

            const problemData = event.data.data;
            if (!problemData || !problemData.code) {
                renderSyncWidget("ERROR", {
                    error: "Could not extract solution code.",
                });
                return;
            }

            dispatchSaveProblem(problemData);
        }
    };

    window.addEventListener("message", responseHandler);

    setTimeout(() => {
        window.removeEventListener("message", responseHandler);
        if (currentWidgetState === "SYNCING") {
            renderSyncWidget("ERROR", {
                error: "Extraction timed out.",
            });
        }
    }, 4000);

    window.postMessage(
        {
            type: "GFG_REQUEST_DATA",
            requestId: requestId,
        },
        "*"
    );
}

// 6. Dispatch problem to background and verify success
function dispatchSaveProblem(problemData) {
    chrome.runtime.sendMessage(
        {
            type: "SAVE_PROBLEM",
            payload: problemData,
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime message error:", chrome.runtime.lastError);
                renderSyncWidget("ERROR", {
                    error: chrome.runtime.lastError.message || "Connection error",
                });
                return;
            }

            if (response && response.success === true) {
                lastSuccessUrl = response.folderUrl || "";
                renderSyncWidget("SUCCESS", { url: lastSuccessUrl });
            } else {
                lastErrorMessage = response?.error || "Sync to GitHub failed.";
                renderSyncWidget("ERROR", { error: lastErrorMessage });
            }
        }
    );
}

// 7. Auto Submission Listener from inject.js
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "GFG_ACCEPTED") {
        console.log("GFG Accepted detected:", event.data.data);

        // Poll for "Suggest Feedback" / Compilation Results to render on the left
        let attempts = 0;
        const pollInterval = setInterval(() => {
            attempts++;
            const slot = findFeedbackOrVerdictSlot();
            if (slot) {
                clearInterval(pollInterval);
                renderSyncWidget("SYNCING");
                dispatchSaveProblem(event.data.data);
            } else if (attempts > 25) {
                clearInterval(pollInterval);
                // Fallback render
                renderSyncWidget("SYNCING");
                dispatchSaveProblem(event.data.data);
            }
        }, 150);
    }
});

// 8. Mutation Observer to keep widget replacing "Suggest Feedback" whenever Compilation Results is active
const observer = new MutationObserver(() => {
    const slot = findFeedbackOrVerdictSlot();
    const widget = document.getElementById("gfg-sync-widget-container");

    if (slot) {
        if (!widget || widget.parentElement !== slot.parent) {
            renderSyncWidget(currentWidgetState);
        }
    } else if (widget) {
        widget.remove();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});