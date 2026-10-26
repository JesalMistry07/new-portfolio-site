export const cn = (...classes: (string | undefined | boolean)[]): string =>
    classes.filter(Boolean).join(" ");