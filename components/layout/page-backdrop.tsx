import type { ReactNode } from "react";

import { ShaderFlow } from "../shaders/shader-flow";

export function PageBackdrop(): ReactNode {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-225 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-50 md:opacity-100">
        <ShaderFlow brightness={2} iterations={10} flowSpeed={[0, 0.1]} colorHighA={[0.143, 0.2824, 0.3451]} colorLowA={[0.1, 0.1, 0.1]} />
        {/* <Watercolor
          color1="#2f4858"
          color2="#e0e0e0"
          saturation={0.8}
          colorGain={0.8}
          brightness={0.4}
        /> */}
      </div>
    </div>
  );
}
