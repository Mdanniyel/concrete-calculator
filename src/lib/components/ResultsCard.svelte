<script lang="ts">
    import { calculator } from "$lib/calculator.svelte";

    function formatNumber(n: number): string {
        return n.toLocaleString("en-US");
    }
</script>

<section
    aria-label="תוצאות בגרמים"
    class="mb-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3"
>
    <div class="flex items-center justify-between mb-2">
        <h2 class="text-base font-semibold text-slate-800">תוצאות (ג)</h2>
        <span class="text-[11px] uppercase tracking-wide text-slate-400"
            >עדכון חי</span
        >
    </div>
    {#if calculator.totalGrams <= 0}
        <p class="text-xs text-slate-400">בחר או הוסף תבנית כדי להתחיל</p>
    {:else}
        <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-lg bg-sky-50 px-3 py-2">
                <dt class="text-xs text-sky-700">מים</dt>
                <dd class="text-base font-semibold text-sky-900">
                    {formatNumber(calculator.results.water)}
                    <span class="text-xs font-normal text-sky-700 ml-1">ג</span>
                </dd>
            </div>
            <div class="rounded-lg bg-emerald-50 px-3 py-2">
                <dt class="text-xs text-emerald-700">בונד</dt>
                <dd class="text-base font-semibold text-emerald-900">
                    {formatNumber(calculator.results.bond)}
                    <span class="text-xs font-normal text-emerald-700 ml-1"
                        >ג</span
                    >
                </dd>
            </div>
            <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <dt class="text-xs text-slate-700">צמנט לבן</dt>
                <dd class="text-base font-semibold text-slate-900">
                    {formatNumber(calculator.results.white_cement)}
                    <span class="text-xs font-normal text-slate-700 ml-1"
                        >ג</span
                    >
                </dd>
            </div>
            <div class="rounded-lg bg-slate-100 px-3 py-2">
                <dt class="text-xs text-slate-700">שפכטל</dt>
                <dd class="text-base font-semibold text-slate-900">
                    {formatNumber(calculator.results.putty)}
                    <span class="text-xs font-normal text-slate-700 ml-1"
                        >ג</span
                    >
                </dd>
            </div>
        </dl>
        <p class="mt-3 text-xs text-slate-500 text-right">
            סך הכל גרם: <span class="font-semibold"
                >{formatNumber(calculator.totalGrams)}</span
            >
            <span class="ml-1">ג</span>
        </p>
    {/if}
</section>
