"use client";

import { motion, useMotionValue, useMotionValueEvent, useTransform, MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Layers, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Step = {
    title: string;
    date?: string;
    copy: string;
    image?: string;
    icon: LucideIcon;
};

const steps: Step[] = [
    {
        title: "Founder",
        copy: "Designing and building products to help solve my problems. Hopefully will solve others' problems too. Currently in stealth, but will share more soon.",
        date: "2025-Present",
        icon: Wand2,
    },
    {
        title: "Tony Blair Institute for Global Change",
        copy: "From working as a PM leading scope for projects, to building tools and products at the forefront of technology as a Full Stack Engineer.",
        date: "2025-Present",
        image: "/tbi-logo.jpeg",
        icon: Layers,
    },
    {
        title: "Deloitte Consulting",
        copy: "Started my professional career at Deloitte, gaining valuable experience as a Product Engineer.",
        date: "2022-2025",
        image: "/deloitte-logo.png",
        icon: Sparkles,
    },
    {
        title: "Graduation",
        copy: "Graduated University with a first class degree in Aerospace Engineering (hons) from the University of Nottingham.",
        date: "2018",
        image: "/uon-logo.jpg",
        icon: Sparkles,
    },
];

function Node({
    progress,
    at,
    Icon,
}: {
    progress: MotionValue<number>;
    at: number;
    Icon: LucideIcon;
}) {
    const start = Math.max(0, at - 0.12);
    const mid = Math.min(1, at + 0.02);
    const scale = useTransform(progress, [start, mid], [0.6, 1]);
    const opacity = useTransform(progress, [start, mid], [0.25, 1]);
    const ringOpacity = useTransform(progress, [start, mid], [0, 1]);
    const [reached, setReached] = useState(false);

    useMotionValueEvent(progress, "change", (v) => {
        setReached(v >= mid - 0.001);
    });

    return (
        <div className="relative grid place-items-center">
            <span className="absolute h-14 w-14 rounded-full bg-white dark:bg-neutral-950" />
            <motion.span
                style={{ opacity: ringOpacity }}
                className="absolute h-14 w-14 rounded-full ring-[6px] ring-neutral-100 dark:ring-neutral-900"
            />
            {reached && (
                <motion.span
                    aria-hidden
                    className="absolute h-12 w-12 rounded-full bg-orange-500"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
            )}
            <motion.span
                style={{ scale, opacity }}
                animate={
                    reached
                        ? { backgroundColor: "rgb(249 115 22)", color: "rgb(255 255 255)" }
                        : {}
                }
                transition={{ duration: 0.35 }}
                className="relative grid place-items-center h-12 w-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
                <Icon className="h-5 w-5" />
            </motion.span>
        </div>
    );
}

function Card({ step, side }: { step: Step; side: "left" | "right" }) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full md:w-[44%] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] overflow-hidden ${side === "left" ? "md:mr-auto" : "md:ml-auto"
                }`}
        >
            <div className="p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
                    {step.title}
                </h3>
                {step.date && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-600">
                        {step.date}
                    </p>
                )}
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {step.copy}
                </p>
            </div>
            {step.image && (
                <div className="px-2 pb-2">
                    <div className="aspect-16/10 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        <img
                            src={step.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            )}
        </motion.article>
    );
}

export default function HowItWorks6() {
    const ref = useRef<HTMLDivElement>(null);
    const firstNodeRef = useRef<HTMLDivElement>(null);
    const lastNodeRef = useRef<HTMLDivElement>(null);
    const scrollYProgress = useMotionValue(0);
    const [lineBounds, setLineBounds] = useState({ top: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let raf = 0;

        const tick = () => {
            const container = ref.current;
            const first = firstNodeRef.current;
            const last = lastNodeRef.current;
            if (container && first && last) {
                const win = container.ownerDocument.defaultView ?? window;
                const vh =
                    win.innerHeight || container.ownerDocument.documentElement.clientHeight;
                const containerRect = container.getBoundingClientRect();
                const firstRect = first.getBoundingClientRect();
                const lastRect = last.getBoundingClientRect();

                const firstCenterY = firstRect.top + firstRect.height / 2;
                const lastCenterY = lastRect.top + lastRect.height / 2;

                const activate = vh * 0.55;

                const span = lastCenterY - firstCenterY;
                if (span > 0) {
                    const p = (activate - firstCenterY) / span;
                    scrollYProgress.set(Math.min(1, Math.max(0, p)));
                }

                const top = firstCenterY - containerRect.top;
                const height = lastCenterY - firstCenterY;
                setLineBounds((prev) =>
                    prev.top === top && prev.height === height ? prev : { top, height }
                );
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [scrollYProgress]);

    const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <section className="relative w-full flex items-start py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 overflow-hidden">
            <div className="relative max-w-[1200px] mx-auto w-full flex flex-col items-center">

                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 text-3xl sm:text-5xl md:text-6xl font-medium text-neutral-900 dark:text-white text-center tracking-tight leading-[1.05] max-w-xl"
                >
                    Career History
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-5 max-w-sm text-center text-base text-neutral-600 dark:text-neutral-400"
                >
                    A brief overview of my career history, highlighting key experiences and achievements.
                </motion.p>

                <div ref={ref} className="relative mt-20 sm:mt-28 w-full">
                    <div
                        aria-hidden
                        style={{ top: lineBounds.top, height: lineBounds.height }}
                        className="absolute left-1/2 -translate-x-1/2 w-px border-l border-dashed border-neutral-300 dark:border-neutral-700"
                    />
                    <motion.div
                        aria-hidden
                        style={{
                            top: lineBounds.top,
                            height: lineBounds.height,
                            scaleY: lineScale,
                            transformOrigin: "top",
                        }}
                        className="absolute left-1/2 -translate-x-1/2 w-px bg-neutral-900 dark:bg-white"
                    />

                    <div className="flex flex-col gap-16 sm:gap-24">
                        {steps.map((step, i) => {
                            const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
                            const at = i / Math.max(1, steps.length - 1);
                            const isFirst = i === 0;
                            const isLast = i === steps.length - 1;
                            return (
                                <div key={step.title} className="relative flex flex-col items-center">
                                    <div
                                        ref={isFirst ? firstNodeRef : isLast ? lastNodeRef : undefined}
                                        className="relative z-10"
                                    >
                                        <Node progress={scrollYProgress} at={at} Icon={step.icon} />
                                    </div>
                                    <div className="mt-8 w-full flex">
                                        <Card step={step} side={side} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
