export function discardRecording(uri: string) {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}
export function purgeRecordings() {
  /* Browser blobs expire with the document. */
}
