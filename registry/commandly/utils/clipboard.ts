/** Writes `text` to the clipboard, rejecting when the browser refuses access. */
export async function writeClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) throw new Error("Clipboard unavailable");
  await navigator.clipboard.writeText(text);
}
