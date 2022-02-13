import * as _assign from "lodash/assign";
import * as _filter from "lodash/filter";
import * as _find from "lodash/find";
import * as _forEach from "lodash/forEach";
import * as _isEmpty from "lodash/isEmpty";
import * as _isEqual from "lodash/isEqual";
import * as _keys from "lodash/keys";
import * as _map from "lodash/map";
import * as _reduce from "lodash/reduce";

import { DOMHelper } from "./dom";
import { TranslationHelper } from "./translation";

export const DropdownHelper = {
  initializeDropdowns: ({
    withPageConfig: config,
    defaultSelections: defaultSelections,
    onOptionClickCallback: onOptionClickCallback,
  } = {}) => {
    const dropdowns = _reduce(
      config.groups,
      (dropdowns, group) => {
        const activeOption = defaultSelections[group.classPrefix];

        // Add dropdown to DOM
        const dropdownOptions = DropdownElementFactory({
          forGroup: group,
          withPageConfig: config,
          onElementCreateCallback: (dropdownOption, dropdownOptionElement) => {
            if (_isEqual(dropdownOption, activeOption)) {
              dropdownOptionElement.classList.add(`wml-option-active`);
            }
          },
          onOptionClickCallback: (event, group, dropdownOption) => {
            onOptionClickCallback(event, group, dropdownOption);
          },
        });

        if (_isEmpty(dropdownOptions)) return dropdowns;

        return _assign(dropdowns, {
          [group.classPrefix]: dropdownOptions,
        });
      },
      {}
    );

    return dropdowns;
  },
  updateActiveDropdownOptions: ({
    withPageConfig: config,
    currentSelections: currentSelections,
  } = {}) => {
    _forEach(config.groups, (group) => {
      const dropdownOptionElements = [
        ...document.body.querySelectorAll(`.${group.classPrefix}-option`),
      ];
      const activeOptions = dropdownOptionElements.filter((option) => {
        return option.classList.contains(
          `${group.classPrefix}-option-${currentSelections[group.classPrefix]}`
        );
      });

      _forEach(dropdownOptionElements, (dropdownOptionElement) => {
        dropdownOptionElement.classList.remove(`wml-option-active`);

        if (
          _find(activeOptions, (activeOption) =>
            _isEqual(dropdownOptionElement, activeOption)
          )
        ) {
          dropdownOptionElement.classList.add(`wml-option-active`);
        }
      });
    });
  },
};

