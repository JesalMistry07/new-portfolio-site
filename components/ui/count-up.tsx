'use client';

import { animate, cubicBezier, useInView } from 'motion/react';
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';

const CELL = 1.2;
const STAGGER = 0.07;
const UNITS = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
] as const;
const SLOT_STYLE = { display: 'inline-block', height: `${CELL}em`, lineHeight: `${CELL}em` };
const SR_ONLY = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
} as const;

type EasingName = 'linear' | 'easeOut' | 'expo' | 'spring';
type CountMode = 'count' | 'roll';
type CountDirection = 'up' | 'down';
type CountFormat = 'standard' | 'compact';
type TriggerMode = 'view' | 'load';

type CountUpProps = {
    to: number;
    from?: number;
    mode?: CountMode;
    easing?: EasingName;
    format?: CountFormat;
    decimals?: number;
    direction?: CountDirection;
    trigger?: TriggerMode;
    replayOnHover?: boolean;
    delay?: number;
    duration?: number;
    className?: string;
    style?: CSSProperties;
    startWhen?: boolean;
    separator?: string;
    prefix?: string;
    suffix?: string;
    onStart?: () => void;
    onEnd?: () => void;
};

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (edge0: number, edge1: number, value: number) => {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
};
const mod10 = (value: number) => ((value % 10) + 10) % 10;

const makeSpring = (overshoot: number) => {
    const log = Math.log(Math.min(0.5, Math.max(0.001, overshoot)));
    const zeta = -log / Math.sqrt(Math.PI * Math.PI + log * log);
    const damped = Math.PI / 0.52;
    const natural = damped / Math.sqrt(1 - zeta * zeta);
    const raw = (t: number) =>
        1 -
        Math.exp(-zeta * natural * t) *
        (Math.cos(damped * t) + ((zeta * natural) / damped) * Math.sin(damped * t));
    const residual = 1 - raw(1);
    return (t: number) => (t >= 1 ? 1 : raw(t) + residual * t * t * t);
};

const EASINGS: {
    linear: (t: number) => number;
    easeOut: (t: number) => number;
    expo: (t: number) => number;
    spring: (t: number) => number;
} = {
    linear: (t) => t,
    easeOut: cubicBezier(0.33, 1, 0.68, 1),
    expo: (t) => (t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10))),
    spring: makeSpring(0.06),
};

const getDecimalPlaces = (num: number) => {
    const str = num.toString();

    if (str.includes('.')) {
        const decimals = str.split('.')[1];

        if (decimals && parseInt(decimals, 10) !== 0) {
            return decimals.length;
        }
    }

    return 0;
};

const unitFor = (value: number) =>
    UNITS.find(([size]) => Math.abs(value) >= size * 0.9995) || [1, ''] as [number, string];

const scaleFor = (value: number, compact: boolean, decimals: number | undefined, places: number) => {
    if (!compact) return { size: 1, label: '', digits: places };
    const [size, label] = unitFor(value);
    const digits = decimals ?? (label ? (Math.abs(value) / size < 100 ? 1 : 0) : places);
    return { size, label, digits };
};

const splitNumber = (value: number, digits: number, size: number) => {
    const fixed = (Math.abs(value) / size).toFixed(digits);
    const [int = '', frac = ''] = fixed.split('.');
    return { negative: value < 0 && Number(fixed) !== 0, int, frac };
};

const group = (int: string, separator: string) =>
    separator ? int.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : int;

