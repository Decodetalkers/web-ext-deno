// source/content_script.ts
globalThis.alert("Running Sample Browser Extension");
document.body.style.border = "5px solid red";
Array.prototype.forEach.call(
  document.getElementsByTagName("*"),
  replaceNode
);
function replaceNode(element) {
  const stack = [element];
  const textNodes = [];
  let el = stack.pop();
  while (el) {
    Array.prototype.forEach.call(el.childNodes, (n) => {
      const { nodeName, nodeType } = n;
      const parentNodeName = n?.parentNode?.nodeName;
      if (nodeName === "INPUT" || nodeName === "TEXTAREA" || parentNodeName === "INPUT" || parentNodeName == "TEXTAREA") {
        return;
      } else if (nodeType === 1) stack.push(n);
      else if (nodeType === 3) textNodes.push(n);
    });
    el = stack.pop();
  }
  textNodes.forEach((textNode) => {
    if (textNode?.parentNode && textNode?.nodeValue) {
      textNode.parentNode.replaceChild(
        document.createTextNode(
          textNode.nodeValue.replace(/data/g, "daddy").replace(/Data/g, "Daddy")
        ),
        textNode
      );
    }
  });
}
document.addEventListener("selectionchange", async () => {
  const selection = globalThis.getSelection()?.toString();
  if (selection) {
    console.log(selection);
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    const search = new URLSearchParams();
    search.append("client", "gtx");
    search.append("ie", "UTF-8");
    search.append("oe", "UTF-8");
    search.append("dt", "t");
    search.append("sl", "auto");
    search.append("tl", "zh");
    search.append("q", selection);
    url.search = search.toString();
    const response = await fetch(url);
    console.log(response.status);
    console.log(response.statusText);
    const jsonData = await response.json();
    console.log(jsonData);
  }
});
