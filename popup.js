const tokenInput =
  document.getElementById("token");

const ownerInput =
  document.getElementById("owner");

const repoInput =
  document.getElementById("repo");

chrome.storage.local.get(
  [
    "githubToken",
    "repoOwner",
    "repoName",
  ],
  (data) => {
    tokenInput.value =
      data.githubToken || "";

    ownerInput.value =
      data.repoOwner || "";

    repoInput.value =
      data.repoName || "";
  }
);

document
  .getElementById("save")
  .addEventListener(
    "click",
    async () => {

      await chrome.storage.local.set({
        githubToken:
          tokenInput.value.trim(),

        repoOwner:
          ownerInput.value.trim(),

        repoName:
          repoInput.value.trim(),
      });

      alert("Settings Saved!");
    }
  );

// =======================
// GITHUB LOGIN BUTTON
// =======================

document
  .getElementById("githubLogin")
  ?.addEventListener(
    "click",
    () => {

      const clientId =
        "Ov23licI8dL8LVyZwBMR";

      const redirectUri =
        chrome.identity.getRedirectURL();

      const authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(
          redirectUri
        )}` +
        `&scope=repo`;

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        (responseUrl) => {

          console.log(
            "OAuth Response:",
            responseUrl
          );

          if (!responseUrl) {
            console.error(
              "Login cancelled"
            );
            return;
          }

          const url =
            new URL(responseUrl);

          const code =
            url.searchParams.get(
              "code"
            );

          console.log(
            "Authorization Code:",
            code
          );
        }
      );
    }
  );