const buildRoll = (
    a: number,
    b: number,
    spin: boolean,
    { compact, decimals, places, separator }: { compact: boolean; decimals: number | undefined; places: number; separator: string },
) => {
    const { size, label, digits } = scaleFor(b, compact, decimals, places);
    const pa = splitNumber(a, digits, size);
    const pb = splitNumber(b, digits, size);
    const length = Math.max(pa.int.length, pb.int.length);
    const slots: Array<{ char?: string; follow?: number; enter?: boolean; leave?: boolean } | { slot: number; index: number; place: number; from: number; to: number; enter: boolean; leave: boolean }> = [];
    const columns: Array<{
        slot: number;
        index: number;
        place: number;
        from: number;
        to: number;
        enter: boolean;
        leave: boolean;
        delta?: number;
        ease?: (value: number) => number;
        box?: HTMLElement | null;
        strip?: HTMLElement | null;
        blur?: SVGFEGaussianBlurElement | null;
        cells: Array<Node | null>;
        width?: number;
        base?: number;
        sigma?: number;
        presence?: number;
    }> = [];

    if (pa.negative || pb.negative) {
        slots.push({ char: '-', enter: !pa.negative, leave: !pb.negative });
    }

    const digitAt = (parts: { int: string; frac: string }, place: number) => {
        if (place < 0) return Number(parts.frac[-place - 1]);
        const index = parts.int.length - 1 - place;
        return index >= 0 ? Number(parts.int[index]) : null;
    };

    for (let place = length - 1; place >= -digits; place--) {
        if (place === -1) slots.push({ char: '.' });
        const start = digitAt(pa, place);
        const end = digitAt(pb, place);
        const column = {
            slot: slots.length,
            index: columns.length,
            place,
            from: start ?? 0,
            to: end ?? 0,
            enter: start === null,
            leave: end === null,
            cells: [] as Array<Node | null>,
        };
        slots.push(column);
        columns.push(column);
        if (separator && place > 0 && place % 3 === 0) {
            slots.push({ char: separator, follow: column.index });
        }
    }

    const up = spin || b >= a;
    columns.forEach((column, index) => {
        const rank = columns.length - 1 - index;
        const base = up ? mod10(column.to - column.from) : -mod10(column.from - column.to);
        const turns = spin
            ? Math.max(1, 3 - rank)
            : Math.min(
                Math.floor(Math.abs(b - a) / (size * 10 ** (column.place + 1))),
                Math.max(0, 3 - rank),
            );
        column.delta = base + (up ? 10 : -10) * turns;
    });

    return { slots, columns, label };
};

