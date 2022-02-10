import { DOMHelper } from "./dom";

export const PromptHelper = {
  promptUser: ({
    withPageConfig: config,
    onPromptUserCallback: onPromptUserCallback,
  } = {}) => {
    const prompt = DOMHelper(document.body).appendMarkupAsChild(`
      <div class="builtin-wml-prompt">
        <div class="bwmlp-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path fill="currentColor" fill-rule="evenodd" d="M1.914 0A1.912 1.912 0 0 0 .58 3.28l11.714 11.715L.58 26.707a1.915 1.915 0 0 0-.02 2.725 1.912 1.912 0 0 0 2.725-.02l11.712-11.714 11.712 11.714A1.914 1.914 0 0 0 30 28.066a1.91 1.91 0 0 0-.589-1.359L17.7 14.995 29.411 3.282a1.913 1.913 0 0 0-1.389-3.28 1.922 1.922 0 0 0-1.313.578L14.997 12.292 3.285.58A1.914 1.914 0 0 0 1.915 0Z"/></svg>
        </div>
        <div class="bwmlp-prompt-container">
          <img src="https://assets-global.website-files.com/60d0cc8b6ae893913fdf0468/60da17c71cb16823bfbebc79_Logo_Zemp-27.svg" loading="lazy" width="100px" style="margin-bottom: 1rem" alt="" class="image">
          <h1 class="heading-31">Wähle deine Region</h1>
          <div class="bwmlp-options-container">
            <a class="bwmlp-option" href="?p-region=ch">Schweiz</a>
            <a class="bwmlp-option" href="?p-region=de">Deutschland</a>
          </div>
        </div>
      </div>
    `);

    console.log(prompt);

    const closeButtonElement = document.querySelector(".bwmlp-close");

    ["click", "touchstart"].forEach((eventName) => {
      closeButtonElement.addEventListener(eventName, (event) => {
        prompt.parentNode.removeChild(prompt);
      });
    });

    return prompt;
  },
};
