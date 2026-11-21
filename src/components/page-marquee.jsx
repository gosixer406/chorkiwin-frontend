import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function Marquee({
  children,
  duration = 5,
  className = "text-black",
  groupClassName = "gap-x-1.5",
}) {
  const firstRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!firstRef.current) return;

    const update = () => {
      setWidth(firstRef.current.offsetWidth);
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(firstRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={`overflow-hidden w-full font-bold text-xs ${className}`}>
      <motion.div
        className="flex w-max"
        animate={{ x: [0, -width] }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        <div ref={firstRef} className={`flex shrink-0 ${groupClassName}`}>
          {children}
        </div>

        <div className={`flex shrink-0 ${groupClassName}`} aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