const DropdownElementFactory = ({
  forGroup: group,
  withPageConfig: config,
  onElementCreateCallback: onElementCreateCallback,
  onOptionClickCallback: onOptionClickCallback,
}) => {
  const placeholders = document.querySelectorAll(
    `.${group.classPrefix}-placeholder`
  );

  const dropdownOptions = _map(placeholders, (placeholder) => {
    let dropdownOptionPlaceholderElement;

    // Setup dropdown container
    switch (group.dropdown.strategy) {
      // Replace strategy: clones an existing *option placeholder element* for every option
      case "replace":
        dropdownOptionPlaceholderElement = placeholder;

        break;

      // Create strategy: inserts a dropdown into an existing *dropdown placeholder element*
      case "create":
        DOMHelper(placeholder).appendMarkupAsChild(`
        <div class="builtin-wml-dropdown">
          <div class="bwmld-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><path fill="currentColor" fill-rule="nonzero" d="M15 1c7.732 0 14 6.268 14 14s-6.268 14-14 14S1 22.732 1 15 7.268 1 15 1Zm-1 21.672c-1.203.07-2.29.271-3.265.602.894 1.818 2.05 3.08 3.266 3.537L14 22.672Zm2.001 0v4.14c1.215-.458 2.37-1.72 3.263-3.537a11.97 11.97 0 0 0-2.817-.57L16 22.672Zm-7.074 1.441-.208.13c-.245.159-.48.33-.705.514.614.442 1.273.826 1.967 1.146a13.039 13.039 0 0 1-1.054-1.79Zm12.147-.001-.025.05a12.947 12.947 0 0 1-1.03 1.741c.694-.32 1.353-.704 1.968-1.146a8.166 8.166 0 0 0-.913-.645ZM7.02 15.999H3.041a11.96 11.96 0 0 0 3.43 7.443 10.09 10.09 0 0 1 1.682-1.197C7.514 20.4 7.112 18.275 7.02 16Zm19.939 0h-3.98c-.09 2.276-.493 4.401-1.133 6.248.604.341 1.165.74 1.682 1.193A11.953 11.953 0 0 0 26.96 16ZM14 16H9.022c.087 2 .435 3.84.96 5.421 1.21-.424 2.55-.674 4.018-.75v-4.671Zm6.978 0H16v4.67c1.468.077 2.809.327 4.019.75.524-1.58.872-3.42.96-5.42ZM6.278 6.76l-.059.06A11.956 11.956 0 0 0 3.041 14h3.98c.086-2.148.45-4.161 1.027-5.933a10.05 10.05 0 0 1-1.77-1.307Zm3.596 2.158-.017.053c-.455 1.49-.755 3.192-.835 5.029L14 13.999V9.706c-1.511-.08-2.888-.342-4.126-.788Zm10.252 0-.266.093c-1.168.39-2.456.621-3.86.695v4.293h4.978c-.081-1.857-.387-3.579-.852-5.082Zm3.596-2.16-.093.087c-.515.464-1.074.872-1.676 1.224.577 1.77.94 3.783 1.027 5.93h3.979a11.957 11.957 0 0 0-3.237-7.24Zm-13.079.16-.061.13c1.014.362 2.152.58 3.418.655V3.189c-1.191.447-2.325 1.67-3.212 3.43l-.145.298ZM16 3.187l.001 4.515c1.266-.074 2.403-.293 3.417-.655-.913-1.99-2.132-3.376-3.418-3.86Zm-6.019.909-.11.052c-.744.351-1.445.777-2.095 1.268.317.279.654.532 1.012.76.356-.765.755-1.462 1.193-2.08Zm10.038 0 .07.1c.41.593.786 1.256 1.122 1.98a8.03 8.03 0 0 0 1.013-.76c-.682-.515-1.42-.959-2.205-1.32Z"/></svg>
          </div>
          <div class="bwmld-options-container">
            <div class="${group.classPrefix}-placeholder bwmld-option"></div>
          </div>
        </div>
      `);

        dropdownOptionPlaceholderElement = placeholder.querySelector(
          `.${group.classPrefix}-placeholder`
        );

        break;
    }

    if (!dropdownOptionPlaceholderElement) return;

    // Add options to dropdown
    const dropdownOptionElementsFragment = OptionElementsFactory({
      forGroup: group,
      withPageConfig: config,
      onElementCreateCallback: (dropdownOption, dropdownOptionElement) => {
        onElementCreateCallback(dropdownOption, dropdownOptionElement);
      },
      onOptionClickCallback: (event, group, dropdownOption) => {
        onOptionClickCallback(event, group, dropdownOption);
      },
    }).createByCloningPlaceholderElement(dropdownOptionPlaceholderElement);

    if (!dropdownOptionElementsFragment) return;

    dropdownOptionPlaceholderElement.replaceWith(
      dropdownOptionElementsFragment
    );

    return [...dropdownOptionElementsFragment.children];
  });

  return dropdownOptions || [];
};

const OptionElementsFactory = ({
  forGroup: group,
  withPageConfig: config,
  onElementCreateCallback: onElementCreateCallback,
  onOptionClickCallback: onOptionClickCallback,
}) => {
  const usedTranslationOptions = TranslationHelper.getTranslationOptionsOnPage({
    withPageConfig: config,
  });

  const pageHasAnyTranslations = !_isEmpty(usedTranslationOptions);

  const dropdownOptions = group.dropdown.hideUnusedOptions
    ? usedTranslationOptions[group.classPrefix]
    : _keys(group.dropdown.options);

  return {
    createByCloningPlaceholderElement: (placeholderElement) => {
      if (!placeholderElement) return;

      const dropdownOptionElementsFragment = DOMHelper(
        placeholderElement
      ).cloneForItems(
        dropdownOptions,
        (dropdownOption, dropdownOptionElement) => {
          const dropdownOptionHasTranslations = !!_find(
            usedTranslationOptions[group.classPrefix],
            (translationOption) => _isEqual(translationOption, dropdownOption)
          );

          // Set element text to "pretty" option name
          DOMHelper(dropdownOptionElement).replaceTextContent(
            group.dropdown.options[dropdownOption]
          );

          // Add click listener, which calls the callback
          ["click", "touchstart"].forEach((eventName) => {
            dropdownOptionElement.addEventListener(eventName, (event) => {
              const isTranslationMissing =
                group.dropdown.redirectToHomepageOnMissingTranslation &&
                !dropdownOptionHasTranslations &&
                pageHasAnyTranslations;

              const isExcluded =
                !TranslationHelper.isOptionQualifiedForInclusion({
                  withPageConfig: config,
                  groupClassPrefix: group.classPrefix,
                  optionKey: dropdownOption,
                });

              if (isTranslationMissing || isExcluded) {
                window.location.assign(config.homepageURL);
              } else {
                onOptionClickCallback(event, group, dropdownOption);
              }
            });
          });

          // Switch option class
          dropdownOptionElement.classList.remove(
            `${group.classPrefix}-placeholder`
          );
          dropdownOptionElement.classList.add(
            `${group.classPrefix}-option`,
            `${group.classPrefix}-option-${dropdownOption}`
          );

          // Callback
          onElementCreateCallback(dropdownOption, dropdownOptionElement);
        }
      );

      return dropdownOptionElementsFragment;
    },
  };
};
