export function arrowGeometry(points, shaftShortening) {
  const uniquePoints = uniqueArrowPoints(points);
  if (uniquePoints.length < 2) {
    return undefined;
  }

  const end = uniquePoints[uniquePoints.length - 1];
  const previous = uniquePoints[uniquePoints.length - 2];
  const finalSegmentLength = distance(previous, end);
  if (finalSegmentLength <= 1) {
    return undefined;
  }

  const shortening = Math.min(shaftShortening, finalSegmentLength * 0.45);
  const finalSegmentX = (end[0] - previous[0]) / finalSegmentLength;
  const finalSegmentY = (end[1] - previous[1]) / finalSegmentLength;
  const headBase = [
    end[0] - finalSegmentX * shortening,
    end[1] - finalSegmentY * shortening,
  ];
  const shaftPath = arrowPath([...uniquePoints.slice(0, -1), headBase]);
  const markerPath = arrowPath([headBase, end]);

  return shaftPath && markerPath ? { shaftPath, markerPath } : undefined;
}

function arrowPath(points) {
  const uniquePoints = uniqueArrowPoints(points);
  if (uniquePoints.length < 2) {
    return undefined;
  }

  return uniquePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${formatCoordinate(point[0])} ${formatCoordinate(point[1])}`)
    .join(" ");
}

function uniqueArrowPoints(points) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || distance(previous, point) > 1;
  });
}

function distance(left, right) {
  return Math.hypot(right[0] - left[0], right[1] - left[1]);
}

function formatCoordinate(value) {
  return Number.parseFloat(value.toFixed(2));
}
