<script lang="ts">
    import { calculator } from "$lib/calculator.svelte";

    function formatNumber(n: number): string {
        return n.toLocaleString("en-US");
    }
</script>

<section
    aria-label="Total volume summary"
    class="mb-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3 flex items-center justify-between"
>
    <div class="text-sm font-medium text-slate-600">Total Active Volume</div>
    <div class="text-lg font-semibold text-slate-900">
        {#if calculator.totalVolumeMl > 0}
            {formatNumber(calculator.totalVolumeMl)} ml
        {:else}
            0 ml
        {/if}
    </div>
</section>
