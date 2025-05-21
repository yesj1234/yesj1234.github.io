<article>
	<slot />
</article>

<style>
	article {
		margin-top: calc(var(--spacing-unit) * 8);
		padding-left: calc(var(--spacing-unit) * 20);
		padding-right: calc(var(--spacing-unit) * 20);

		transition: transform 0.15s ease;
		@media screen and (max-width: 768px) {
			font-size: 1rem;
		}
	}

	article:hover {
		transform: scale(1.01);
	}
</style>
