(() => {
  const rootElement = document.getElementById("react-listings-app");
  const detailRootElement = document.getElementById(
    "react-listing-detail-root",
  );
  const listDataElement = document.getElementById("react-explore-data");
  const detailDataElement = document.getElementById(
    "react-listing-detail-data",
  );

  if (!window.React || !window.ReactDOM) {
    return;
  }

  const {
    createElement: h,
    useEffect,
    useMemo,
    useState,
    useRef,
    Fragment,
  } = window.React;
  const { createRoot } = window.ReactDOM;

  const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileLayerOptions = {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  };

  const parseData = (element) => {
    if (!element) {
      return null;
    }
    try {
      return JSON.parse(element.textContent);
    } catch (error) {
      return null;
    }
  };

  const formatPrice = (value) =>
    value == null
      ? "Price on request"
      : `₹${Number(value).toLocaleString("en-IN")}`;

  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("compass-theme");
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const themeLabel = (theme) => (theme === "dark" ? "Light mode" : "Dark mode");

  const buildQueryText = (listing) => {
    return [
      listing.title,
      listing.location,
      listing.country,
      String(listing.price),
      String(listing.guests),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  };

  const sortListings = (listings, sortKey) => {
    return [...listings].sort((a, b) => {
      if (sortKey === "price_asc") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortKey === "price_desc") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortKey === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });
  };

  const ListingCard = ({ listing, currUser, onToggleFavorite }) => {
    const handleFavoriteClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite(listing.id);
    };

    return h(
      "div",
      { className: "col listing-result" },
      h(
        "div",
        { className: "card listing-card h-100 position-relative" },
        currUser &&
          h(
            "button",
            {
              className: `favorite-btn ${listing.isFavorite ? "is-favorite" : ""}`,
              onClick: handleFavoriteClick,
              "aria-label": listing.isFavorite
                ? "Remove from favorites"
                : "Save to favorites",
              style: {
                position: "absolute",
                top: "0.8rem",
                right: "0.8rem",
                zIndex: 10,
              },
            },
            h("i", {
              className: `${listing.isFavorite ? "fa-solid" : "fa-regular"} fa-heart`,
            }),
          ),
        h(
          "a",
          { href: listing.href, className: "listing-link" },
          h(
            "div",
            { className: "card-img-wrapper" },
            h("img", {
              src:
                listing.imageUrl ||
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
              className: "card-img-top",
              alt: listing.title,
            }),
            h("div", { className: "card-img-overlay" }),
          ),
          h(
            "div",
            { className: "card-body" },
            h(
              "div",
              { className: "card-meta" },
              h("span", { className: "listing-card-title" }, listing.title),
              listing.averageRating &&
                h(
                  "span",
                  { className: "listing-rating" },
                  h("i", { className: "fa-solid fa-star" }),
                  ` ${listing.averageRating}`,
                ),
            ),
            h(
              "p",
              { className: "listing-meta" },
              `${listing.location}, ${listing.country}`,
            ),
            h(
              "p",
              { className: "listing-meta" },
              `${listing.guests} guests · ${listing.bedrooms} beds · ${listing.bathrooms} baths`,
            ),
            h(
              "div",
              { className: "listing-card-footer" },
              h(
                "span",
                { className: "listing-price" },
                formatPrice(listing.price),
              ),
              h("span", { className: "listing-price-suffix" }, "/night"),
            ),
          ),
        ),
      ),
    );
  };

  const ExploreApp = ({ data }) => {
    const [theme, setTheme] = useState(getInitialTheme);
    const [listings, setListings] = useState(data.listings || []);
    const [query, setQuery] = useState(data.initialSearch || "");
    const [selectedFilter, setSelectedFilter] = useState(
      data.selectedFilter || "trending",
    );
    const [sortKey, setSortKey] = useState(data.selectedSort || "newest");
    const [minPrice, setMinPrice] = useState(data.minPrice || "");
    const [maxPrice, setMaxPrice] = useState(data.maxPrice || "");
    const [selectedGuests, setSelectedGuests] = useState(
      data.selectedGuests || "",
    );
    const [favoritesOnly, setFavoritesOnly] = useState(
      data.favoritesOnly || false,
    );
    const [myListingsOnly, setMyListingsOnly] = useState(
      data.myListingsOnly || false,
    );

    const handleToggleFavorite = async (listingId) => {
      const previousListings = listings;
      setListings(
        listings.map((l) => {
          if (l.id === listingId) {
            return { ...l, isFavorite: !l.isFavorite };
          }
          return l;
        }),
      );

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      try {
        const response = await fetch(`/listings/${listingId}/favorite?_csrf=${encodeURIComponent(csrfToken || "")}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (result.success) {
          setListings(
            listings.map((l) => {
              if (l.id === listingId) {
                return { ...l, isFavorite: result.isFavorite };
              }
              return l;
            }),
          );
        } else {
          setListings(previousListings);
        }
      } catch (err) {
        setListings(previousListings);
        alert("Failed to update favorites");
      }
    };

    const visibleListings = useMemo(() => {
      return listings
        .filter((listing) => {
          if (selectedFilter !== "trending") {
            return listing.filters?.includes(selectedFilter);
          }
          return true;
        })
        .filter((listing) => {
          const haystack = buildQueryText(listing);
          return query ? haystack.includes(query.toLowerCase()) : true;
        })
        .filter((listing) => {
          const minMatch = minPrice
            ? Number(listing.price) >= Number(minPrice)
            : true;
          const maxMatch = maxPrice
            ? Number(listing.price) <= Number(maxPrice)
            : true;
          const guestMatch = selectedGuests
            ? Number(listing.guests) >= Number(selectedGuests)
            : true;
          const favMatch = favoritesOnly ? listing.isFavorite : true;
          const myMatch = myListingsOnly
            ? data.currUser && listing.ownerId === data.currUser.id
            : true;
          return minMatch && maxMatch && guestMatch && favMatch && myMatch;
        });
    }, [
      listings,
      query,
      selectedFilter,
      minPrice,
      maxPrice,
      selectedGuests,
      favoritesOnly,
      myListingsOnly,
    ]);

    const sortedListings = useMemo(
      () => sortListings(visibleListings, sortKey),
      [visibleListings, sortKey],
    );

    useEffect(() => {
      document.body.dataset.theme = theme;
      document.body.classList.add("js-enabled");
      localStorage.setItem("compass-theme", theme);
    }, [theme]);

    return h(
      "section",
      { className: "react-explore-shell" },
      h(
        "div",
        { className: "react-hero" },
        h(
          "div",
          { className: "hero-copy" },
          h("p", { className: "filters-kicker mb-1" }, "Discover stays"),
          h("h1", { className: "hero-title" }, "Compass"),
          h("p", { className: "hero-subtitle" }, "A modern travel marketplace"),
        ),
        h(
          "div",
          { className: "hero-actions" },
          h(
            "button",
            {
              type: "button",
              className: "btn btn-theme-toggle",
              onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
              "aria-label": "Toggle theme",
            },
            h(
              "span",
              { className: "theme-icon" },
              theme === "dark" ? "☀️" : "🌙",
            ),
            h("span", { className: "theme-label" }, themeLabel(theme)),
          ),
        ),
      ),
      h(
        "section",
        { className: "react-command-bar" },
        h(
          "div",
          { className: "react-command-main" },
          h(
            "div",
            { className: "react-command-title" },
            h("span", null, `${sortedListings.length} stays`),
            h("strong", null, "Instant discovery"),
          ),
          h("input", {
            type: "search",
            value: query,
            placeholder: "Search stays by title, location, country, or price",
            "aria-label": "Search stays",
            onChange: (event) => setQuery(event.target.value),
          }),
        ),
        h(
          "div",
          { className: "react-command-actions" },
          h(
            "button",
            {
              type: "button",
              className: favoritesOnly
                ? "active btn btn-outline-dark"
                : "btn btn-outline-dark",
              onClick: () => setFavoritesOnly(!favoritesOnly),
            },
            favoritesOnly ? "Favorites" : "Show favorites",
          ),
          data.currUser &&
            h(
              "button",
              {
                type: "button",
                className: myListingsOnly
                  ? "active btn btn-outline-dark ms-2"
                  : "btn btn-outline-dark ms-2",
                onClick: () => setMyListingsOnly(!myListingsOnly),
              },
              myListingsOnly ? "My stays" : "Show my stays",
            ),
          h(
            "select",
            {
              value: sortKey,
              onChange: (event) => setSortKey(event.target.value),
            },
            h("option", { value: "newest" }, "Newest"),
            h("option", { value: "price_asc" }, "Price low to high"),
            h("option", { value: "price_desc" }, "Price high to low"),
            h("option", { value: "title" }, "Title"),
          ),
        ),
      ),
      h(
        "div",
        { className: "react-filter-bar" },
        data.filters.map((filter) =>
          h(
            "button",
            {
              key: filter.key,
              type: "button",
              className:
                filter.key === selectedFilter
                  ? "filter-chip active"
                  : "filter-chip",
              onClick: () => setSelectedFilter(filter.key),
            },
            h("i", { className: filter.icon }),
            h("span", null, filter.label),
          ),
        ),
      ),
      h(
        "div",
        { className: "react-summary-bar" },
        h(
          "p",
          null,
          h("strong", null, sortedListings.length),
          " stays match your search",
        ),
        h(
          "div",
          { className: "filter-chips-inline" },
          h(
            "span",
            { className: "summary-pill" },
            selectedFilter === "trending" ? "Trending" : selectedFilter,
          ),
          h(
            "span",
            { className: "summary-pill" },
            favoritesOnly ? "Favorites" : "All stays",
          ),
          myListingsOnly &&
            h("span", { className: "summary-pill" }, "My stays"),
        ),
      ),
      h(
        "div",
        {
          id: "react-listing-results",
          className: "row row-cols-lg-3 row-cols-md-2 row-cols-sm-1 g-4",
        },
        sortedListings.map((listing) =>
          h(ListingCard, {
            key: listing.id,
            listing,
            currUser: data.currUser,
            onToggleFavorite: handleToggleFavorite,
          }),
        ),
      ),
      sortedListings.length === 0 &&
        h(
          "section",
          { className: "empty-state" },
          h("p", { className: "empty-state-eyebrow" }, "No matches"),
          h("h4", null, "No listings match the current filters."),
          h(
            "button",
            {
              type: "button",
              className: "btn btn-dark mt-2",
              onClick: () => {
                setQuery("");
                setSelectedFilter("trending");
                setSortKey("newest");
                setMinPrice("");
                setMaxPrice("");
                setSelectedGuests("");
                setFavoritesOnly(false);
                setMyListingsOnly(false);
              },
            },
            "Reset filters",
          ),
        ),
    );
  };

  const ListingDetailApp = ({ data }) => {
    const [showTax, setShowTax] = useState(false);
    const [isFavorite, setIsFavorite] = useState(data.isFavorite || false);
    const [reviews, setReviews] = useState(data.reviews || []);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
      document.body.classList.add("js-enabled");
    }, []);

    // Map initialization
    useEffect(() => {
      if (
        data.geometry &&
        data.geometry.coordinates &&
        data.geometry.coordinates.length === 2 &&
        mapRef.current
      ) {
        const [lng, lat] = data.geometry.coordinates;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        if (typeof L !== "undefined") {
          const map = L.map(mapRef.current).setView([lat, lng], 12);
          L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(
              `<strong>${data.title}</strong><br>${data.location}, ${data.country}`,
            );

          mapInstanceRef.current = map;
        }
      }
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [data]);

    const toggleFavorite = async () => {
      const prev = isFavorite;
      setIsFavorite(!isFavorite);
      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      try {
        const response = await fetch(`/listings/${data.id}/favorite?_csrf=${encodeURIComponent(csrfToken || "")}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "X-CSRF-Token": csrfToken,
          },
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (result.success) {
          setIsFavorite(result.isFavorite);
        } else {
          setIsFavorite(prev);
        }
      } catch (err) {
        setIsFavorite(prev);
        alert("Failed to update favorites");
      }
    };

    const handleReviewSubmit = async (e) => {
      e.preventDefault();
      if (!comment.trim()) return;

      setIsSubmitting(true);
      setSubmitError("");

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      try {
        const response = await fetch(`/listings/${data.id}/reviews?_csrf=${encodeURIComponent(csrfToken || "")}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            review: { rating, comment },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit review");
        }

        const result = await response.json();
        if (result.success) {
          setReviews([...reviews, result.review]);
          setComment("");
          setRating(5);
        }
      } catch (err) {
        setSubmitError("Failed to submit review. Make sure you are logged in.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReviewDelete = async (reviewId) => {
      const prevReviews = [...reviews];
      setReviews(reviews.filter((r) => r.id !== reviewId));

      const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
      try {
        const response = await fetch(
          `/listings/${data.id}/reviews/${reviewId}?_method=DELETE&_csrf=${encodeURIComponent(csrfToken || "")}`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "X-CSRF-Token": csrfToken,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete review");
        }

        const result = await response.json();
        if (!result.success) {
          setReviews(prevReviews);
        }
      } catch (err) {
        setReviews(prevReviews);
        alert("Failed to delete review");
      }
    };

    const isOwner =
      data.currUser && data.owner && data.currUser.id === data.owner.id;
    const averageRating = useMemo(() => {
      if (reviews.length === 0) return null;
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      return Number((total / reviews.length).toFixed(1));
    }, [reviews]);

    return h(
      "section",
      { className: "react-detail-card" },
      h(
        "div",
        { className: "detail-head" },
        h(
          "div",
          { className: "detail-copy" },
          h("p", { className: "filters-kicker mb-1" }, data.category),
          h("h1", { className: "detail-title" }, data.title),
          h(
            "p",
            { className: "listing-meta" },
            `${data.location}, ${data.country}`,
            averageRating
              ? ` · ★ ${averageRating} (${reviews.length} reviews)`
              : "",
          ),
        ),
        h(
          "div",
          { className: "detail-actions" },
          data.currUser &&
            h(
              "button",
              {
                className: `btn ${isFavorite ? "btn-dark" : "btn-outline-dark"}`,
                onClick: toggleFavorite,
              },
              h("i", {
                className: `${isFavorite ? "fa-solid" : "fa-regular"} fa-heart`,
              }),
              isFavorite ? " Saved" : " Save",
            ),
          h(
            "button",
            {
              type: "button",
              className: "btn btn-outline-dark",
              onClick: () => setShowTax(!showTax),
            },
            showTax ? "Hide tax" : "Show tax",
          ),
        ),
      ),
      h(
        "div",
        { className: "detail-grid" },
        h("img", {
          className: "detail-image",
          src:
            data.imageUrl ||
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
          alt: data.title,
        }),
        h(
          "div",
          { className: "detail-info" },
          h(
            "p",
            { className: "card-text mb-2" },
            "Owned by ",
            h("i", null, data.ownerName),
          ),
          h("p", { className: "listing-description" }, data.description),
          h(
            "div",
            { className: "show-facts" },
            h(
              "span",
              null,
              h("i", { className: "fa-solid fa-indian-rupee-sign" }),
              ` ${showTax ? formatPrice(Math.round(data.price * 1.18)) : formatPrice(data.price)} / night`,
            ),
            h(
              "span",
              null,
              h("i", { className: "fa-solid fa-user-group" }),
              ` ${data.guests} guests`,
            ),
            h(
              "span",
              null,
              h("i", { className: "fa-solid fa-bed" }),
              ` ${data.bedrooms} bedrooms`,
            ),
            h(
              "span",
              null,
              h("i", { className: "fa-solid fa-bath" }),
              ` ${data.bathrooms} baths`,
            ),
          ),
          data.amenities.length > 0 &&
            h(
              "div",
              { className: "amenities-list detail-amenities" },
              data.amenities.map((amenity) =>
                h(
                  "span",
                  { key: amenity },
                  h("i", { className: "fa-solid fa-check" }),
                  ` ${amenity}`,
                ),
              ),
            ),
        ),
      ),

      // Map block
      data.geometry &&
        data.geometry.coordinates &&
        data.geometry.coordinates.length === 2 &&
        h(
          "div",
          { className: "mt-4" },
          h("h4", null, "Where you'll be"),
          h("div", {
            id: "listing-map-react",
            className: "listing-map",
            ref: mapRef,
          }),
          h(
            "a",
            {
              href: `https://www.openstreetmap.org/?mlat=${data.geometry.coordinates[1]}&mlon=${data.geometry.coordinates[0]}#map=12/${data.geometry.coordinates[1]}/${data.geometry.coordinates[0]}`,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-outline-dark btn-sm mt-3",
            },
            "Open in OpenStreetMap",
          ),
        ),

      // Owner Action block
      isOwner &&
        h(
          "div",
          { className: "btns owner-actions mt-3" },
          h(
            "a",
            {
              href: `/listings/${data.id}/edit`,
              className: "btn btn-dark edit-btn",
            },
            "Edit",
          ),
          h(
            "form",
            {
              method: "post",
              action: `/listings/${data.id}?_method=DELETE&_csrf=${encodeURIComponent(
                document
                  .querySelector('meta[name="csrf-token"]')
                  ?.getAttribute("content") || "",
              )}`,
              onSubmit: (e) => {
                if (!confirm("Are you sure you want to delete this listing?")) {
                  e.preventDefault();
                }
              },
            },
            h("input", {
              type: "hidden",
              name: "_csrf",
              value: document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content"),
            }),
            h("button", { className: "btn btn-outline-danger" }, "Delete"),
          ),
        ),

      // Review Section
      h(
        "div",
        { className: "review-shell mb-3" },
        h("hr"),
        data.currUser &&
          h(
            Fragment,
            null,
            h("h4", null, "Leave a Review"),
            h(
              "form",
              { onSubmit: handleReviewSubmit, className: "needs-validation" },
              h(
                "div",
                { className: "mb-3 mt-3" },
                h("label", { className: "form-label" }, "Rating"),
                h(
                  "fieldset",
                  { className: "starability-slot" },
                  h("input", {
                    type: "radio",
                    id: "no-rate",
                    className: "input-no-rate",
                    name: "review[rating]",
                    value: "0",
                    checked: rating === 0,
                    onChange: () => setRating(0),
                    "aria-label": "No rating.",
                  }),
                  [1, 2, 3, 4, 5].map((num) =>
                    h(
                      Fragment,
                      { key: num },
                      h("input", {
                        type: "radio",
                        id: `first-rate${num}`,
                        name: "review[rating]",
                        value: String(num),
                        checked: rating === num,
                        onChange: () => setRating(num),
                      }),
                      h(
                        "label",
                        {
                          htmlFor: `first-rate${num}`,
                          title: [
                            "Terrible",
                            "Not good",
                            "Average",
                            "Very good",
                            "Amazing",
                          ][num - 1],
                        },
                        `${num} stars`,
                      ),
                    ),
                  ),
                ),
              ),
              h(
                "div",
                { className: "mb-3 mt-3" },
                h(
                  "label",
                  { htmlFor: "comment-react", className: "form-label d-block" },
                  "Comments",
                ),
                h("textarea", {
                  id: "comment-react",
                  rows: 5,
                  className: "form-control",
                  value: comment,
                  required: true,
                  onChange: (e) => setComment(e.target.value),
                }),
              ),
              submitError && h("p", { className: "text-danger" }, submitError),
              h(
                "button",
                { className: "btn btn-dark", disabled: isSubmitting },
                isSubmitting ? "Submitting..." : "Submit",
              ),
            ),
          ),
        h("hr"),
        h("p", null, h("b", null, "All Reviews")),
        reviews.length === 0 &&
          h("p", { className: "listing-meta" }, "No reviews yet."),
        h(
          "div",
          { className: "row" },
          reviews.map((review) =>
            h(
              "div",
              { className: "col-md-6 mb-3", key: review.id },
              h(
                "div",
                { className: "card h-100" },
                h(
                  "div",
                  { className: "card-body" },
                  h(
                    "h5",
                    { className: "card-title" },
                    `@${review.author.username}`,
                  ),
                  h("p", {
                    className: "starability-result card-text",
                    "data-rating": review.rating,
                  }),
                  h("p", { className: "card-text" }, review.comment),
                  data.currUser &&
                    data.currUser.id === review.author.id &&
                    h(
                      "button",
                      {
                        className: "btn btn-sm btn-dark mt-2",
                        onClick: () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this review?",
                            )
                          ) {
                            handleReviewDelete(review.id);
                          }
                        },
                      },
                      "Delete",
                    ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  };

  if (rootElement && listDataElement) {
    const listData = parseData(listDataElement);
    if (listData) {
      createRoot(rootElement).render(h(ExploreApp, { data: listData }));
    }
  }

  if (detailRootElement && detailDataElement) {
    const detailData = parseData(detailDataElement);
    if (detailData) {
      createRoot(detailRootElement).render(
        h(ListingDetailApp, { data: detailData }),
      );
    }
  }
})();
