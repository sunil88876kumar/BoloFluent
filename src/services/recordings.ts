import { Directory, File, Paths } from "expo-file-system";
export function purgeRecordings() {
  try {
    const directory = new Directory(Paths.cache, "Audio");
    if (directory.exists)
      for (const file of directory.list())
        if (file instanceof File && file.name.startsWith("recording-"))
          file.delete();
  } catch {
    /* Cache cleanup can be retried on the next launch. */
  }
}
export function discardRecording(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    /* The OS may already have removed a temporary file. */
  }
}
