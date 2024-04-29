---
title: Module * Package & Import in Python
description: How modules, packages and imports are handled in python.
author: jack
date: 2024.04.29
published: true
tags: [Python]
---

# Table of Contents

# Module

Collection of Functions, Variables, Classes

## Why do we need Module ?

- To reuse the code
- To seperate the concerns and manage the source code effectively

# Package

Collection of Modules.

## Package Initialization

touch **init**.py

- reducing the path when importing
- reducing the scope of the module imported from the package
- run the mandatory codes that should be ran when imported.

# Order of python searching for the imported library

1. sys.modules
2. built-in modules
3. sys.path
