export const cleanRegion = (region: string): string => {
    if (!region) return '';
    // Basic cleaning, can be expanded
    return region.trim();
};

export const cleanVmType = (value: string): string => {
    if (!value) return '';
    return value.replace(/\(XIO\)/gi, "").trim();
};
