const defaultOptions = {
  defaultSidePaneWidth: 420,
  minimumBoardPaneWidth: 360,
  sidePaneKeyboardStep: 24,
  stackedLayoutQuery: "(max-width: 720px)",
  storageKey: "diplomacy.sidePaneWidth",
};

export function initializePaneResizer(options) {
  const {
    appShell,
    sidePane,
    paneResizer,
    defaultSidePaneWidth,
    minimumBoardPaneWidth,
    sidePaneKeyboardStep,
    stackedLayoutQuery,
    storageKey,
  } = { ...defaultOptions, ...options };

  if (!appShell || !sidePane || !paneResizer) {
    return;
  }

  let preferredSidePaneWidth = readStoredSidePaneWidth(storageKey) ?? defaultSidePaneWidth;
  setSidePaneWidth(preferredSidePaneWidth, { persist: false, remember: false });

  let activePointerId = undefined;
  let dragStartX = 0;
  let dragStartWidth = preferredSidePaneWidth;

  paneResizer.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartWidth = currentSidePaneWidth();
    appShell.classList.add("resizing");
    paneResizer.setPointerCapture(activePointerId);
  });

  paneResizer.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    setSidePaneWidth(dragStartWidth - (event.clientX - dragStartX), { persist: false });
  });

  paneResizer.addEventListener("pointerup", finishResize);
  paneResizer.addEventListener("pointercancel", finishResize);
  paneResizer.addEventListener("lostpointercapture", () => {
    if (activePointerId === undefined) {
      return;
    }

    activePointerId = undefined;
    appShell.classList.remove("resizing");
    storeSidePaneWidth(storageKey, preferredSidePaneWidth);
  });

  paneResizer.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? sidePaneKeyboardStep * 3 : sidePaneKeyboardStep;
    const { minWidth, maxWidth } = sidePaneResizeBounds();
    let nextWidth = undefined;

    if (event.key === "ArrowLeft") {
      nextWidth = currentSidePaneWidth() + step;
    } else if (event.key === "ArrowRight") {
      nextWidth = currentSidePaneWidth() - step;
    } else if (event.key === "Home") {
      nextWidth = minWidth;
    } else if (event.key === "End") {
      nextWidth = maxWidth;
    }

    if (nextWidth === undefined) {
      return;
    }

    event.preventDefault();
    setSidePaneWidth(nextWidth);
  });

  paneResizer.addEventListener("dblclick", () => {
    setSidePaneWidth(defaultSidePaneWidth);
  });

  window.addEventListener("resize", () => {
    setSidePaneWidth(preferredSidePaneWidth, { persist: false, remember: false });
  });

  function finishResize(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (paneResizer.hasPointerCapture(event.pointerId)) {
      paneResizer.releasePointerCapture(event.pointerId);
    }

    activePointerId = undefined;
    appShell.classList.remove("resizing");
    storeSidePaneWidth(storageKey, preferredSidePaneWidth);
  }

  function setSidePaneWidth(width, options = {}) {
    const { persist = true, remember = true } = options;
    const { minWidth, maxWidth } = sidePaneResizeBounds();
    const fallbackWidth = Number.isFinite(width) ? width : defaultSidePaneWidth;
    const nextWidth = Math.round(clamp(fallbackWidth, minWidth, maxWidth));

    document.documentElement.style.setProperty("--side-pane-width", `${nextWidth}px`);
    paneResizer.setAttribute("aria-valuemin", String(Math.round(minWidth)));
    paneResizer.setAttribute("aria-valuemax", String(Math.round(maxWidth)));
    paneResizer.setAttribute("aria-valuenow", String(nextWidth));
    paneResizer.setAttribute("aria-valuetext", `${nextWidth}px`);

    if (remember) {
      preferredSidePaneWidth = nextWidth;
    }

    if (persist) {
      storeSidePaneWidth(storageKey, nextWidth);
    }

    return nextWidth;
  }

  function sidePaneResizeBounds() {
    const rootStyles = getComputedStyle(document.documentElement);
    const minWidth = cssPixelValue(rootStyles.getPropertyValue("--side-pane-min-width"), 320);
    const configuredMaxWidth = cssPixelValue(rootStyles.getPropertyValue("--side-pane-max-width"), 760);
    const resizerWidth = paneResizer.getBoundingClientRect().width
      || cssPixelValue(rootStyles.getPropertyValue("--pane-resizer-width"), 10);
    const shellWidth = appShell.getBoundingClientRect().width || window.innerWidth;
    const viewportMaxWidth = shellWidth - resizerWidth - minimumBoardPaneWidth;
    const maxWidth = Math.max(minWidth, Math.min(configuredMaxWidth, viewportMaxWidth));

    return { minWidth, maxWidth };
  }

  function currentSidePaneWidth() {
    const sidePaneWidth = sidePane.getBoundingClientRect().width;
    if (sidePaneWidth > 0 && !window.matchMedia(stackedLayoutQuery).matches) {
      return sidePaneWidth;
    }

    return cssPixelValue(getComputedStyle(document.documentElement).getPropertyValue("--side-pane-width"), preferredSidePaneWidth);
  }
}

function readStoredSidePaneWidth(storageKey) {
  try {
    const width = Number.parseFloat(localStorage.getItem(storageKey));
    return Number.isFinite(width) ? width : undefined;
  } catch {
    return undefined;
  }
}

function storeSidePaneWidth(storageKey, width) {
  try {
    localStorage.setItem(storageKey, String(Math.round(width)));
  } catch {
    // Ignore storage failures; resizing should still work for the current page.
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cssPixelValue(value, fallback) {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : fallback;
}
