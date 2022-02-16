import * as _assign from "lodash/assign";
import * as _each from "lodash/each";
import * as _filter from "lodash/filter";
import * as _find from "lodash/find";
import * as _isEqual from "lodash/isEqual";
import * as _map from "lodash/map";
import * as _merge from "lodash/merge";
import * as _reduce from "lodash/reduce";

// Helpers
import { DOMHelper } from "../util/dom";
import { DropdownHelper } from "../util/dropdown";
import { TranslationHelper } from "../util/translation";
import { URLHelper } from "../util/url";

// Defaults
/* const DEFAULTS = {
  config: {
    homepageURL: "https://google.com",
    usePrompt: false,
    groups: [
      {
        urlQueryStringParameter: "language",
        classPrefix: "wml-lng",
        dropdown: {
          strategy: "create",
          hideUnusedOptions: false,
          redirectToHomepageOnMissingTranslation: false,
          defaultOption: "en",
          options: {
            en: "English",
          },
        },
      },
      {
        urlQueryStringParameter: "region",
        classPrefix: "wml-reg",
        dropdown: {
          strategy: "replace",
          hideUnusedOptions: false,
          redirectToHomepageOnMissingTranslation: false,
          defaultOption: "us",
          options: {
            us: "United States",
          },
        },
      },
    ],
  },
}; */

export const WebflowMultilang = (config = DEFAULTS.config) => {
  const [translatableElementsState, initialSelectionsState] = getInitialState({
    withPageConfig: config,
  });

  // Apply initial state
  let currentSelections = setState({
    withPageConfig: config,
    translatableElementsState: translatableElementsState,
    currentSelections: initialSelectionsState,
  });

  TranslationHelper.writeSelectionsToLocalStorage({
    selections: currentSelections,
  });

  // Initialize dropdowns
  const dropdowns = DropdownHelper.initializeDropdowns({
    withPageConfig: config,
    defaultSelections: initialSelectionsState,
    onOptionClickCallback: (_, group, dropdownOption) => {
      currentSelections = setState({
        withPageConfig: config,
        translatableElementsState: translatableElementsState,
        currentSelections: currentSelections,
        newSelection: {
          [group.classPrefix]: dropdownOption,
        },
      });

      TranslationHelper.writeSelectionsToLocalStorage({
        selections: currentSelections,
      });
    },
  });

  // If selections can't be written to localStorage, redirect using parameters
  if (!TranslationHelper.getSelectionsFromLocalStorage()) {
    ["click", "touchstart"].forEach((eventName) => {
      window.addEventListener(eventName, (event) => {
        let href = event.target.getAttribute("href");

        if (href) {
          event.preventDefault();

          const params = _reduce(
            currentSelections,
            (params, dropdownOption, classPrefix) => {
              const urlQueryStringParameter = _find(config.groups, [
                "classPrefix",
                classPrefix,
              ])?.urlQueryStringParameter;

              return _assign(params, {
                [urlQueryStringParameter]: dropdownOption,
              });
            },
            {}
          );

          if (URLHelper.isExternalURL(href)) {
            href = URLHelper.addQueryParamsToUrl(href, params);
          }

          location.href = href;
        }
      });
    });
  }

  // Show Elements after initialization
  document.body.classList.remove("wml-nojs");
};

const getInitialState = ({ withPageConfig: config } = {}) => {
  // Get initial selections from URL params, or fallback to the config
  const initialSelectionsState =
    TranslationHelper.getDefaultSelectionsFromLocalStorageOrURLOrConfig({
      withPageConfig: config,
    });

  // Get translatable elements (i.e. elements that have translation classes) on the page
  const translatableElements = TranslationHelper.getTranslatableElements({
    withPageConfig: config,
  });

  const initialTranslatableElementsState = _map(
    translatableElements,
    (translatableElement) => {
      return {
        currentElement: translatableElement,
        originalElement: translatableElement,
        placeholderElement: DOMHelper(translatableElement).getHiddenClone(),
      };
    }
  );

  return [initialTranslatableElementsState, initialSelectionsState];
};

const setState = ({
  withPageConfig: config,
  translatableElementsState: translatableElementsState,
  currentSelections: currentSelections,
  newSelection: newSelection,
} = {}) => {
  const newSelections = _merge(currentSelections, newSelection);

  _each(translatableElementsState, (translation) => {
    const classList = _filter(
      [...translation.currentElement.classList],
      (className) => className.startsWith("wml-")
    );

    const shouldDisplay = _reduce(
      classList,
      (shouldDisplay, className) => {
        if (!shouldDisplay) return false;

        const value = className.split("-").slice(-1)[0];
        const classPrefix = className.substring(
          0,
          className.lastIndexOf(`-${value}`)
        );

        if (!value || !classPrefix) return false;

        return _isEqual(newSelections[classPrefix], value);
      },
      true
    );

    if (shouldDisplay) {
      // Replace current element with original element
      translation.currentElement.parentNode.replaceChild(
        translation.originalElement,
        translation.currentElement
      );

      // Update translationsMap
      translation.currentElement = translation.originalElement;

      // Show element
      translation.currentElement.style.removeProperty("display");
    } else {
      // Replace current element with placeholder element
      translation.currentElement.parentNode.replaceChild(
        translation.placeholderElement,
        translation.currentElement
      );

      // Update translationsMap
      translation.currentElement = translation.placeholderElement;

      // Hide element
      translation.currentElement.style.display = "none";
    }
  });

  // Update dropdown active options
  DropdownHelper.updateActiveDropdownOptions({
    withPageConfig: config,
    currentSelections: newSelections,
  });

  // Reinit Webflow
  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  window.Webflow && window.Webflow.require("ix2").init();
  document.dispatchEvent(new Event("readystatechange"));

  // Replay Videos
  _map(document.querySelectorAll("video"), (videoElement) => {
    videoElement.play();
  });

  // Return updated selections
  return newSelections;
};
