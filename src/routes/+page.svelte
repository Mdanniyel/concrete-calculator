<script lang="ts">
	import { onMount } from "svelte";
	import { calculator } from "$lib/calculator.svelte";
	import AddMoldForm from "$lib/components/AddMoldForm.svelte";
	import MoldList from "$lib/components/MoldList.svelte";
	import ResultsCard from "$lib/components/ResultsCard.svelte";
	import TotalVolume from "$lib/components/TotalVolume.svelte";

	onMount(() => {
		calculator.load();

		// Try to prevent the mobile screen from turning off while the user is actively using the calculator
		if (typeof navigator !== "undefined") {
			const anyNavigator = navigator as Navigator & {
				wakeLock?: { request(type: "screen"): Promise<unknown> };
			};
			if (anyNavigator.wakeLock?.request) {
				anyNavigator.wakeLock.request("screen").catch(() => {
					/* ignore */
				});
			}
		}
	});
</script>

<main
	class="min-h-screen bg-slate-50 text-slate-900 flex justify-center px-4 py-6"
>
	<div class="w-full max-w-sm">
		<header class="mb-6 text-center">
			<h1 class="text-2xl font-semibold tracking-tight">
				Polymer Concrete Calculator
			</h1>
			<p class="text-sm text-slate-500 mt-1">Manage your mold library</p>
		</header>

		<TotalVolume />

		<ResultsCard />

		<section aria-label="Mold library" class="mt-3">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-base font-semibold text-slate-800">
					Mold Library
				</h2>
				{#if calculator.molds.length > 0}
					<button
						type="button"
						class="text-xs text-slate-500 hover:text-slate-700 underline"
						onclick={() => calculator.clearAll()}
					>
						Clear All
					</button>
				{/if}
			</div>

			<AddMoldForm />

			<MoldList />
		</section>

		{#if calculator.showUndo}
			<div
				role="status"
				class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-full bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-lg text-sm z-50"
			>
				<span>Mold deleted</span>
				<button
					type="button"
					class="font-semibold underline underline-offset-2"
					onclick={() => calculator.undoDelete()}
				>
					Undo
				</button>
			</div>
		{/if}
	</div>
</main>
