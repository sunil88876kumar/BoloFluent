package com.bolofluent.offline

import android.content.Context
import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import java.nio.ByteOrder

object AudioDecoder {
  fun decode(context: Context, uri: Uri): Pair<Int, FloatArray> {
    require(uri.scheme in listOf("file", "content")) { "Only local recordings are supported" }
    val extractor = MediaExtractor()
    var codec: MediaCodec? = null
    try {
      extractor.setDataSource(context, uri, null)
      val track = (0 until extractor.trackCount).firstOrNull { extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true }
        ?: throw IllegalArgumentException("No audio track found")
      extractor.selectTrack(track)
      val format = extractor.getTrackFormat(track)
      var rate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      var channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      var encoding = AudioFormat.ENCODING_PCM_16BIT
      val decoder = MediaCodec.createDecoderByType(requireNotNull(format.getString(MediaFormat.KEY_MIME)))
      codec = decoder
      decoder.configure(format, null, null, 0)
      decoder.start()
      val chunks = mutableListOf<FloatArray>()
      var count = 0
      var inputEnded = false
      var outputEnded = false
      val info = MediaCodec.BufferInfo()
      val deadline = System.nanoTime() + 120_000_000_000L
      while (!outputEnded) {
        check(System.nanoTime() < deadline) { "Audio decoding timed out" }
        if (!inputEnded) {
          val slot = decoder.dequeueInputBuffer(10000)
          if (slot >= 0) {
            val buffer = requireNotNull(decoder.getInputBuffer(slot))
            val size = extractor.readSampleData(buffer, 0)
            if (size < 0) { decoder.queueInputBuffer(slot, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputEnded = true }
            else { decoder.queueInputBuffer(slot, 0, size, extractor.sampleTime, 0); extractor.advance() }
          }
        }
        val slot = decoder.dequeueOutputBuffer(info, 10000)
        if (slot == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
          rate = decoder.outputFormat.getInteger(MediaFormat.KEY_SAMPLE_RATE)
          channels = decoder.outputFormat.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
          encoding = if (decoder.outputFormat.containsKey(MediaFormat.KEY_PCM_ENCODING)) decoder.outputFormat.getInteger(MediaFormat.KEY_PCM_ENCODING) else AudioFormat.ENCODING_PCM_16BIT
          require(encoding in listOf(AudioFormat.ENCODING_PCM_16BIT, AudioFormat.ENCODING_PCM_FLOAT)) { "Unsupported decoded audio format" }
        } else if (slot >= 0) {
          val buffer = requireNotNull(decoder.getOutputBuffer(slot)).order(ByteOrder.LITTLE_ENDIAN)
          buffer.position(info.offset); buffer.limit(info.offset + info.size)
          val frames = info.size / (if (encoding == AudioFormat.ENCODING_PCM_FLOAT) 4 else 2) / channels
          val samples = FloatArray(frames)
          for (frame in 0 until frames) {
            var sum = 0f
            repeat(channels) { sum += if (encoding == AudioFormat.ENCODING_PCM_FLOAT) buffer.float else buffer.short / 32768f }
            samples[frame] = sum / channels
          }
          chunks.add(samples); count += samples.size
          require(count <= rate * 65) { "Recordings must be at most one minute" }
          outputEnded = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
          decoder.releaseOutputBuffer(slot, false)
        }
      }
      val result = FloatArray(count)
      var offset = 0
      for (chunk in chunks) { chunk.copyInto(result, offset); offset += chunk.size }
      return Pair(rate, result)
    } finally { try { codec?.stop() } catch (_: Exception) {}; codec?.release(); extractor.release() }
  }
}
