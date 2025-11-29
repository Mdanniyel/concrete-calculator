<script lang="ts">
    import { calculator } from "$lib/calculator.svelte";

    function formatNumber(n: number): string {
        return n.toLocaleString("en-US");
    }
</script>

<div class="space-y-2">
    {#if calculator.molds.length === 0}
        <div
            class="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl"
        >
            <p class="text-sm text-slate-400">Library is empty</p>
            <p class="text-xs text-slate-300 mt-1">Add your first mold above</p>
        </div>
    {:else}
        {#each calculator.molds as mold (mold.id)}
            <div
                class={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    mold.active
                        ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                        : "bg-slate-50 border-slate-100 opacity-75 grayscale-[0.5]"
                }`}
            >
                <button
                    type="button"
                    class="flex-1 flex items-center gap-3 text-left focus:outline-none"
                    onclick={() => calculator.toggleMold(mold.id)}
                >
                    <div
                        class={`w-3 h-3 rounded-full shrink-0 transition-colors ${
                            mold.active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                    ></div>
                    <div>
                        <div
                            class={`text-sm font-medium ${mold.active ? "text-slate-900" : "text-slate-500"}`}
                        >
                            {mold.name}
                        </div>
                        <div class="text-xs text-slate-400">
                            {formatNumber(mold.volume_ml)} ml
                        </div>
                    </div>
                </button>

                <div
                    class="flex items-center gap-2 pl-2 border-l border-slate-100 ml-2"
                >
                    <button
                        type="button"
                        class="p-1 text-slate-300 hover:text-red-500 transition-colors focus:outline-none"
                        onclick={() => calculator.deleteMold(mold.id)}
                        aria-label="Delete mold"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    {/if}
</div>
