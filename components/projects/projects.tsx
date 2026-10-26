import {
  ArrowRight,
  Globe,
  Search,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import CountUp from "@/components/ui/count-up";
import { FadeIn } from "@/components/ui/motion-primitives";

/**
 * Project imagery below is mockup-only. All visuals are sourced from
 * Dribbble and credit belongs to the original creators on dribbble.com.
 * Replace these with your own work before shipping.
 */

type Project = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  iconLabel: string;
  title: string;
  description: string;
  meta: string;
  imageRatio: number;
  image: string;
  imageAlt: string;
};

const PROJECTS: Project[] = [
  {
    id: "points-atlas",
    icon: Globe,
    iconLabel: "PointsAtlas",
    title: "PointsAtlas",
    description:
      "A credit card rewards planner that helps users enter their points balance and see where they can realistically fly, with a simple and useful travel-focused interface.",
    meta: "Independent Product Concept, 2026",
    imageRatio: 1200 / 900,
    image: "/can-wear-shorts.png",
    imageAlt: "Travel rewards and flights concept mockup",
  },
  {
    id: "wear-shorts",
    icon: Search,
    iconLabel: "Can I Wear Shorts?",
    title: "Can I Wear Shorts?",
    description:
      "A lightweight weather utility that tells people whether they can realistically wear shorts in their city, with a crisp interface and a playful tone.",
    meta: "Independent Project, 2026",
    imageRatio: 1200 / 900,
    image: "/can-wear-shorts.png",
    imageAlt: "Weather and shorts concept mockup",
  },
];

export type ProjectsProps = {
  withHeadline?: boolean;
  viewMoreVisible?: boolean;
};

export function Projects({
  withHeadline = false,
  viewMoreVisible = false,
}: ProjectsProps): ReactNode {
  const items = viewMoreVisible ? PROJECTS.slice(0, 4) : PROJECTS;

  return (
    <section className="relative w-full">
      <div className="mx-auto w-full max-w-275 px-6 sm:px-10">
        {withHeadline ? (
          <FadeIn className="flex flex-col items-center gap-5 pt-12 pb-10 text-center sm:pt-20 sm:pb-14">
            <h2 className="font-serif text-[2.5rem] font-medium leading-[1.05] tracking-tight text-foreground md:text-[3rem] lg:text-[3.5rem]">
              My projects
            </h2>
            <p className="max-w-[33ch] text-[18px] leading-[1.45] tracking-tight text-foreground/65 sm:text-[20px]">
              From playful experiments to thoughtful systems, a look at the
              work I&rsquo;m proud to have shipped.
            </p>
          </FadeIn>
        ) : null}

        <div className="columns-1 gap-6 md:columns-2 md:gap-7">
          {items.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {viewMoreVisible ? (
          <div className="mt-12 flex justify-center sm:mt-16">
            <Link
              href="/projects"
              className="border border-foreground/8 focus-ring group inline-flex cursor-pointer items-center gap-2 rounded-xl bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              View all projects
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}): ReactNode {
  const Icon = project.icon;
  return (
    <FadeIn
      delay={Math.min(index * 0.06, 0.3)}
      className="mb-6 break-inside-avoid md:mb-7"
    >
      <article className="project-card flex cursor-pointer flex-col gap-4 rounded-3xl border border-foreground/8 bg-background p-3 sm:p-3.5">
        <header className="flex items-center gap-2.5 px-1 pt-2">
          <span className="border-foreground/10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Icon className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium tracking-tight text-foreground">
            {project.iconLabel}
          </span>
        </header>

        <div
          className="project-card__image ring-foreground/5 relative w-full overflow-hidden rounded-2xl bg-foreground/5 ring-1"
          style={{ aspectRatio: project.imageRatio }}
        >
          <div className="project-card__image-inner">
            <Image
              src={project.image}
              alt={project.imageAlt}
              fill
              sizes="(min-width: 1024px) 540px, (min-width: 768px) 45vw, 100vw"
              className="object-cover"
              priority={index < 2}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 px-1 pb-1">
          <h3 className="text-[20px] font-medium leading-[1.2] tracking-tight text-foreground sm:text-[22px]">
            {project.title}
          </h3>
          <p className="text-[14px] leading-normal tracking-tight text-foreground/65 sm:text-[15px]">
            {project.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 px-1 pb-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/45">
              visitors
            </p>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              <CountUp
                from={0}
                to={248}
                mode="count"
                easing="easeOut"
                format="standard"
                separator=","
                duration={1.5}
                delay={0.2}
                trigger="view"
                className="inline-block"
                style={{ fontSize: "2rem", fontWeight: 700 }}
              />
            </div>
          </div>
          <p className="text-[12px] tracking-tight text-foreground/50">
            {project.meta}
          </p>
        </div>
      </article>
    </FadeIn>
  );
}
