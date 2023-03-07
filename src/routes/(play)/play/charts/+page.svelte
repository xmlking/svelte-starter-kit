

<script>
	import { LayerCake, Svg } from 'layercake';
	import Line from '$lib/charts/Line.svelte';
	import Area from '$lib/charts/Area.svelte';
	import AxisX from '$lib/charts/AxisX.svelte';
	import AxisY from '$lib/charts/AxisY.svelte';
	import points from './data/points.csv';
	const xKey = 'myX';
	const yKey = 'myY';
	points.forEach(row => {
		row[yKey] = +row[yKey];
	});
</script>

<style>
	.chart-container {
		width: 100%;
		height: 100vh;
	}
</style>

<div class="chart-container">
	<LayerCake
		padding={{ right: 10, bottom: 20, left: 25 }}
		x={xKey}
		y={yKey}
		yDomain={[0, null]}
		data={points}
	>
		<Svg>
			<AxisX/>
			<AxisY/>
			<Line/>
			<Area/>
		</Svg>
	</LayerCake>
</div>
