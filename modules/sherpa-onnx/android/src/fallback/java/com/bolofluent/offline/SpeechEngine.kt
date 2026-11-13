package com.bolofluent.offline
import android.content.Context

object SpeechEngine {
  val available = false
  fun transcribe(context: Context, path: String, config: Map<String,String>, language: String): Map<String,Any> {
    throw IllegalStateException("Sherpa-ONNX is not included in this development build. Bundle the Sherpa AAR and speech models to enable offline recognition.")
  }
}
