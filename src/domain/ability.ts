export interface Ability {
    id: string;
    name: string;
    action: "standard" | "move" | "swift" | "free";
    onUse: () => void | Promise<void>;
    description?: string;
}