export default function CountUp({
    to,
    from = 0,
    direction = 'up',
    delay = 0,
    duration = 2,
    className = '',
    style,
    startWhen = true,
    separator = '',
    prefix = '',
    suffix = '',
    mode = 'count',
    easing = 'easeOut',
    decimals,
    format = 'standard',
    trigger = 'view',
    replayOnHover = false,
    onStart,
    onEnd,
}: CountUpProps) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const textRef = useRef<HTMLSpanElement | null>(null);
    const slotRefs = useRef<Array<HTMLElement | null>>([]);
    const filterRefs = useRef<Array<SVGFEGaussianBlurElement | null>>([]);
    const uid = useId().replace(/[^\w-]/g, '');
    const startValue = direction === 'down' ? to : from;
    const endValue = direction === 'down' ? from : to;
    const valueRef = useRef(startValue);
    const startedRef = useRef(false);
    const runningRef = useRef(false);
    const [play, setPlay] = useState<null | { id: number; from: number; to: number; spin: boolean; wait: boolean }>(null);
    const isInView = useInView(ref, { once: true, margin: '0px' });
    const active = trigger === 'load' || isInView;
    const compact = format === 'compact';
    const places = decimals ?? Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

    const formatValue = useCallback(
        (latest: number) => {
            const { size, label, digits } = scaleFor(latest, compact, decimals, places);
            const parts = splitNumber(latest, digits, size);
            const body = `${parts.negative ? '-' : ''}${group(parts.int, separator)}${parts.frac ? `.${parts.frac}` : ''}`;
            return `${prefix}${body}${label}${suffix}`;
        },
        [compact, decimals, places, separator, prefix, suffix],
    );

    const model = useMemo(() => {
        if (mode !== 'roll') return null;
        const a = play ? play.from : startValue;
        const b = play ? play.to : endValue;
        return buildRoll(a, b, !!play?.spin, { compact, decimals, places, separator });
    }, [mode, play, startValue, endValue, compact, decimals, places, separator]);

    const [initialText] = useState(() => formatValue(startValue));
    const latestRef = useRef<{
        formatValue: (latest: number) => string;
        onStart?: () => void;
        onEnd?: () => void;
        model: ReturnType<typeof buildRoll> | null;
        mode: CountMode;
        easing: EasingName;
        duration: number;
        delay: number;
    } | null>(null);

    useIsoLayoutEffect(() => {
        latestRef.current = {
            formatValue,
            model,
            mode,
            easing,
            duration: Math.max(0, duration),
            delay,
            ...(onStart ? { onStart } : {}),
            ...(onEnd ? { onEnd } : {}),
        };
    });

    useIsoLayoutEffect(() => {
        if (!startedRef.current) valueRef.current = startValue;
        if (mode === 'count' && !runningRef.current && textRef.current) {
            textRef.current.textContent = formatValue(valueRef.current);
        }
    }, [mode, startValue, formatValue]);

    useEffect(() => {
        if (!active || !startWhen) return;
        startedRef.current = true;
        setPlay((previous) => ({
            id: (previous?.id || 0) + 1,
            from: valueRef.current,
            to: endValue,
            spin: false,
            wait: true,
        }));
    }, [active, startWhen, endValue]);

    useEffect(() => {
        if (!play) return undefined;
        const currentPlay = play;
        const live = latestRef.current;
        if (!live) return undefined;

        const easingFn: (t: number) => number =
            live.easing === 'linear'
                ? EASINGS.linear
                : live.easing === 'easeOut'
                    ? EASINGS.easeOut
                    : live.easing === 'expo'
                        ? EASINGS.expo
                        : EASINGS.spring;
        const total = live.duration;
        const progress = (t: number) => (total > 0 ? clamp01(t / total) : 1);
        let render: (t: number) => void;

        if (live.mode === 'roll' && live.model && ref.current) {
            const { columns: layout, slots } = live.model;
            const fontSize = parseFloat(getComputedStyle(ref.current).fontSize) || 16;
            const cell = CELL * fontSize;
            const stagger = layout.length > 1 ? Math.min(STAGGER, (total * 0.4) / (layout.length - 1)) : 0;
            const span = Math.max(0.001, total - stagger * (layout.length - 1));
            const columns = layout.map((column) => {
                const box = slotRefs.current[column.slot];
                const strip = box?.firstElementChild as HTMLElement | null;
                return {
                    ...column,
                    box,
                    strip,
                    blur: filterRefs.current[column.index],
                    cells: strip ? Array.from(strip.childNodes, (node) => node.firstChild) : [],
                    width: box ? box.scrollWidth : 0,
                    ease: live.easing === 'spring'
                        ? makeSpring(Math.min(0.12, Math.max(0.01, 0.35 / Math.max(1, Math.abs(column.delta ?? 0)))))
                        : easingFn,
                    base: Math.floor(column.from),
                    sigma: 0,
                    presence: column.enter ? 0 : 1,
                };
            });

            const marks = slots
                .map((slot, index) => ({ ...slot, node: slotRefs.current[index] }))
                .filter((slot) => 'char' in slot && slot.char !== undefined && (slot.enter || slot.leave || slot.follow !== undefined))
                .map((slot) => ({ ...slot, width: slot.node?.scrollWidth ?? 0 }));

            const fade = (node: HTMLElement | null, width: number, presence: number, settled: boolean) => {
                if (!node) return;
                node.style.width = settled ? '' : `${(presence * width).toFixed(2)}px`;
                node.style.opacity = settled ? '' : presence.toFixed(3);
            };

            render = (t) => {
                columns.forEach((column, index) => {
                    if (!column.strip || !column.ease) return;
                    const u = clamp01((t - index * stagger) / span);
                    const pos = column.from + (column.delta ?? 0) * column.ease(u);
                    const base = Math.floor(pos);
                    if (base !== column.base) {
                        column.base = base;
                        column.cells.forEach((node, offset) => {
                            if (node) node.textContent = String(mod10(base + offset - 1));
                        });
                    }
                    column.strip.style.transform = `translateY(${(-(1 + pos - base) * CELL).toFixed(4)}em)`;

                    const u0 = Math.max(0, u - 0.004);
                    const u1 = Math.min(1, u + 0.004);
                    const speed =
                        u1 > u0
                            ? (Math.abs(column.delta ?? 0) * Math.abs(column.ease(u1) - column.ease(u0))) / (u1 - u0) / span
                            : 0;
                    const sigma = u > 0 && u < 1 ? Math.min(cell * 0.05, (speed * cell) / 600) : 0;
                    if (Math.abs(sigma - column.sigma) > 0.05 || (sigma === 0 && column.sigma !== 0)) {
                        column.sigma = sigma;
                        if (sigma > 0.2 && column.blur) {
                            column.blur.setAttribute('stdDeviation', `0 ${sigma.toFixed(2)}`);
                            column.strip.style.filter = `url(#${uid}-${index})`;
                        } else {
                            column.strip.style.filter = '';
                        }
                    }

                    if (column.enter || column.leave) {
                        column.presence = column.enter ? smooth(0, 0.45, u) : 1 - smooth(0.55, 1, u);
                        const box = column.box ?? null;
                        const width = column.width ?? 0;
                        fade(box, width, column.presence ?? 0, column.enter && u >= 1);
                    }
                });

                const overall = progress(t);
                marks.forEach((mark) => {
                    if ('follow' in mark && mark.follow !== undefined) {
                        const column = columns[mark.follow];
                        if (column && (column.enter || column.leave)) {
                            const node = mark.node ?? null;
                            fade(node, mark.width, column.presence ?? 0, column.enter && (column.presence ?? 0) >= 1);
                        }
                        return;
                    }

                    const presence = mark.enter ? smooth(0, 0.3, overall) : 1 - smooth(0.7, 1, overall);
                    const node = mark.node ?? null;
                    fade(node, mark.width, presence, !!mark.enter && overall >= 1);
                });

                valueRef.current = currentPlay.from + (currentPlay.to - currentPlay.from) * easingFn(overall);
            };
        } else {
            render = (t) => {
                const value = currentPlay.from + (currentPlay.to - currentPlay.from) * easingFn(progress(t));
                valueRef.current = value;
                if (textRef.current) textRef.current.textContent = latestRef.current?.formatValue(value) ?? String(value);
            };
        }

        if (typeof onStart === 'function') onStart();

        const finish = () => {
            render(Infinity);
            valueRef.current = currentPlay.to;
            runningRef.current = false;
            if (typeof onEnd === 'function') onEnd();
        };

        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            finish();
            return undefined;
        }

        const controls = animate(0, total, {
            duration: total,
            delay: play.wait ? delay : 0,
            ease: 'linear',
            onUpdate: render,
            onComplete: finish,
        });

        runningRef.current = true;

        return () => {
            controls.stop();
            runningRef.current = false;
        };
    }, [play, uid, delay, duration, easing, formatValue, onEnd, onStart]);

    const replay = () => {
        if (!replayOnHover || runningRef.current || !startedRef.current) return;
        setPlay((previous) =>
            mode === 'roll'
                ? { id: (previous?.id || 0) + 1, from: valueRef.current, to: valueRef.current, spin: true, wait: false }
                : { id: (previous?.id || 0) + 1, from: startValue, to: endValue, spin: false, wait: false },
        );
    };

    const finalText = formatValue(play ? play.to : endValue);

    return (
        <span
            className={className}
            ref={ref}
            style={{ fontVariantNumeric: 'tabular-nums', ...style }}
            onPointerEnter={replayOnHover ? replay : undefined}
        >
            {model ? (
                <>
                    <span
                        key={`roll-${play?.id || 0}`}
                        aria-hidden="true"
                        style={{ display: 'inline-flex', whiteSpace: 'pre', userSelect: 'none' }}
                    >
                        {prefix && <span style={SLOT_STYLE}>{prefix}</span>}
                        {model.slots.map((slot, index) => {
                            const linkedColumn = 'char' in slot && slot.follow !== undefined ? model.columns[slot.follow] : undefined;
                            const hidden =
                                'char' in slot
                                    ? slot.char !== undefined
                                        ? slot.enter || (slot.follow !== undefined && (linkedColumn?.enter ?? false))
                                        : slot.enter
                                    : slot.enter;
                            const collapsed = hidden ? { width: 0, opacity: 0 } : null;

                            if ('char' in slot && slot.char !== undefined) {
                                return (
                                    <span
                                        key={index}
                                        ref={(node) => {
                                            slotRefs.current[index] = node;
                                        }}
                                        style={{ ...SLOT_STYLE, overflow: 'hidden', ...collapsed }}
                                    >
                                        {slot.char}
                                    </span>
                                );
                            }

                            return (
                                <span
                                    key={index}
                                    ref={(node) => {
                                        slotRefs.current[index] = node;
                                    }}
                                    style={{ ...SLOT_STYLE, position: 'relative', overflow: 'hidden', ...collapsed }}
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transform: `translateY(${-CELL}em)`,
                                        }}
                                    >
                                        {[-1, 0, 1, 2].map((offset) => (
                                            <span key={offset} style={{ height: `${CELL}em` }}>
                                                {mod10((slot as { from: number }).from + offset)}
                                            </span>
                                        ))}
                                    </span>
                                </span>
                            );
                        })}
                        {model.label && <span style={SLOT_STYLE}>{model.label}</span>}
                        {suffix && <span style={SLOT_STYLE}>{suffix}</span>}
                    </span>
                    <span style={SR_ONLY}>{finalText}</span>
                    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
                        <defs>
                            {model.columns.map((column) => (
                                <filter
                                    key={column.index}
                                    id={`${uid}-${column.index}`}
                                    x="-20%"
                                    y="-50%"
                                    width="140%"
                                    height="200%"
                                    colorInterpolationFilters="sRGB"
                                >
                                    <feGaussianBlur
                                        ref={(node) => {
                                            filterRefs.current[column.index] = node;
                                        }}
                                        stdDeviation="0 0"
                                    />
                                </filter>
                            ))}
                        </defs>
                    </svg>
                </>
            ) : (
                <span key="count" ref={textRef}>
                    {initialText}
                </span>
            )}
        </span>
    );
}
