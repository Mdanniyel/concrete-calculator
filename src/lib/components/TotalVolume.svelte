<script lang="ts">
    import { calculator } from "$lib/calculator.svelte";

    function formatNumber(n: number): string {
        return n.toLocaleString("en-US");
    }
</script>

<section
    aria-label="סיכום נפח כולל"
    class="mb-4 rounded-xl bg-white shadow-sm border border-slate-100 px-4 py-3 flex items-center justify-between"
>
    <div class="text-sm font-medium text-slate-600">סך הכל נפח פעיל</div>
    <div class="text-lg font-semibold text-slate-900">
        {#if calculator.totalVolumeMl > 0}
            {formatNumber(calculator.totalVolumeMl)} מ"ל
        {:else}
            0 מ"ל
        {/if}
    </div>
</section>
