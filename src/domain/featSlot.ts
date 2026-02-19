export interface FeatSlot {
    id: string;
    grantedAtLevel: number;
    source: "classLevel" | "baseLevel" | "other"; // where the feat slot came from
    featSelected?: string; // feat id
    whitelist?: string[]; // optional list of allowed feat ids
}
