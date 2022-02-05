export const URLHelper = {
  getURLParam: (paramName) => {
    const currentLocation = window.location.href;
    const currentURL = new URL(currentLocation);

    return currentURL.searchParams.get(paramName);
  },
  getURLParams: (paramNames = []) => {
    return paramNames.map((paramName) => {
      return URLHelper.getURLParam(paramName);
    });
  },
  isExternalURL: (url) => {
    return !(
      location.href
        .replace("http://", "")
        .replace("https://", "")
        .split("/")[0] ===
      url.replace("http://", "").replace("https://", "").split("/")[0]
    );
  },
  addQueryParamsToUrl: (url, params = {}) => {
    // If URL is relative, add a fake base
    let fakeBase = !url.startsWith("http") ? "http://fake-base.com" : undefined;
    let modifiedUrl = new URL(url || "", fakeBase);

    // Add/update params
    Object.keys(params).forEach((key) => {
      if (modifiedUrl.searchParams.has(key)) {
        modifiedUrl.searchParams.set(key, params[key]);
      } else {
        modifiedUrl.searchParams.append(key, params[key]);
      }
    });

    // Return new URL as string (remove fake base if present)
    return modifiedUrl.toString().replace(fakeBase, "");
  },
  removeQueryParamsFromUrl: (url, params = []) => {
    // If URL is relative, add a fake base
    let fakeBase = !url.startsWith("http") ? "http://fake-base.com" : undefined;
    let modifiedUrl = new URL(url || "", fakeBase);

    // Remove params
    params.forEach((key) => {
      modifiedUrl.searchParams.delete(key);
    });

    // Return new URL as string (remove fake base if present)
    return modifiedUrl.toString().replace(fakeBase, "");
  },
};
