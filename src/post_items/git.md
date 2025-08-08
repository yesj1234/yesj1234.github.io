---
title: Everything you need to know about git.
description: How to use git as a professional developer. 
author: jack
date: 2025. 05. 22.
published: true
tags: [git]
---
## Git

Git is the distributed version control system(VCS).

Nearly every developer in the world uses it to manage their code. It has quite a monopoly on VCS. Developers use Git to:

- Keep a history of their code changes.
- Revert mistakes made in their code.
- Collaborate with other developers.
- Make backups of their code.
- And much more.



### Porcelain and Plumbing

In Git, commands are divided into high-level ("porcelain") commands and low-level ("plumbing") commands. The porcelain commands are the ones that you will use most often as a developer to interact with your code. Some porcelain commands are:

- `git status`

- `git add`

- `git commit`

- `git push`

- `git pull`

- `git log`

Some examples of plumbing commands are: 

- `git apply`

- `git commit-tree`

- `git hash-object`

### Quick Config

We need to configure Git to contain _your_ information. Whenever code changes, Git tracks who made the change.

To ensure you get proper credit (or more likely, blame) for all the code you write, you need to set your name and email.

Git comes with a configuration both at the global and the repo (project) level. Most of the time, you'll just use the global config.

#### Config

The very first step of any project is to create a repository. A Git "repository" (or "repo") represents a single project.

You'll typically have one repository for each project you work on.

A repo is essentially just a directory that contains a project (other directories and files). The only difference is that it also
contains a hidden `.git` directory. That hidden directory is where Git stores all of its internal tracking and versioning information for the proejct.

#### Status

A file can be in one of several states in a Git repository. Here are a few importatnt ones:

- `untracked`: Not being tracked by Git

- `staged`: Marked for inclusion in the next commit

- `committed`: Saved to the repository's history

The `git status` command shows you the current state of your repo. It will tell you which files are untracked, staged, and commited.

##### Staging

Untracked files need to be staged(add it to the "index") with the `git add` command before committing it later.

Without staging, no files are included in the commit -- only the files you explicitly git add will be commited.

Here's the command:

`git add <path-to-file | pattern>`

For example: 

```bash
git add i-use-arch.btw
```

##### Commit

After staging a file, we can commit it.

A commit is a snapshot of the repository at a given point in time. It's a way to save the state of the repository, and it's how 
Git keeps track of changes to the project. A commit comes with a message that describes the changes made in the commit. 

Here's how to commit all of your staged files:

```bash
git commit -m "your message here"
```

##### Git Log

A Git repo is a (potentially very long) list of commits, where each commit represents the full state of the repository at a given point in time.

The git log command shows a history of the commits in a repository. This is what makes Git a version control system.

You can see:

- Who made a commit

- When the commit was made

- What was changed

Each commit has a unique identifier called a "commit hash". This is a long string of characters that uniquely identifies the commit.

For example,

```bash
5ba786fcc93e8092831c01e71444b9baa2228a4f
```

For convenience, you can refer to any commit or change within Git by using the first 7 characters of its hash.

While commit hashes are derived from their content changes, there's also some other stuff that affects the end hash.

For example:

- The commit message

- The author's name and email

- The date and time

- Parent (previous) commit hashes

All this to say that hashes are (almost) always unique, and because they're generated automatically for you, you don't need to worry too much about what goes into them right now.

> Note: Hash = SHA
> Git uses a cryptographic hash function called SHA-1 to generate commit hashes.
> It's important to know because you might also hear commit hashes referred to as "SHAs".



## Plumbing

### Trees and Blobs

Some terms to know: 

- `tree`: git's way of storing a directory

- `blob`: git's way of storing a file


### Storing Data

Git stores an entire snapshot of files on a per-commit level.

While it's true that Git stores entire snapshots, it does have some performance optimizations so that your `.git` directory doesn't get too unbearably large.

- Git compresses and packs files to store them more efficiently.

- Git deduplicates files that are files that are the same across different commits. If a file doesn't change between commits, Git will only store it once.




## Sources

1. [Youtube video - learn git](https://www.youtube.com/watch?v=rH3zE7VlIMs)