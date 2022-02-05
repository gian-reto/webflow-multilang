import * as _uniq from "lodash/uniq";

export const DOMHelper = (node) => {
  return {
    getNestedChildrenMatchingSelector: (selector) => {
      return [...node.querySelectorAll(selector)];
    },
    getDirectChildrenWithSelector: (selector) => {
      return [...node.children].filter((child) => {
        return child.matches(selector);
      });
    },
    getSiblingsWithSelector: (selector) => {
      return [...node.parentNode.children].filter((child) => {
        return child !== node && child.matches(selector);
      });
    },
    getAllChildNodesDeep: () => {
      return Array.from(node.childNodes).reduce((acc, childNode) => {
        return _uniq([
          ...acc,
          childNode,
          ...DOMHelper(childNode).getAllChildNodesDeep(),
        ]);
      }, []);
    },
    findChildOfNodeName: (nodeName) => {
      return DOMHelper(node)
        .getAllChildNodesDeep()
        .find((child) => {
          return (
            child.nodeName == nodeName && !/[\s\t\n\r]/.test(child.nodeValue)
          );
        });
    },
    getNarrowestClassSelectorFrom: (root) => {
      const parents = [];
      let n = node;

      while (n && n !== root) {
        parents.push(
          [...n.classList].map((className) => `.${className}`).join("")
        );
        n = n.parentElement;
      }

      return parents.reverse().join(" > ");
    },
    isElement: () => {
      return node.nodeType === Node.ELEMENT_NODE;
    },
    getHiddenClone: () => {
      let replacement;

      if (DOMHelper(node).isElement()) {
        replacement = document.createElement(node.tagName);

        replacement.style.display = "none";

        [...node.attributes].forEach((attr) => {
          replacement.setAttribute(attr.nodeName, attr.nodeValue);
        });
      }

      return replacement;
    },
    softRemove: () => {
      const replacement = DOMHelper(node).getHiddenClone();

      if (replacement) {
        node.parentNode.replaceChild(replacement, node);
      }

      return replacement;
    },
    findClassStartingWith: (string) => {
      return DOMHelper(node).isElement()
        ? [...node.classList].find((item) => item.startsWith(string))
        : undefined;
    },
    findAllClassesStartingWith: (string) => {
      return DOMHelper(node).isElement()
        ? [...node.classList].filter((item) => item.startsWith(string))
        : undefined;
    },
    cloneForItems: (items, onCreateCloneCallback = (item, clone) => {}) => {
      const fragment =
        node &&
        items.reduce((acc, item) => {
          const clone = node.cloneNode(true);

          onCreateCloneCallback(item, clone);

          acc.appendChild(clone);

          return acc;
        }, document.createDocumentFragment());

      return fragment;
    },
    replaceTextContent: (text) => {
      const textNode = DOMHelper(node).findChildOfNodeName("#text");

      const replacement = document.createTextNode(text);

      return textNode
        ? textNode.replaceWith(replacement)
        : node.appendChild(replacement);
    },
  };
};
