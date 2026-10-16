/**
 * svg.js — a tiny helper for creating SVG elements without a library.
 */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Creates an SVG element with the given attributes and optional text.
 * @example createSvgElement('rect', { width: 10, height: 10, fill: 'red' })
 */
export function createSvgElement(tagName, attributes = {}, textContent) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  if (textContent !== undefined) element.textContent = textContent;
  return element;
}
