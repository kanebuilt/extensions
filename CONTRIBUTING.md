# Contributing Extensions

To learn how to write custom extensions, see our documentation:

- <https://docs.turbowarp.org/development/extensions/introduction>
- <https://docs.turbowarp.org/development/extensions/unsandboxed>
- <https://docs.turbowarp.org/development/extensions/compatibility>
- <https://docs.turbowarp.org/development/extensions/better-development-server>
- and more in the sidebar of those pages

The rest of this page is about this specific repository.

## AI Policy

Like any tool, AI has good uses and bad uses. Follow these guidelines to avoid wasting your time and ours:

- **No AI-generated images under any condition**. We would rather not have an image than use AI-generated content. Many humans have very finely tuned AI detectors. They won't be happy when they notice.
- **Be transparent about what tools you used and to what extent**. There's a lot of ways to tell if code was written with an LLM, so there's no reason to lie.
- **Don't submit code that is entirely LLM-generated**. There must be a human involved in reviewing and testing all changes. Even if you didn't write the code, it's under your name. If you can't understand your own code, we have no hope of understanding either.
- **Reviewers are volunteers**. They are free to weigh your usage of AI in deciding whether or when to review your change.

## Acceptance criteria

These categories of extensions are **highly discouraged**:

- Broad "Utilities" extensions. Break them up into multiple extensions instead.
- Extensions that are very similar to existing ones. Consider modifying the existing extension instead.
- Very niche extensions. You can write the extension for yourself, then import it as a file instead without needing us to review.
- Extensions whose primary purpose is monetization. It isn't in the spirit of a free and open-source project.
- Joke extensions. Things that are funny to you are not funny to everyone, especially when we get bug reports about it.

---

> [!IMPORTANT]
>
> Every merged extension is more code that we are expected to maintain indefinitely, even if you disappear. Broken extensions mean that real projects by real people no longer work. If the renderer is rewritten one day, we will have to ensure that all extensions still work. That's not a small commitment.
>
> We're all volunteers who all have lives outside of TurboWarp extensions. Many have full-time jobs or are full-time students. We'll get to you as soon as we can, so please be patient.

## Naming Your Extension

New extensions should be added in a user folder. You can name your folder anything you want; common choices are your GitHub username or your Scratch username. You can largely choose whatever you want. These folders are just for organization; other people are still allowed to edit your extension. Folder name changes are only granted in rare circumstances, so please get it right the first time.

## Metadata

All extensions need a metadata comment at the start of the file, before any code.

```js
// Name: My Cool Extension
// ID: extensionid
// Description: Does a very cool thing. This must have punctuation at the end!
// By: GarboMuffin <https://scratch.mit.edu/users/GarboMuffin/>
// Original: TestMuffin
// License: MPL-2.0
```

`By` allows you to credit yourself. `Original` is used if the extension is based on another person's work. They both use the same format of `Name` or `Name <https://scratch.mit.edu/users/username>`. You can repeat both of these as many times as needed, just add another `// By: ...` comment.
