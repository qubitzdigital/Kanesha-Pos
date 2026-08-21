import { useEffect, useRef, useState } from "react";
import {
  MultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  BinaryBitmap,
  HybridBinarizer,
} from "@zxing/library";
import { HTMLCanvasElementLuminanceSource } from "@zxing/browser";

// Restrict to common retail formats and tell ZXing to try harder on each
// frame. Using the low-level MultiFormatReader (rather than the
// continuous-scan helper) lets us control exactly what gets decoded per
// frame: a cropped region plus a rotated copy.
const HINTS = new Map();
HINTS.set(DecodeHintType.TRY_HARDER, true);
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODABAR,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
]);

const SCAN_INTERVAL_MS = 150;
// Downscale very large camera frames before decoding, purely for
// performance — this does NOT crop anything out, it just resizes the
// whole frame proportionally.
const MAX_DECODE_WIDTH = 1280;

/**
 * BarcodeScannerModal
 * Opens the device camera and continuously scans for a barcode.
 *
 * Key fix vs earlier versions: the camera is only ever acquired ONCE on
 * open (preferring the back/environment camera directly via facingMode).
 * Device labels for the camera-picker dropdown are read from that SAME
 * live stream instead of opening-then-closing a throwaway stream first.
 * Opening a second stream right after closing a first one is what was
 * causing the long black-screen hang on many phones — camera hardware
 * needs time to fully release before it can be reacquired, and doing
 * that twice in a row on load made it much worse.
 *
 * A new stream is only requested if the user explicitly picks a
 * different camera from the dropdown.
 *
 * Props:
 *  - onScan(value: string)   called once with the decoded barcode text
 *  - onClose()               called when the user cancels / closes the modal
 */
export default function BarcodeScannerModal({ onScan, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasScannedRef = useRef(false);
  const readerRef = useRef(null);
  const mountedRef = useRef(true);

  const captureCanvasRef = useRef(null);
  const rotatedCanvasRef = useRef(null);
  if (!captureCanvasRef.current) {
    captureCanvasRef.current = document.createElement("canvas");
  }
  if (!rotatedCanvasRef.current) {
    rotatedCanvasRef.current = document.createElement("canvas");
  }

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Starting camera…");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  if (!readerRef.current) readerRef.current = new MultiFormatReader();

  const decodeCanvas = (canvas) => {
    try {
      const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
      const binaryBitmap = new BinaryBitmap(
        new HybridBinarizer(luminanceSource),
      );
      return readerRef.current.decode(binaryBitmap, HINTS);
    } catch {
      return null; // no code found in this frame — expected most of the time
    }
  };

  const scanLoop = () => {
    if (!mountedRef.current || hasScannedRef.current) return;
    const video = videoRef.current;

    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Decode the WHOLE frame (downscaled for performance only — nothing
      // is cropped out). Cropping to a fixed guide-box region was removed
      // because on many phones the camera's native sensor frame doesn't
      // line up with what's visually displayed, so a percentage-based
      // crop could silently cut the actual barcode out of the decoded
      // area even though it looked centered on screen.
      const scale = Math.min(1, MAX_DECODE_WIDTH / vw);
      const dw = Math.round(vw * scale);
      const dh = Math.round(vh * scale);

      const canvas = captureCanvasRef.current;
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, dw, dh);

      let result = decodeCanvas(canvas);

      if (!result) {
        // Also try a 90°-rotated copy — handles barcodes held vertically
        // relative to the phone, which 1D scan-line decoding otherwise misses.
        const rotated = rotatedCanvasRef.current;
        rotated.width = dh;
        rotated.height = dw;
        const rctx = rotated.getContext("2d", { willReadFrequently: true });
        rctx.save();
        rctx.translate(dh / 2, dw / 2);
        rctx.rotate(Math.PI / 2);
        rctx.drawImage(canvas, -dw / 2, -dh / 2);
        rctx.restore();
        result = decodeCanvas(rotated);
      }

      if (result && !hasScannedRef.current) {
        hasScannedRef.current = true;
        const value = result.getText();
        if (navigator.vibrate) navigator.vibrate(120);
        onScan(value);
        return;
      }
    }

    timeoutRef.current = setTimeout(scanLoop, SCAN_INTERVAL_MS);
  };

  const attachStream = async (stream) => {
    streamRef.current = stream;

    const [track] = stream.getVideoTracks();
    const caps = track.getCapabilities?.() || {};
    setTorchSupported(!!caps.torch);

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    await video.play();

    hasScannedRef.current = false;
    setStatus("Point the camera at a barcode…");
    setError("");
    scanLoop();
  };

  const handleStreamError = (err) => {
    if (err?.name === "NotAllowedError") {
      setError(
        "Camera permission was denied. Please allow camera access and try again.",
      );
    } else if (
      err?.name === "NotFoundError" ||
      err?.name === "OverconstrainedError"
    ) {
      setError("Selected camera is unavailable. Try a different camera.");
    } else {
      setError(err?.message || "Unable to access the camera.");
    }
  };

  // Acquire the camera exactly once on mount — prefer the back camera via
  // facingMode directly, avoiding any throwaway/duplicate getUserMedia call.
  useEffect(() => {
    mountedRef.current = true;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera access is not supported in this browser. Please type or paste the barcode instead.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            advanced: [{ focusMode: "continuous" }],
          },
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        await attachStream(stream);

        // Populate the camera-picker dropdown from the SAME granted
        // permission — no extra getUserMedia call needed for labels now
        // that we already have an active stream.
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter(
            (d) => d.kind === "videoinput",
          );
          setDevices(videoDevices);

          const [activeTrack] = stream.getVideoTracks();
          const activeId = activeTrack.getSettings?.().deviceId;
          if (activeId) setSelectedDeviceId(activeId);
        } catch {
          // Device listing is a nice-to-have; scanning already works
          // without it, so ignore failures here.
        }
      } catch (err) {
        if (!mountedRef.current) return;
        handleStreamError(err);
      }
    };

    start();

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only triggered when the user manually picks a different camera.
  const handleDeviceChange = async (deviceId) => {
    if (deviceId === selectedDeviceId) return;
    setSelectedDeviceId(deviceId);
    setStatus("Switching camera…");
    setError("");
    clearTimeout(timeoutRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }],
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      await attachStream(stream);
    } catch (err) {
      if (!mountedRef.current) return;
      handleStreamError(err);
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {
      // Torch toggle not supported on this device/browser — ignore.
    }
  };

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            📷 Scan Barcode
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {devices.length > 1 && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Camera
            </label>
            <select
              className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-gray-200 bg-black">
          {error ? (
            <div className="flex h-64 w-full items-center justify-center p-4 text-center text-sm text-red-600">
              {error}
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                className="h-64 w-full object-cover"
                muted
                playsInline
                autoPlay
              />
              {/* Viewfinder overlay — visual aim guide only; the full frame is decoded */}
              <div className="pointer-events-none absolute inset-x-[7.5%] inset-y-1/4 rounded-lg border-2 border-primary/80" />

              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="absolute bottom-2 right-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/70"
                >
                  {torchOn ? "🔦 Torch off" : "🔦 Torch on"}
                </button>
              )}
            </>
          )}
        </div>

        {!error && (
          <p className="mt-3 text-center text-xs text-gray-500">{status}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
