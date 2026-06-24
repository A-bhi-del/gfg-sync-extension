console.log("CONTENT LOADED");

const script = document.createElement("script");

script.src = chrome.runtime.getURL("inject.js");

(document.head || document.documentElement)
  .appendChild(script);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type !== "GFG_ACCEPTED")
    return;

  console.log(
    "ACCEPTED DATA:",
    event.data.data
  );

  chrome.runtime.sendMessage({
    type: "SAVE_PROBLEM",
    payload: event.data.data,
  });
});