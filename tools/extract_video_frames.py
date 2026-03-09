import argparse
import os
from pathlib import Path

import imageio.v3 as iio


def _pick_plugin() -> str | None:
    # Prefer ffmpeg plugin for mp4.
    return "ffmpeg"


def _extract_with_cv2(video_path: Path, out_dir: Path, indices: list[int]) -> list[Path]:
    import cv2  # type: ignore

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("OpenCV could not open video")

    written: list[Path] = []
    indices_set = set(indices)
    max_index = max(indices) if indices else 0
    idx = 0
    while idx <= max_index:
        ok, frame = cap.read()
        if not ok or frame is None:
            break
        if idx in indices_set:
            # cv2 reads BGR; convert to RGB for consistent output
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            out_path = out_dir / f"frame_{idx:06d}.png"
            # Write via imageio if available, else cv2
            try:
                iio.imwrite(out_path, frame_rgb)
            except Exception:
                cv2.imwrite(str(out_path), frame)
            written.append(out_path)
        idx += 1
    cap.release()
    return written


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", help="Path to input video")
    ap.add_argument("--out", default="video_frames", help="Output directory")
    ap.add_argument("--count", type=int, default=12, help="Number of frames to sample")
    args = ap.parse_args()

    video_path = Path(args.video)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not video_path.exists():
        raise SystemExit(f"Video not found: {video_path}")

    plugin = _pick_plugin()

    # Try to read metadata for fps and duration; fall back to sequential sampling.
    meta = {}
    meta_err = None
    try:
        meta = iio.immeta(video_path, plugin=plugin) if plugin else iio.immeta(video_path)
    except Exception as e:
        meta = {}
        meta_err = e

    ffmpeg_path = None
    try:
        import imageio_ffmpeg  # type: ignore

        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ffmpeg_path = None

    fps = None
    nframes = None
    for key in ("fps", "frame_rate", "r_frame_rate"):
        if key in meta:
            try:
                fps = float(meta[key])
                break
            except Exception:
                pass
    for key in ("nframes", "n_frames", "frames"):
        if key in meta:
            try:
                nframes = int(meta[key])
                break
            except Exception:
                pass

    # If we can’t get nframes, do a first pass to count (bounded).
    if not nframes:
        # Read a limited number to avoid huge videos.
        # We'll just sample by grabbing every k-th frame up to some cap.
        nframes = 0
        try:
            it = iio.imiter(video_path, plugin=plugin) if plugin else iio.imiter(video_path)
            for _ in it:
                nframes += 1
                if nframes >= 5000:
                    break
        except Exception:
            nframes = 0

    # If imageio can't determine frame count, ask OpenCV.
    if not nframes:
        try:
            import cv2  # type: ignore

            cap = cv2.VideoCapture(str(video_path))
            if cap.isOpened():
                n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
                if n > 0:
                    nframes = n
                if fps is None:
                    f = float(cap.get(cv2.CAP_PROP_FPS) or 0)
                    if f > 0:
                        fps = f
            cap.release()
        except Exception:
            pass

    if not nframes:
        # Last resort: just grab the first `count` frames.
        indices = list(range(args.count))
    else:
        if args.count <= 1:
            indices = [0]
        else:
            step = max(1, (nframes - 1) // (args.count - 1))
            indices = [min(nframes - 1, i * step) for i in range(args.count)]

    written = []
    first_read_err = None
    for idx in indices:
        try:
            frame = iio.imread(video_path, index=idx, plugin=plugin) if plugin else iio.imread(video_path, index=idx)
        except Exception as e:
            if first_read_err is None:
                first_read_err = e
            written = []
            break
        out_path = out_dir / f"frame_{idx:06d}.png"
        iio.imwrite(out_path, frame)
        written.append(out_path)

    if not written:
        try:
            written = _extract_with_cv2(video_path, out_dir, indices)
        except Exception as e:
            if first_read_err is None:
                first_read_err = e

    print(f"plugin={plugin} ffmpeg={ffmpeg_path}")
    if meta_err:
        print(f"meta_error={type(meta_err).__name__}: {meta_err}")
    if first_read_err:
        print(f"read_error={type(first_read_err).__name__}: {first_read_err}")

    print(f"meta_keys={sorted(meta.keys())}")
    print(f"fps={fps} nframes={nframes} wrote={len(written)}")
    if written:
        print("first=", written[0])
        print("last=", written[-1])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
