export type MoldRow = {
    id: string;
    name: string;
    volume_ml: number;
    active: boolean;
    created_at: string;
};

export type Results = {
    water: number;
    bond: number;
    white_cement: number;
    putty: number;
};

const STORAGE_KEY = 'poly_concrete_state_v2';
const MAX_VOLUME_PER_MOLD = 100000;

export class CalculatorState {
    molds = $state<MoldRow[]>([]);
    undoStack = $state<MoldRow[] | null>(null);
    showUndo = $state(false);

    totalVolumeMl = $derived(
        this.molds
            .filter(m => m.active)
            .reduce((sum, mold) => sum + mold.volume_ml, 0)
    );

    totalGrams = $derived(this.totalVolumeMl * 2);
    results = $derived(this.calculateResults(this.totalGrams));

    constructor() {
        // Initialize
    }

    load() {
        if (typeof localStorage === 'undefined') return;

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // Migration v1 -> v2
            const v1 = localStorage.getItem('poly_concrete_state_v1');
            if (v1) {
                try {
                    const parsedV1 = JSON.parse(v1);
                    if (Array.isArray(parsedV1.molds)) {
                        this.molds = parsedV1.molds.map((m: any, i: number) => ({
                            ...m,
                            name: `Mold #${i + 1}`,
                            active: true
                        }));
                        this.save();
                        localStorage.removeItem('poly_concrete_state_v1');
                        return;
                    }
                } catch { }
            }
            this.molds = [];
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.molds)) {
                this.molds = parsed.molds;
            } else {
                this.molds = [];
            }
        } catch {
            this.molds = [];
        }
    }

    save() {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ molds: this.molds, last_updated: new Date().toISOString() })
        );
    }

    addMold(name: string, volume: number) {
        const finalName = name.trim() || `Mold #${this.molds.length + 1}`;
        this.molds = [
            ...this.molds,
            {
                id: crypto.randomUUID(),
                name: finalName,
                volume_ml: volume,
                active: true,
                created_at: new Date().toISOString()
            }
        ];
        this.save();
    }

    deleteMold(id: string) {
        this.undoStack = this.molds;
        this.showUndo = true;
        this.molds = this.molds.filter(m => m.id !== id);
        this.save();

        setTimeout(() => {
            this.showUndo = false;
            this.undoStack = null;
        }, 3500);
    }

    undoDelete() {
        if (!this.undoStack) return;
        this.molds = this.undoStack;
        this.undoStack = null;
        this.showUndo = false;
        this.save();
    }

    toggleMold(id: string) {
        this.molds = this.molds.map(m => m.id === id ? { ...m, active: !m.active } : m);
        this.save();
    }

    clearAll() {
        this.undoStack = this.molds;
        this.showUndo = true;
        this.molds = [];
        localStorage.removeItem(STORAGE_KEY);

        setTimeout(() => {
            this.showUndo = false;
            this.undoStack = null;
        }, 3500);
    }

    calculateResults(total: number): Results {
        if (total <= 0) {
            return { water: 0, bond: 0, white_cement: 0, putty: 0 };
        }
        const PERC = {
            water: 0.2,
            bond: 0.05,
            white_cement: 0.15,
            putty: 0.6
        } as const;

        let water = Math.round(total * PERC.water);
        let bond = Math.round(total * PERC.bond);
        let white_cement = Math.round(total * PERC.white_cement);
        let putty = Math.round(total * PERC.putty);

        let sum = water + bond + white_cement + putty;
        if (sum !== total) {
            putty += total - sum;
        }

        return { water, bond, white_cement, putty };
    }
}

export const calculator = new CalculatorState();
