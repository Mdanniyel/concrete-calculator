<script lang="ts">
    import { calculator } from "$lib/calculator.svelte";

    let inputName = $state("");
    let inputVolume = $state("");
    let inputError = $state<string | null>(null);

    const MAX_VOLUME_PER_MOLD = 100000;

    function normalizeAndValidateVolume(raw: string): {
        value: number | null;
        error: string | null;
    } {
        if (!raw.trim()) return { value: null, error: null };

        let parsed = Number(raw.replace(",", "."));
        if (Number.isNaN(parsed)) {
            return { value: null, error: "Please enter a valid number" };
        }

        if (parsed < 0) {
            parsed = 0;
            return {
                value: parsed,
                error: "Negative values are not allowed; set to 0",
            };
        }

        if (parsed > MAX_VOLUME_PER_MOLD) {
            return {
                value: MAX_VOLUME_PER_MOLD,
                error: `Max allowed is ${MAX_VOLUME_PER_MOLD.toLocaleString()} ml`,
            };
        }

        parsed = Math.round(parsed * 1000) / 1000;
        return { value: parsed, error: null };
    }

    function addMold() {
        const { value, error } = normalizeAndValidateVolume(inputVolume);
        inputError = error;
        if (value === null) {
            if (!error && !inputVolume.trim()) {
                inputError = "Volume is required";
            }
            return;
        }
        if (error) return;

        calculator.addMold(inputName, value);

        // Reset inputs
        inputVolume = "";
        inputName = "";
        inputError = null;
    }
</script>

<div class="mb-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
    <div class="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
            <label
                for="mold-name"
                class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1"
                >Name</label
            >
            <input
                id="mold-name"
                type="text"
                placeholder="e.g. Cube"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                bind:value={inputName}
            />
        </div>
        <div>
            <label
                for="mold-volume"
                class="block text-[10px] uppercase tracking-wide text-slate-500 mb-1"
                >Vol (ml)</label
            >
            <input
                id="mold-volume"
                inputmode="decimal"
                type="text"
                placeholder="320"
                class={`w-full rounded-lg border px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
                    inputError ? "border-red-400" : "border-slate-200"
                }`}
                bind:value={inputVolume}
            />
        </div>
        <button
            type="button"
            class="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-600"
            onclick={addMold}
            aria-label="Add mold"
        >
            +
        </button>
    </div>
    {#if inputError}
        <p class="mt-2 text-xs text-red-500">{inputError}</p>
    {/if}
</div>
