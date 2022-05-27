import * as _assign from "lodash/assign";
import * as _has from "lodash/has";
import * as _includes from "lodash/includes";
import * as _isArray from "lodash/isArray";
import * as _isEmpty from "lodash/isEmpty";
import * as _isEqual from "lodash/isEqual";
import * as _map from "lodash/map";
import * as _merge from "lodash/merge";
import * as _mergeWith from "lodash/mergeWith";
import * as _reduce from "lodash/reduce";
import * as _union from "lodash/union";

import { DOMHelper } from "./dom";
import { PromptHelper } from "./prompt";
import { URLHelper } from "./url";

export const TranslationHelper = {
  getDefaultSelectionsFromLocalStorageOrURLOrConfig: ({
    withPageConfig: config,
    onPromptUserCallback: onPromptUserCallback,
  } = {}) => {
    const { groups } = config;

    const allURLParams = URLHelper.getAllURLParams();

    const localStorageSelections =
      TranslationHelper.getSelectionsFromLocalStorage();

    const pageDefaults = TranslationHelper.getPageDefaults({
      withPageConfig: config,
    });

    let shouldPromptUser = false;

    const defaultSelections = _reduce(
      groups,
      (result, group) => {
        const groupName = group.classPrefix;
        const [groupURLParamValue] = URLHelper.getURLParams([
          group.urlQueryStringParameter,
        ]);
        const [groupPromptValue] = URLHelper.getURLParams([
          `p-${group.urlQueryStringParameter}`,
        ]);

        const candidate = {
          fromURL: _has(group.dropdown.options, groupURLParamValue)
            ? groupURLParamValue
            : undefined,
          fromPrompt: _has(group.dropdown.options, groupPromptValue)
            ? groupPromptValue
            : undefined,
          fromLocalStorage: localStorageSelections?.[group.classPrefix],
          fromPageDefaults: pageDefaults?.[group.classPrefix],
          fromConfig: group.dropdown.defaultOption,
        };

        const userPreset = TranslationHelper.isOptionQualifiedForInclusion({
          withPageConfig: config,
          groupClassPrefix: group.classPrefix,
          optionKey:
            candidate.fromURL ||
            candidate.fromPrompt ||
            candidate.fromLocalStorage,
        })
          ? candidate.fromURL ||
            candidate.fromPrompt ||
            candidate.fromLocalStorage
          : undefined;

        // If the prompt is enabled, check if it should be displayed
        if (config.usePrompt && !userPreset) {
          shouldPromptUser = true;

          // If the user has previously selected a non-qualified option, redirect to homepageURL
          if (candidate.fromPrompt) {
            const redirectURL = URLHelper.addQueryParamsToUrl(
              config.homepageURL,
              allURLParams
            );

            window.location.assign(redirectURL);
          }
        }

        // Get default choices as a possible fallback
        const defaultChoice =
          candidate.fromPageDefaults || candidate.fromConfig;

        // Modify visible URL in browser to remove query parameters
        const modifiedURL = URLHelper.removeQueryParamsFromUrl(
          window.location.href,
          [group.urlQueryStringParameter, `p-${group.urlQueryStringParameter}`]
        );
        window.history.replaceState({}, "", modifiedURL);

        // Return selections object
        return {
          ...result,
          [groupName]: userPreset || defaultChoice,
        };
      },
      {}
    );

    const promptUserOverride =
      document.body.classList.contains("wml-disable-prompt");

    if (shouldPromptUser && !promptUserOverride) {
      PromptHelper.promptUser();

      onPromptUserCallback?.();
    }

    return defaultSelections;
  },
  writeSelectionsToLocalStorage: ({ selections: selections } = {}) => {
    localStorage.setItem("wml-selections", JSON.stringify(selections));
  },
  getSelectionsFromLocalStorage: () => {
    const localStorageSelections = localStorage.getItem("wml-selections");

    return localStorageSelections &&
      !_isEqual(localStorageSelections, "undefined")
      ? JSON.parse(localStorageSelections)
      : undefined;
  },
  getTranslatableElements: ({ withPageConfig: config } = {}) => {
    // Get list of class prefixes from config
    const classPrefixes = _map(config.groups, "classPrefix");

    /*
     * Build a CSS selector string matching all elements that start with
     * any of the prefixes in the given set, but exclude the corresponding dropdown placeholder class.
     * (e.g. ["wml-lng", ...] -> '[class*="wml-lng-"]:not(.wml-lng-placeholder), ...')
     */
    const translationElementsSelector = _reduce(
      classPrefixes,
      (result, prefix) => {
        return [
          ...result,
          `[class*="${prefix}-"]:not(.${prefix}-placeholder):not(.${prefix}-option)`,
        ];
      },
      []
    ).join(", ");

    // Find all elements matching the selector and return as an array.
    return DOMHelper(document.body).getNestedChildrenMatchingSelector(
      translationElementsSelector
    );
  },
  getTranslationOptionsOnElement: (
    element,
    { withPageConfig: config } = {}
  ) => {
    const classPrefixes = _map(config.groups, "classPrefix");

    return _reduce(
      classPrefixes,
      (translationGroups, classPrefix) => {
        const values =
          DOMHelper(element)
            .findAllClassesStartingWith(classPrefix)
            ?.map((className) => className.replace(`${classPrefix}-`, "")) ||
          [];

        return _isEmpty(values)
          ? translationGroups
          : _assign(translationGroups, {
              [classPrefix]: values,
            });
      },
      {}
    );
  },
  getTranslationOptionsOnPage: ({ withPageConfig: config } = {}) => {
    const translatableElements = TranslationHelper.getTranslatableElements({
      withPageConfig: config,
    });

    // Collect all translation groups by looking at each element
    return _reduce(
      translatableElements,
      (translationGroups, element) => {
        const translationGroupsOnElement =
          TranslationHelper.getTranslationOptionsOnElement(element, {
            withPageConfig: config,
          });

        // Deep merge translation groups of the current element into the accumulated value
        const mergerFunction = (firstValue, secondValue) => {
          if (_isArray(firstValue)) {
            return _union(firstValue, secondValue);
          }
        };

        return _mergeWith(
          translationGroups,
          translationGroupsOnElement,
          mergerFunction
        );
      },
      {}
    );
  },
  pageHasTranslations: ({ withPageConfig: config } = {}) => {
    const usedTranslationOptions =
      TranslationHelper.getTranslationOptionsOnPage({
        withPageConfig: config,
      });

    return !_isEmpty(usedTranslationOptions);
  },
  getPageDefaults: ({ withPageConfig: config } = {}) => {
    return _reduce(
      config.groups,
      (pageDefaults, group) => {
        const groupDefault = DOMHelper(document.body)
          .findAllClassesStartingWith(`${group.classPrefix}-default-`)?.[0]
          ?.replace(`${group.classPrefix}-default-`, "");

        return _isEmpty(groupDefault)
          ? pageDefaults
          : _assign(pageDefaults, {
              [group.classPrefix]: groupDefault,
            });
      },
      {}
    );
  },
  getPageInclusions: ({ withPageConfig: config } = {}) => {
    return _reduce(
      config.groups,
      (pageInclusions, group) => {
        const groupInclusions =
          DOMHelper(document.body)
            .findAllClassesStartingWith(`${group.classPrefix}-include-`)
            ?.map((className) =>
              className.replace(`${group.classPrefix}-include-`, "")
            ) || [];

        return _isEmpty(groupInclusions)
          ? pageInclusions
          : _assign(pageInclusions, {
              [group.classPrefix]: groupInclusions,
            });
      },
      {}
    );
  },
  getPageExclusions: ({ withPageConfig: config } = {}) => {
    return _reduce(
      config.groups,
      (pageExclusions, group) => {
        const groupExclusions =
          DOMHelper(document.body)
            .findAllClassesStartingWith(`${group.classPrefix}-exclude-`)
            ?.map((className) =>
              className.replace(`${group.classPrefix}-exclude-`, "")
            ) || [];

        return _isEmpty(groupExclusions)
          ? pageExclusions
          : _assign(pageExclusions, {
              [group.classPrefix]: groupExclusions,
            });
      },
      {}
    );
  },
  isOptionQualifiedForInclusion: ({
    withPageConfig: config,
    groupClassPrefix: prefix,
    optionKey: key,
  } = {}) => {
    const pageExclusions = TranslationHelper.getPageExclusions({
      withPageConfig: config,
    });
    const pageInclusions = TranslationHelper.getPageInclusions({
      withPageConfig: config,
    });

    const isExcluded = _isEmpty(pageExclusions)
      ? false
      : _includes(pageExclusions[prefix], key);
    const isIncluded = _isEmpty(pageInclusions)
      ? true
      : _includes(pageInclusions[prefix], key);

    return !isExcluded && isIncluded;
  },
};
