package com.bolofluent.offline

import android.app.ActivityManager
import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

class BoloOfflineModule : Module() {
  private var tts: TextToSpeech? = null
  private val ttsLock = Mutex()
  private val context: Context get() = requireNotNull(appContext.reactContext)

  private suspend fun voiceEngine(): TextToSpeech = withContext(Dispatchers.Main) {
    ttsLock.withLock {
      tts?.let { return@withLock it }
      val ready = CompletableDeferred<Int>()
      val engine = TextToSpeech(context) { status -> ready.complete(status) }
      try {
        require(withTimeout(10000) { ready.await() } == TextToSpeech.SUCCESS) { "Offline voice service could not start." }
        tts = engine
        engine
      } catch (e: Exception) { engine.shutdown(); throw e }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("BoloOffline")
    Function("hasSherpa") { SpeechEngine.available }
    AsyncFunction("memory") {
      val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val memory = ActivityManager.MemoryInfo().also { manager.getMemoryInfo(it) }
      mapOf("total" to memory.totalMem.toDouble(), "available" to memory.availMem.toDouble(), "lowMemory" to memory.lowMemory)
    }
    AsyncFunction("prepareModels") Coroutine { manifest: String ->
      withContext(Dispatchers.IO) { ModelStore.prepare(context, manifest) }
    }
    AsyncFunction("transcribe") Coroutine { path: String, config: Map<String,String>, language: String ->
      withContext(Dispatchers.IO) {
        require(language in listOf("en", "hi")) { "Unsupported language" }
        SpeechEngine.transcribe(context, path, config, language)
      }
    }
    AsyncFunction("voices") Coroutine { ->
      try {
        val engine = voiceEngine()
        engine.voices.orEmpty().filter { !it.isNetworkConnectionRequired && it.locale.language in listOf("en", "hi") && !it.features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) }
          .map { mapOf("name" to it.name, "language" to it.locale.language) }
      } catch (e: Exception) { emptyList<Map<String,String>>() }
    }
    AsyncFunction("speak") Coroutine { text: String, language: String, speed: Double ->
      require(text.length <= 4000) { "The text is too long to speak at once." }
      val engine = voiceEngine()
      withContext(Dispatchers.Main) {
        val voice = engine.voices.orEmpty().firstOrNull { !it.isNetworkConnectionRequired && it.locale.language == language && !it.features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) }
          ?: throw IllegalStateException("An offline ${if(language == "hi") "Hindi" else "English"} voice is not installed on this device. Install a local voice in Android’s text-to-speech settings.")
        engine.voice = voice
        engine.setSpeechRate(speed.coerceIn(0.5, 1.5).toFloat())
        val finished = CompletableDeferred<Unit>()
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
          override fun onStart(id: String?) {}
          override fun onDone(id: String?) { finished.complete(Unit) }
          @Deprecated("Android callback") override fun onError(id: String?) { finished.completeExceptionally(IllegalStateException("Offline voice playback failed.")) }
          override fun onStop(id: String?, interrupted: Boolean) { finished.complete(Unit) }
        })
        require(engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bolofluent") == TextToSpeech.SUCCESS) { "Could not play the offline voice." }
        try { withTimeout(120000) { finished.await() } } finally { engine.stop() }
      }
    }
    AsyncFunction("stop") Coroutine { -> withContext(Dispatchers.Main) { tts?.stop(); Unit } }
    OnDestroy { tts?.stop(); tts?.shutdown(); tts = null }
  }
}
