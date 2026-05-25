export function svg(tagName, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  return node;
}

export function text(value, attributes = {}) {
  const node = svg("text", attributes);
  node.textContent = value;
  return node;
}

export function option(value, label, selected) {
  const node = element("option", { value, textContent: label });
  node.selected = selected;
  return node;
}

export function emptyOrderField() {
  const node = element("div", { className: "order-field empty", textContent: "N/A" });
  node.setAttribute("aria-hidden", "true");
  return node;
}

export function element(tagName, properties = {}) {
  const node = document.createElement(tagName);
  for (const [name, value] of Object.entries(properties)) {
    if (name === "style") {
      node.setAttribute("style", value);
    } else {
      node[name] = value;
    }
  }
  return node;
}
