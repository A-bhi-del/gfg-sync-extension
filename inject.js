// console.log("INJECT FILE LOADED");

// function getProblemData() {
//   try {
//     const editor =
//       document.querySelector("#ace-editor");

//     const questionElement =
//       document.querySelector(
//         ".problems_problem_content__Xm_eO"
//       );

//     if (
//       !editor ||
//       !questionElement ||
//       !window.ace
//     ) {
//       return null;
//     }

//     const code =
//       window.ace.edit(editor).getValue();

//     const title = document.title
//       .split("|")[0]
//       .trim();

//     return {
//       title,
//       questionHTML:
//         questionElement.innerHTML,
//       code,
//       url: location.href,
//       timestamp:
//         new Date().toISOString(),
//     };
//   } catch (error) {
//     console.error(
//       "Problem extraction failed:",
//       error
//     );
//     return null;
//   }
// }

// const originalFetch = window.fetch;

// window.fetch = async (...args) => {
//   const response =
//     await originalFetch(...args);

//   try {
//     const clonedResponse =
//       response.clone();

//     clonedResponse
//       .json()
//       .then((data) => {
//         const isAccepted =
//           data?.status ===
//             "SUCCESS" &&
//           data?.view_mode ===
//             "correct";

//         if (!isAccepted) return;

//         const problemData =
//           getProblemData();

//         if (!problemData) return;

//         console.log(
//           "ACCEPTED DETECTED"
//         );

//         window.postMessage({
//           type:
//             "GFG_ACCEPTED",
//           data:
//             problemData,
//         });
//       })
//       .catch(() => {});
//   } catch (error) {
//     console.error(error);
//   }

//   return response;
// };

console.log("INJECT FILE LOADED");

function getProblemData() {
    try {
        const editor =
            document.querySelector("#ace-editor");

        const questionElement =
            document.querySelector(
                ".problems_problem_content__Xm_eO"
            );

        if (
            !editor ||
            !questionElement ||
            !window.ace
        ) {
            return null;
        }

        const code =
            window.ace.edit(editor).getValue();

        const title = document.title
            .split("|")[0]
            .trim();

        const temp =
            document.createElement("div");

        temp.innerHTML =
            questionElement.innerHTML;

        const questionText = temp.innerText
            .replace(/Input:/g, "\n\n### Input:\n")
            .replace(/Output:/g, "\n\n### Output:\n")
            .replace(/Explanation:/g, "\n\n### Explanation:\n")
            .replace(/Constraints:/g, "\n\n### Constraints:\n");

        return {
            title,
            questionHTML:
                questionElement.innerHTML,
            questionText,
            code,
            url: location.href,
            timestamp:
                new Date().toISOString(),
        };
    } catch (error) {
        console.error(
            "Problem extraction failed:",
            error
        );
        return null;
    }
}

const originalFetch = window.fetch;

window.fetch = async (...args) => {
    const response =
        await originalFetch(...args);

    try {
        const clonedResponse =
            response.clone();

        clonedResponse
            .json()
            .then((data) => {
                const isAccepted =
                    data?.status ===
                    "SUCCESS" &&
                    data?.view_mode ===
                    "correct";

                if (!isAccepted) return;

                const problemData =
                    getProblemData();

                if (!problemData) return;

                console.log(
                    "ACCEPTED DETECTED"
                );

                window.postMessage({
                    type:
                        "GFG_ACCEPTED",
                    data:
                        problemData,
                });
            })
            .catch(() => { });
    } catch (error) {
        console.error(error);
    }

    return response;
};