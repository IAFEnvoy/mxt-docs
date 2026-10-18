// The fixed text in a tool's markup is written in English; a locale's `labels` maps those strings to its own. Only the
// text node is rewritten, so indentation and the elements around it stay as they are, and a string with no entry is left
// in English rather than blanked.
export function applyLabels(root, labels) {
  if (!labels || !Object.keys(labels).length) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const text = node.nodeValue.trim()
    if (labels[text]) node.nodeValue = node.nodeValue.replace(text, labels[text])
  }
}
