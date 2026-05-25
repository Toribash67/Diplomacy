const defaultOptions = {
  maxZoom: 4.5,
  clickMoveThreshold: 6,
  wheelZoomSensitivity: 0.002,
};

export function initializeMapViewport({
  board,
  resetButton,
  mapSize,
  maxZoom = defaultOptions.maxZoom,
  clickMoveThreshold = defaultOptions.clickMoveThreshold,
  wheelZoomSensitivity = defaultOptions.wheelZoomSensitivity,
}) {
  const minimumViewBox = {
    width: mapSize.width / maxZoom,
    height: mapSize.height / maxZoom,
  };
  let viewBox = fullViewBox(mapSize);
  let activePointers = new Map();
  let interactionDistance = 0;
  let gestureActive = false;
  let suppressNextClick = false;

  applyViewBox();

  board.addEventListener("pointerdown", onPointerDown);
  board.addEventListener("pointermove", onPointerMove);
  board.addEventListener("pointerup", onPointerEnd);
  board.addEventListener("pointercancel", onPointerEnd);
  board.addEventListener("click", onClickCapture, true);
  board.addEventListener("dblclick", onDoubleClick);
  board.addEventListener("wheel", onWheel, { passive: false });
  resetButton?.addEventListener("click", reset);

  return {
    applyViewBox,
    reset,
  };

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointers.set(event.pointerId, pointerPosition(event));
    interactionDistance = 0;
    suppressNextClick = false;
  }

  function onPointerMove(event) {
    const pointer = activePointers.get(event.pointerId);
    if (!pointer) {
      return;
    }

    const previousMetrics = pinchMetrics();
    const previousPosition = { x: pointer.x, y: pointer.y };
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    interactionDistance += distance(previousPosition, pointer);

    if (interactionDistance > clickMoveThreshold) {
      suppressNextClick = true;
    }

    if (activePointers.size >= 2) {
      activateGesture();
      suppressNextClick = true;
      const nextMetrics = pinchMetrics();
      if (previousMetrics && nextMetrics && previousMetrics.distance > 0) {
        const anchor = pointForClientPosition(nextMetrics.center);
        zoomTo(currentZoom() * (nextMetrics.distance / previousMetrics.distance), anchor);
        panBetweenClientPositions(previousMetrics.center, nextMetrics.center);
      }
    } else if (isZoomed() && (gestureActive || interactionDistance > clickMoveThreshold)) {
      activateGesture();
      panBetweenClientPositions(previousPosition, pointer);
    } else {
      return;
    }

    event.preventDefault();
  }

  function onPointerEnd(event) {
    activePointers.delete(event.pointerId);
    releasePointer(event.pointerId);
    if (activePointers.size === 0) {
      gestureActive = false;
      board.classList.remove("map-panning");
    }
  }

  function onClickCapture(event) {
    if (!suppressNextClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClick = false;
  }

  function onDoubleClick(event) {
    const anchor = pointForClientPosition(pointerPosition(event));
    const nextZoom = isZoomed() ? 1 : 2.2;
    zoomTo(nextZoom, anchor);
    event.preventDefault();
  }

  function onWheel(event) {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    const anchor = pointForClientPosition(pointerPosition(event));
    const zoomFactor = Math.exp(-event.deltaY * wheelZoomSensitivity);
    zoomTo(currentZoom() * zoomFactor, anchor);
    event.preventDefault();
  }

  function reset() {
    setViewBox(fullViewBox(mapSize));
    gestureActive = false;
    suppressNextClick = false;
    board.classList.remove("map-panning");
  }

  function zoomTo(zoom, anchor = centerOf(viewBox)) {
    const nextZoom = clamp(zoom, 1, maxZoom);
    const nextWidth = mapSize.width / nextZoom;
    const nextHeight = mapSize.height / nextZoom;
    const xRatio = (anchor.x - viewBox.x) / viewBox.width;
    const yRatio = (anchor.y - viewBox.y) / viewBox.height;

    setViewBox({
      x: anchor.x - xRatio * nextWidth,
      y: anchor.y - yRatio * nextHeight,
      width: nextWidth,
      height: nextHeight,
    });
  }

  function panBetweenClientPositions(from, to) {
    const fromPoint = pointForClientPosition(from);
    const toPoint = pointForClientPosition(to);
    setViewBox({
      ...viewBox,
      x: viewBox.x + fromPoint.x - toPoint.x,
      y: viewBox.y + fromPoint.y - toPoint.y,
    });
  }

  function setViewBox(candidate) {
    viewBox = clampViewBox(candidate);
    applyViewBox();
  }

  function applyViewBox() {
    board.setAttribute(
      "viewBox",
      `${formatNumber(viewBox.x)} ${formatNumber(viewBox.y)} ${formatNumber(viewBox.width)} ${formatNumber(viewBox.height)}`,
    );
    board.classList.toggle("map-zoomed", isZoomed());
    if (resetButton) {
      resetButton.hidden = !isZoomed();
    }
  }

  function clampViewBox(candidate) {
    const width = clamp(candidate.width, minimumViewBox.width, mapSize.width);
    const height = clamp(candidate.height, minimumViewBox.height, mapSize.height);
    return {
      x: clamp(candidate.x, 0, mapSize.width - width),
      y: clamp(candidate.y, 0, mapSize.height - height),
      width,
      height,
    };
  }

  function pointForClientPosition(position) {
    const svgPoint = board.createSVGPoint();
    svgPoint.x = position.x;
    svgPoint.y = position.y;
    return svgPoint.matrixTransform(board.getScreenCTM().inverse());
  }

  function currentZoom() {
    return mapSize.width / viewBox.width;
  }

  function isZoomed() {
    return currentZoom() > 1.01;
  }

  function pinchMetrics() {
    if (activePointers.size < 2) {
      return undefined;
    }

    const [first, second] = [...activePointers.values()];
    return {
      center: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
      distance: distance(first, second),
    };
  }

  function activateGesture() {
    if (gestureActive) {
      return;
    }

    gestureActive = true;
    board.classList.add("map-panning");
    for (const pointerId of activePointers.keys()) {
      capturePointer(pointerId);
    }
  }

  function capturePointer(pointerId) {
    try {
      board.setPointerCapture?.(pointerId);
    } catch {
      // Some browsers reject capture if the pointer has already ended.
    }
  }

  function releasePointer(pointerId) {
    try {
      board.releasePointerCapture?.(pointerId);
    } catch {
      // Releasing an uncaptured pointer is harmless.
    }
  }
}

function fullViewBox(mapSize) {
  return {
    x: 0,
    y: 0,
    width: mapSize.width,
    height: mapSize.height,
  };
}

function centerOf(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function pointerPosition(event) {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatNumber(value) {
  return String(Math.round(value * 100) / 100);
}
