package com.bolofluent.offline

import android.content.Context
import android.net.Uri
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.OfflineModelConfig
import com.k2fsa.sherpa.onnx.OfflineRecognizer
import com.k2fsa.sherpa.onnx.OfflineRecognizerConfig
import com.k2fsa.sherpa.onnx.OfflineWhisperModelConfig
import java.io.File

object SpeechEngine {
  val available = true
  @Synchronized fun transcribe(context: Context, path: String, config: Map<String,String>, language: String): Map<String,Any> {
    val root = File(context.filesDir, "models").canonicalPath + File.separator
    fun checked(key: String): String {
      val file = File(requireNotNull(config[key]) { "Missing $key in ASR configuration" })
      require(file.isFile && file.canonicalPath.startsWith(root)) { "Model is not in verified private storage" }
      return file.absolutePath
    }
    val recognizer = OfflineRecognizer(config = OfflineRecognizerConfig(
      featConfig = FeatureConfig(sampleRate = 16000, featureDim = 80),
      modelConfig = OfflineModelConfig(
        whisper = OfflineWhisperModelConfig(encoder = checked("encoder"), decoder = checked("decoder"), language = language, task = "transcribe"),
        tokens = checked("tokens"), numThreads = 2, provider = "cpu", modelType = "whisper"
      )
    ))
    try {
      val audio = AudioDecoder.decode(context, Uri.parse(path))
      val stream = recognizer.createStream()
      try {
        stream.acceptWaveform(audio.second, audio.first)
        recognizer.decode(stream)
        return mapOf("text" to recognizer.getResult(stream).text, "language" to language, "durationMs" to (audio.second.size * 1000L / audio.first))
      } finally { stream.release() }
    } finally { recognizer.release() }
  }
}
