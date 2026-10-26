import type { ReactNode } from "react";

import { HeroCtas } from "./hero-ctas";
import { FadeIn, ScaleUnblur } from "@/components/ui/motion-primitives";
import { PortraitMorph } from "./portrait-morph";
import HoverPreview, { HoverTarget } from "../items/hover-preview";

const PORTRAIT_SRC = "/josh.webp";
const PORTRAIT_HOVER_SRC = "/josh_wave.webp";

export function Hero(): ReactNode {

  const targets: HoverTarget[] = [
    {
      text: "Tony Blair Institute",
      imageUrl: "/tbi-logo.jpeg",
      linkUrl: "https://institute.global/",
    },
    {
      text: "Deloitte",
      imageUrl: "/deloitte-logo.png",
      linkUrl: "https://www.deloitte.com/uk/en/what-we-do/capabilities/content/innovation/home.html",
    },
  ]

  return (
    <section className="relative w-full">
      <div className="mx-auto w-full max-w-275 px-6 pt-44 pb-24 sm:px-10 sm:pt-56 sm:pb-32">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-8">
          <FadeIn className="flex flex-col gap-4  ">
            <p className="text-[20px] leading-tight tracking-tight font-medium text-foreground">
              Hey!

              I'm Jesal
            </p>

            <h1 className="text-[2.75rem] font-medium leading-[1.05] tracking-tight text-foreground md:text-[2.5rem] lg:text-[3.65rem]">
              <span className="block whitespace-nowrap">
                Full Stack Engineer
              </span>
            </h1>

            <p className="max-w-[34ch] text-[22px] leading-[1.4] tracking-tight text-foreground/65">
              Making products and apps which invoke thought, solve problems and creating seamless end-to-end experiences.
            </p>

            <HoverPreview
              content="Currently at the {0}, previously {1}."
              targets={targets}
              imagePosition="right"
              enterSpeed={0.25}
              exitSpeed={0.15}
              targetPadding={6}
              imageWidth={300}
              imageHeight={300}
              imageBorderRadius="1.5rem"
              showImageShadow={true}
              className="text-xl font-medium"
              targetStyle={{ color: "#dc2626" }}
            />

            <HeroCtas />
          </FadeIn>

          <ScaleUnblur className="flex justify-stretch md:justify-end">
            <div className="relative aspect-square w-full md:max-w-105 overflow-hidden rounded-4xl border border-foreground/8 bg-background p-1.5 shadow-sm">
              <div className="relative h-full w-full overflow-hidden rounded-[1.6rem]">
                <PortraitMorph
                  srcA={PORTRAIT_SRC}
                  srcB={PORTRAIT_HOVER_SRC}
                  alt="Josh portrait"
                />
              </div>
            </div>
          </ScaleUnblur>
        </div>
      </div>
    </section>
  );
}
