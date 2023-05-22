<script lang="ts">
	export let url: string;
	export let content: string;
	export let title: string | null = null;
</script>

<a href={url} {title}>{content}</a>
