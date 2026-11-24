import { useEffect, useRef, useState } from "react";

const FALLBACK = "/no-image.svg";

/**
 * If your images are hosted on Cloudinary, this asks for a resized,
 * compressed, modern-format version (f_auto = WebP/AVIF, q_auto = smart quality).
 * Other hosts are returned unchanged.
 */
export function optimizeImage(src, width = 480) {
  if (!src) return FALLBACK;
  if (
    src.includes("res.cloudinary.com") &&
    src.includes("/upload/") &&
    !/\/upload\/[^/]*(w_|f_|q_)/.test(src)
  ) {
    return src.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_fill/`);
  }
  return src;
}

/** Warm the browser cache for images the user will probably see next. */
export function prefetchImages(urls, width = 480) {
  urls.forEach((url) => {
    if (!url) return;
    const img = new Image();
    img.decoding = "async";
    img.src = optimizeImage(url, width);
  });
}

export default function SmartImage({
  src,
  alt = "",
  ratio = "4 / 3",
  width = 480,
  priority = false,
  className = "",
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef(null);

  const finalSrc = failed ? FALLBACK : optimizeImage(src, width);

  // New src -> reset state
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  // Cached images can finish before React attaches onLoad
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [finalSrc]);

  return (
    <div
      className={`img-box ${loaded ? "is-loaded" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        width={width}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => (failed ? setLoaded(true) : setFailed(true))}
      />
    </div>
  );
}
