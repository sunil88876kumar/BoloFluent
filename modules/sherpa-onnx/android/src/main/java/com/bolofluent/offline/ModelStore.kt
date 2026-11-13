package com.bolofluent.offline

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

object ModelStore {
  private fun checksum(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input -> val buffer = ByteArray(1024 * 1024); while (true) { val size = input.read(buffer); if (size < 0) break; digest.update(buffer, 0, size) } }
    return digest.digest().joinToString("") { "%02x".format(it) }
  }
  @Synchronized fun prepare(context: Context, manifest: String): Map<String,String> {
    val root = File(context.filesDir, "models").apply { mkdirs() }
    val models = JSONObject(manifest).getJSONArray("models")
    val result = mutableMapOf<String,String>()
    for (i in 0 until models.length()) {
      val files = models.getJSONObject(i).getJSONArray("files")
      for (j in 0 until files.length()) {
        val entry = files.getJSONObject(j)
        val path = entry.getString("path")
        require(path.matches(Regex("[A-Za-z0-9_./-]+")) && !path.split('/').contains("..") && !path.startsWith('/')) { "Invalid model path" }
        val hash = entry.getString("sha256")
        require(hash.matches(Regex("[a-f0-9]{64}"))) { "Missing model checksum" }
        val destination = File(root, path)
        require(destination.canonicalPath.startsWith(root.canonicalPath + File.separator))
        if (!destination.isFile || checksum(destination) != hash) {
          destination.parentFile?.mkdirs()
          val temp = File(destination.path + ".partial")
          try {
            context.assets.open("models/$path").use { input -> temp.outputStream().use { output -> input.copyTo(output) } }
            require(checksum(temp) == hash) { "Model integrity check failed: $path" }
            check(temp.renameTo(destination)) { "Could not install model: $path" }
          } finally { temp.delete() }
        }
        result[path] = destination.absolutePath
      }
    }
    return result
  }
}
