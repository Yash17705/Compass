(() => {
  const rootElement = document.getElementById("react-explore-root");
  const dataElement = document.getElementById("react-explore-data");

  if (!rootElement || !dataElement || !window.React || !window.ReactDOM) {
    return;
  }

  const { createElement: h, useEffect, useMemo, useState } = window.React;
  const { createRoot } = window.ReactDOM;

  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("compass-theme");
    if (savedTheme) {
      return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const parseData = () => {
    try {
      return JSON.parse(dataElement.textContent);
    } catch (error) {
      return { listings: [], initialSearch: "" };
    }
  };

  const listingMatches = (listing, query) => {
    if (!query) {
      return true;
    }

    const haystack = [
      listing.title,
      listing.location,
      listing.country,
      String(listing.price),
      String(listing.guests),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.toLowerCase());
  };

  const App = () => {
    const exploreData = useMemo(parseData, []);
    const [theme, setTheme] = useState(getInitialTheme);
    const [query, setQuery] = useState(exploreData.initialSearch || "");
    const [viewMode, setViewMode] = useState(
      localStorage.getItem("compass-view-mode") || "grid"
    );

    const visibleListings = useMemo(
      () => exploreData.listings.filter((listing) => listingMatches(listing, query)),
      [exploreData.listings, query]
    );

    useEffect(() => {
      document.body.dataset.theme = theme;
      localStorage.setItem("compass-theme", theme);
    }, [theme]);

    useEffect(() => {
      const results = document.querySelectorAll(".listing-result");
      results.forEach((result) => {
        const title = result.dataset.title || "";
        const location = result.dataset.location || "";
        const price = result.dataset.price || "";
        const text = `${title} ${location} ${price}`.toLowerCase();
        result.hidden = query ? !text.includes(query.toLowerCase()) : false;
      });
    }, [query]);

    useEffect(() => {
      const resultsGrid = document.getElementById("listing-results");
      if (!resultsGrid) {
        return;
      }

      resultsGrid.dataset.viewMode = viewMode;
      localStorage.setItem("compass-view-mode", viewMode);
    }, [viewMode]);

    return h(
      "div",
      { className: "react-command-bar" },
      h(
        "div",
        { className: "react-command-main" },
        h(
          "div",
          { className: "react-command-title" },
          h("span", null, `${visibleListings.length} visible`),
          h("strong", null, "Explore controls")
        ),
        h("input", {
          type: "search",
          value: query,
          placeholder: "Filter visible stays instantly",
          "aria-label": "Filter visible stays instantly",
          onChange: (event) => setQuery(event.target.value),
        })
      ),
      h(
        "div",
        { className: "react-command-actions" },
        h(
          "button",
          {
            type: "button",
            className: viewMode === "grid" ? "active" : "",
            onClick: () => setViewMode("grid"),
          },
          "Grid"
        ),
        h(
          "button",
          {
            type: "button",
            className: viewMode === "list" ? "active" : "",
            onClick: () => setViewMode("list"),
          },
          "List"
        ),
        h(
          "button",
          {
            type: "button",
            className: theme === "dark" ? "active" : "",
            onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
          },
          theme === "dark" ? "Light mode" : "Dark mode"
        )
      )
    );
  };

  createRoot(rootElement).render(h(App));
})();
