---
title: Frontmatter
author: jack
date: 2024-04-26
published: false
description: Frontmatter in Mdsvex explained.
tags: [SvelteKit, Mdsvex]
---

# Table of Contents

# Frontmatter

YAML frontmatter is a common convention in blog posts and mdsvex supports it out of the box.
If you want to use a custom language or marker for frontmatter than you can use the frontmatter option to modify the default behaviour.

Mdsvex integrates well with frontmatter providing additional flexibility when authoring documents.

All variables defined in frontmatter are available directly in the component, exactly as you wrote them.

```markdown
---
title: My lovely article
author: Dr. Fabuloso the Fabulous
---

# {title} by {author}

Some amazing content.
```

Additionally, all of these variables are exported as a single object named metadata from the context="module" [TODO: make highlight mark]script, so they can easily be imported in javascript

```html
<script context="module">
	export let metadata = {
		title: 'My lovely article',
		author: 'Dr. Fabuloso the Fabulous'
	};
</script>
```

Due to how context="module" scripts work, this metadata can be imported like this.

```javascript
import { metadata } from './some-mdsvex-file.svx';
```

Frontmatter also interacts with layouts, you can find more details in the Layout section.
