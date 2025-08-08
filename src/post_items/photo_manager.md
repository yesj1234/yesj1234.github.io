---
title: Package - Photo manager by fluttercandies
description: Exploring Flutter photo manager package. 
author: jack
date: 2025. 07. 16.
published: true
tags: [Flutter]
---

## Prepare for use

### pubspec.yaml

### Import

### Configuring native platforms

## Usage

### Request for permission

### Get albums/folders(`AssetPathEntity`)

Albums or folders are abstracted as the `AssetPathEntity` class. It represents a bucket in the `MediaStore` on Android, and the `PHAssetCollection` object on iOS/macOS. to get all of them: 

```dart
final List<AssetPathEntity> paths = await PhotoManager.getAssetPathList(); 
```

Params of `getAssetPathList`:

- hasAll: Set to true when you need an album containing all assets. Defaults to True.

- onlyAll: Use this property if you only need one album containing all assets. Defaults to False.

- type: Type of media resources(video, image, audio). Defaults to RequestType.common

- filterOption: Used to filter resource files. Defaults to FilterOptionGroup()

- pathFilterOption: Only valid for iOS and macOS, for the corresponding album type. Include all by default.

### Get assets(`AssetEntity`)

Assets(images/video/audios) are abstracted as the `AssetEntity` class. It represents a series of fields with `MediaStore` on Android, and the `PHAsset` object on iOS/macOS. 

From `AssetEntity`...

You can use the pagination method.

```dart
final List<AssetEntity> entities = await path.getAssetListPaged(page: 0, size: 80); 
```

Or use the range method:

```dart
final List<AssetEntity> entities = await path.getAssetListRanged(start: 0, end: 80); 
```

From `PhotoManager`(Since 2.6)

First, you need to get count of assets:

```dart
final int count = await PhotoManager.getAssetCount(); 
```

Then, you can use the pagination method:

```dart
final List<AssetEntity> entities = await PhotoManager.getAssetListPaged(page: 0, pageCount: 80);
```

Or use the range method:

```dart
final List<AssetEntity> entities = await PhotoManager.getAssetListRange(start: 0, end: 80);
```

### Filtering

### Caching

### Native extra configs

