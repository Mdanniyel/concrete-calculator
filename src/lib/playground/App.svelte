<script>
	let valume = $state(240);
	let total_weight = $derived(valume * 2);
	let water_weight = $derived(total_weight * 0.2);
	let bond_weight = $derived(total_weight * 0.05);
	let putty_weight = $derived(total_weight * 0.6);
	let cement_weight = $derived(total_weight * 0.15);
</script>

<h3>הכנס נפח</h3>
<input bind:value={valume} />
<p>משקל יעד כולל: {total_weight} גרם</p>
<p>משקל מים: {water_weight} גרם</p>
<p>משקל בונד: {bond_weight} גרם</p>
<p>משקל שפכטל: {putty_weight} גרם</p>
<p>משקל מלט: {cement_weight} גרם</p>
