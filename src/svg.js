const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** Create an SVG element with attributes and optional text. */
export function createSvgElement(tagName, attributes = {}, textContent) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}
