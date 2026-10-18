// Encodes a directory of PNG frames to an H.264 MP4 with AVFoundation.
//
// macOS fallback for scripts/render-demo-video.mjs when the ffmpeg-static
// binary for this platform is not installed. Mirrors the ffmpeg path:
// lanczos downscale to the target size, 60fps, yuv420p, faststart.
//
//   swiftc -O scripts/encode-demo-video.swift -o /tmp/encode-demo-video
//   encode-demo-video <framesDir> <out.mp4> [fps=60] [width=1920] [height=1080]
//   encode-demo-video --probe <file.mp4>
import AVFoundation
import CoreImage
import Foundation

func fail(_ message: String) -> Never {
  FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
  exit(1)
}

let args = CommandLine.arguments
if args.count >= 3, args[1] == "--probe" {
  let asset = AVURLAsset(url: URL(fileURLWithPath: args[2]))
  guard let track = asset.tracks(withMediaType: .video).first else {
    fail("no video track")
  }
  let seconds = CMTimeGetSeconds(asset.duration)
  let size = track.naturalSize
  let frames = Int((seconds * Double(track.nominalFrameRate)).rounded())
  var codec = "?"
  if let desc = track.formatDescriptions.first {
    let sub = CMFormatDescriptionGetMediaSubType(desc as! CMFormatDescription)
    codec = String(
      bytes: [24, 16, 8, 0].map { UInt8((sub >> $0) & 0xff) }, encoding: .ascii) ?? "?"
  }
  print(
    "codec=\(codec) size=\(Int(size.width))x\(Int(size.height)) fps=\(track.nominalFrameRate) duration=\(String(format: "%.3f", seconds))s frames=\(frames) bitrate=\(Int(track.estimatedDataRate / 1000))kbps"
  )
  exit(0)
}

guard args.count >= 3 else {
  fail("usage: encode-demo-video <framesDir> <out.mp4> [fps] [width] [height]")
}
let framesDir = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let fps = Int32(args.count > 3 ? Int(args[3]) ?? 60 : 60)
let width = args.count > 4 ? Int(args[4]) ?? 1920 : 1920
let height = args.count > 5 ? Int(args[5]) ?? 1080 : 1080

let files = ((try? FileManager.default.contentsOfDirectory(atPath: framesDir.path)) ?? [])
  .filter { $0.hasSuffix(".png") }
  .sorted()
guard !files.isEmpty else { fail("no PNG frames in \(framesDir.path)") }

try? FileManager.default.removeItem(at: outURL)
guard let writer = try? AVAssetWriter(outputURL: outURL, fileType: .mp4) else {
  fail("cannot open \(outURL.path) for writing")
}
writer.shouldOptimizeForNetworkUse = true  // faststart

let input = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoColorPropertiesKey: [
      AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
      AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
      AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
    ],
    AVVideoCompressionPropertiesKey: [
      AVVideoAverageBitRateKey: 24_000_000,
      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      AVVideoMaxKeyFrameIntervalKey: Int(fps),
      AVVideoExpectedSourceFrameRateKey: Int(fps),
      AVVideoAllowFrameReorderingKey: true,
    ],
  ])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: input,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
  ])
writer.add(input)
guard writer.startWriting() else { fail("startWriting: \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)

// No colour management anywhere: the sRGB-encoded PNG values go straight into
// the encoder, exactly as ffmpeg's scale filter treats them.
let context = CIContext(options: [
  .workingColorSpace: NSNull(),
  .outputColorSpace: NSNull(),
])

for (index, name) in files.enumerated() {
  autoreleasepool {
    let url = framesDir.appendingPathComponent(name)
    guard var image = CIImage(contentsOf: url, options: [.colorSpace: NSNull()]) else {
      fail("cannot read \(name)")
    }
    let sy = CGFloat(height) / image.extent.height
    let sx = CGFloat(width) / image.extent.width
    if abs(sy - 1) > 0.0001 || abs(sx - 1) > 0.0001 {
      image = image.clampedToExtent().applyingFilter(
        "CILanczosScaleTransform",
        parameters: [kCIInputScaleKey: sy, kCIInputAspectRatioKey: sx / sy])
    }
    while !input.isReadyForMoreMediaData { usleep(2000) }
    guard let pool = adaptor.pixelBufferPool else { fail("no pixel buffer pool") }
    var buffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
    guard let pixelBuffer = buffer else { fail("cannot allocate pixel buffer") }
    context.render(
      image, to: pixelBuffer,
      bounds: CGRect(x: 0, y: 0, width: width, height: height), colorSpace: nil)
    let time = CMTime(value: CMTimeValue(index), timescale: fps)
    if !adaptor.append(pixelBuffer, withPresentationTime: time) {
      fail("append failed at \(name): \(String(describing: writer.error))")
    }
    if index % 100 == 0 { print("  encoded \(index)/\(files.count)") }
  }
}

input.markAsFinished()
writer.endSession(atSourceTime: CMTime(value: CMTimeValue(files.count), timescale: fps))
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed { fail("finishWriting: \(String(describing: writer.error))") }
print("Wrote \(outURL.path) (\(files.count) frames @ \(fps)fps)")
