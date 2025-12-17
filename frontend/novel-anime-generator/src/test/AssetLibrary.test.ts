import { describe, it, expect, beforeEach } from 'vitest';
import { AssetLibrary } from '../services/AssetLibrary';
import { Asset, AssetType, AssetMetadata, SearchCriteria } from '../types/core';

describe('AssetLibrary', () => {
  let library: AssetLibrary;
  let testMetadata: AssetMetadata;

  beforeEach(() => {
    library = new AssetLibrary();
    testMetadata = {
      fileSize: 1024,
      format: 'png',
      dimensions: { width: 512, height: 512 },
      creator: 'test-user',
      project: 'test-project'
    };
  });

  describe('Asset Storage and Retrieval', () => {
    it('should store and retrieve assets', () => {
      const assetId = library.storeAsset(
        'character',
        'Test Character',
        'A test character design',
        '/path/to/character.png',
        testMetadata,
        ['anime', 'protagonist'],
        false
      );

      expect(assetId).toBeDefined();
      expect(assetId).toMatch(/^asset_/);

      const retrieved = library.retrieveAsset(assetId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Test Character');
      expect(retrieved!.assetType).toBe('character');
      expect(retrieved!.tags).toEqual(['anime', 'protagonist']);
      expect(retrieved!.isShared).toBe(false);
      expect(retrieved!.version).toBe('1.0.0');
    });

    it('should return null for non-existent assets', () => {
      const result = library.retrieveAsset('non-existent-id');
      expect(result).toBeNull();
    });

    it('should store assets with proper metadata', () => {
      const assetId = library.storeAsset(
        'scene',
        'Forest Scene',
        'A beautiful forest background',
        '/path/to/forest.jpg',
        {
          fileSize: 2048,
          format: 'jpg',
          dimensions: { width: 1920, height: 1080 },
          creator: 'artist-1',
          project: 'fantasy-novel'
        }
      );

      const asset = library.retrieveAsset(assetId)!;
      expect(asset.metadata.fileSize).toBe(2048);
      expect(asset.metadata.format).toBe('jpg');
      expect(asset.metadata.dimensions).toEqual({ width: 1920, height: 1080 });
      expect(asset.metadata.creator).toBe('artist-1');
      expect(asset.metadata.project).toBe('fantasy-novel');
    });
  });

  describe('Asset Updates and Deletion', () => {
    let assetId: string;

    beforeEach(() => {
      assetId = library.storeAsset(
        'character',
        'Original Character',
        'Original description',
        '/original/path.png',
        testMetadata,
        ['original'],
        false
      );
    });

    it('should update asset properties', () => {
      const success = library.updateAsset(assetId, {
        name: 'Updated Character',
        description: 'Updated description',
        tags: ['updated', 'character']
      });

      expect(success).toBe(true);

      const updated = library.retrieveAsset(assetId)!;
      expect(updated.name).toBe('Updated Character');
      expect(updated.description).toBe('Updated description');
      expect(updated.tags).toEqual(['updated', 'character']);
    });

    it('should create new version when file path changes', () => {
      const success = library.updateAsset(assetId, {
        filePath: '/new/path.png'
      }, 'Updated character design');

      expect(success).toBe(true);

      const updated = library.retrieveAsset(assetId)!;
      expect(updated.filePath).toBe('/new/path.png');
      expect(updated.version).toBe('1.0.1');

      const versions = library.getVersionHistory(assetId);
      expect(versions).toHaveLength(2);
      expect(versions[1].changeDescription).toBe('Updated character design');
    });

    it('should not update non-existent assets', () => {
      const success = library.updateAsset('non-existent', { name: 'New Name' });
      expect(success).toBe(false);
    });

    it('should delete assets', () => {
      const success = library.deleteAsset(assetId);
      expect(success).toBe(true);

      const retrieved = library.retrieveAsset(assetId);
      expect(retrieved).toBeNull();
    });

    it('should not delete non-existent assets', () => {
      const success = library.deleteAsset('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('Asset Search and Filtering', () => {
    beforeEach(() => {
      // Create test assets
      library.storeAsset('character', 'Hero Character', 'Main protagonist', '/hero.png', 
        { ...testMetadata, creator: 'artist-1', project: 'project-a' }, ['hero', 'protagonist']);
      
      library.storeAsset('character', 'Villain Character', 'Main antagonist', '/villain.png',
        { ...testMetadata, creator: 'artist-2', project: 'project-a' }, ['villain', 'antagonist']);
      
      library.storeAsset('scene', 'Castle Scene', 'Medieval castle', '/castle.jpg',
        { ...testMetadata, creator: 'artist-1', project: 'project-b' }, ['castle', 'medieval']);
      
      library.storeAsset('template', 'Action Template', 'Action scene template', '/action.template',
        { ...testMetadata, creator: 'artist-3', project: 'project-a' }, ['action', 'template']);
    });

    it('should search assets by type', () => {
      const criteria: SearchCriteria = { assetType: 'character' };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(2);
      expect(results.every(asset => asset.assetType === 'character')).toBe(true);
    });

    it('should search assets by tags', () => {
      const criteria: SearchCriteria = { tags: ['hero'] };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Hero Character');
    });

    it('should search assets by project', () => {
      const criteria: SearchCriteria = { project: 'project-a' };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(3);
      expect(results.every(asset => asset.metadata.project === 'project-a')).toBe(true);
    });

    it('should search assets by creator', () => {
      const criteria: SearchCriteria = { creator: 'artist-1' };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(2);
      expect(results.every(asset => asset.metadata.creator === 'artist-1')).toBe(true);
    });

    it('should search assets by text query', () => {
      const criteria: SearchCriteria = { query: 'castle' };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Castle Scene');
    });

    it('should search with multiple criteria', () => {
      const criteria: SearchCriteria = {
        assetType: 'character',
        project: 'project-a',
        tags: ['protagonist']
      };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Hero Character');
    });

    it('should return empty results for no matches', () => {
      const criteria: SearchCriteria = { query: 'nonexistent' };
      const results = library.searchAssets(criteria);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Asset Organization', () => {
    beforeEach(() => {
      library.storeAsset('character', 'Character 1', 'Description', '/char1.png',
        { ...testMetadata, project: 'project-1' }, ['tag1', 'tag2']);
      
      library.storeAsset('scene', 'Scene 1', 'Description', '/scene1.jpg',
        { ...testMetadata, project: 'project-1' }, ['tag2', 'tag3']);
      
      library.storeAsset('character', 'Character 2', 'Description', '/char2.png',
        { ...testMetadata, project: 'project-2' }, ['tag1', 'tag3']);
    });

    it('should get assets by type', () => {
      const characters = library.getAssetsByType('character');
      const scenes = library.getAssetsByType('scene');
      
      expect(characters).toHaveLength(2);
      expect(scenes).toHaveLength(1);
      expect(characters.every(asset => asset.assetType === 'character')).toBe(true);
    });

    it('should get assets by project', () => {
      const project1Assets = library.getAssetsByProject('project-1');
      const project2Assets = library.getAssetsByProject('project-2');
      
      expect(project1Assets).toHaveLength(2);
      expect(project2Assets).toHaveLength(1);
    });

    it('should get assets by tags', () => {
      const tag1Assets = library.getAssetsByTags(['tag1']);
      const tag2Assets = library.getAssetsByTags(['tag2']);
      const multiTagAssets = library.getAssetsByTags(['tag1', 'tag2']);
      
      expect(tag1Assets).toHaveLength(2);
      expect(tag2Assets).toHaveLength(2);
      expect(multiTagAssets).toHaveLength(3); // Union of assets with either tag
    });

    it('should get all tags', () => {
      const tags = library.getAllTags();
      
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
      expect(tags).toContain('tag3');
      expect(tags.length).toBeGreaterThan(3); // Includes default tags
    });

    it('should get all projects', () => {
      const projects = library.getAllProjects();
      
      expect(projects).toContain('project-1');
      expect(projects).toContain('project-2');
      expect(projects).toHaveLength(2);
    });
  });

  describe('Version Management', () => {
    let assetId: string;

    beforeEach(() => {
      assetId = library.storeAsset(
        'character',
        'Versioned Character',
        'A character with versions',
        '/v1/character.png',
        testMetadata
      );
    });

    it('should create new versions', () => {
      const version = library.createNewVersion(assetId, '/v2/character.png', 'Updated design');
      
      expect(version).toBeDefined();
      expect(version!.versionNumber).toBe('1.0.1');
      expect(version!.filePath).toBe('/v2/character.png');
      expect(version!.changeDescription).toBe('Updated design');

      const asset = library.retrieveAsset(assetId)!;
      expect(asset.version).toBe('1.0.1');
      expect(asset.filePath).toBe('/v2/character.png');
    });

    it('should not create version for non-existent asset', () => {
      const version = library.createNewVersion('non-existent', '/path.png', 'Change');
      expect(version).toBeNull();
    });

    it('should get version history', () => {
      library.createNewVersion(assetId, '/v2/character.png', 'Version 2');
      library.createNewVersion(assetId, '/v3/character.png', 'Version 3');
      
      const history = library.getVersionHistory(assetId);
      
      expect(history).toHaveLength(3);
      expect(history[0].versionNumber).toBe('1.0.0');
      expect(history[1].versionNumber).toBe('1.0.1');
      expect(history[2].versionNumber).toBe('1.0.2');
    });

    it('should rollback to previous version', () => {
      library.createNewVersion(assetId, '/v2/character.png', 'Version 2');
      library.createNewVersion(assetId, '/v3/character.png', 'Version 3');
      
      const success = library.rollbackToVersion(assetId, '1.0.1');
      expect(success).toBe(true);
      
      const asset = library.retrieveAsset(assetId)!;
      expect(asset.version).toBe('1.0.1');
      expect(asset.filePath).toBe('/v2/character.png');
    });

    it('should not rollback to non-existent version', () => {
      const success = library.rollbackToVersion(assetId, '2.0.0');
      expect(success).toBe(false);
    });

    it('should compare versions', () => {
      library.createNewVersion(assetId, '/v2/character.png', 'Updated design');
      
      const comparison = library.compareVersions(assetId, '1.0.0', '1.0.1');
      
      expect(comparison.version1).toBeDefined();
      expect(comparison.version2).toBeDefined();
      expect(comparison.differences).toHaveLength(2); // File path and change description
      expect(comparison.differences[0]).toContain('File path changed');
    });
  });

  describe('Asset Sharing', () => {
    let assetId: string;

    beforeEach(() => {
      assetId = library.storeAsset(
        'template',
        'Shared Template',
        'A template for sharing',
        '/template.json',
        testMetadata,
        ['template'],
        false
      );
    });

    it('should share assets', () => {
      const success = library.shareAsset(assetId);
      expect(success).toBe(true);
      
      const asset = library.retrieveAsset(assetId)!;
      expect(asset.isShared).toBe(true);
      
      const sharedAssets = library.getSharedAssets();
      expect(sharedAssets).toHaveLength(1);
      expect(sharedAssets[0].id).toBe(assetId);
    });

    it('should unshare assets', () => {
      library.shareAsset(assetId);
      
      const success = library.unshareAsset(assetId);
      expect(success).toBe(true);
      
      const asset = library.retrieveAsset(assetId)!;
      expect(asset.isShared).toBe(false);
      
      const sharedAssets = library.getSharedAssets();
      expect(sharedAssets).toHaveLength(0);
    });

    it('should not share non-existent assets', () => {
      const success = library.shareAsset('non-existent');
      expect(success).toBe(false);
    });

    it('should synchronize shared assets', () => {
      // Create shared asset
      library.shareAsset(assetId);
      
      const result = library.synchronizeSharedAssets('target-project');
      
      expect(result.synchronized).toContain('Shared Template');
      expect(result.conflicts).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Asset Validation', () => {
    it('should validate valid assets', () => {
      const validAsset = {
        name: 'Valid Asset',
        assetType: 'character' as AssetType,
        filePath: '/valid/path.png',
        metadata: {
          fileSize: 1024,
          format: 'png'
        },
        tags: ['valid', 'test']
      };
      
      const result = library.validateAsset(validAsset);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidAsset = {
        description: 'Missing required fields'
      };
      
      const result = library.validateAsset(invalidAsset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'MISSING_NAME')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_TYPE')).toBe(true);
      expect(result.errors.some(e => e.code === 'MISSING_FILE_PATH')).toBe(true);
    });

    it('should detect invalid file size', () => {
      const invalidAsset = {
        name: 'Test Asset',
        assetType: 'character' as AssetType,
        filePath: '/path.png',
        metadata: {
          fileSize: -1,
          format: 'png'
        }
      };
      
      const result = library.validateAsset(invalidAsset);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_FILE_SIZE')).toBe(true);
    });

    it('should warn about large file sizes', () => {
      const largeAsset = {
        name: 'Large Asset',
        assetType: 'scene' as AssetType,
        filePath: '/large.jpg',
        metadata: {
          fileSize: 150 * 1024 * 1024, // 150MB
          format: 'jpg'
        }
      };
      
      const result = library.validateAsset(largeAsset);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'LARGE_FILE_SIZE')).toBe(true);
    });
  });

  describe('Statistics and Analytics', () => {
    beforeEach(() => {
      library.storeAsset('character', 'Char 1', 'Desc', '/char1.png',
        { fileSize: 1000, format: 'png', project: 'proj-1' }, ['hero']);
      
      library.storeAsset('character', 'Char 2', 'Desc', '/char2.png',
        { fileSize: 2000, format: 'png', project: 'proj-1' }, ['villain']);
      
      library.storeAsset('scene', 'Scene 1', 'Desc', '/scene1.jpg',
        { fileSize: 5000, format: 'jpg', project: 'proj-2' }, ['outdoor']);
    });

    it('should provide comprehensive statistics', () => {
      const stats = library.getStatistics();
      
      expect(stats.totalAssets).toBe(3);
      expect(stats.assetsByType.character).toBe(2);
      expect(stats.assetsByType.scene).toBe(1);
      expect(stats.assetsByProject['proj-1']).toBe(2);
      expect(stats.assetsByProject['proj-2']).toBe(1);
      expect(stats.totalSize).toBe(8000);
      expect(stats.averageFileSize).toBe(8000 / 3);
      expect(stats.sharedAssetsCount).toBe(0);
    });

    it('should track most used tags', () => {
      // Add more assets with overlapping tags
      library.storeAsset('template', 'Template 1', 'Desc', '/template1.json',
        { fileSize: 500, format: 'json' }, ['hero', 'template']);
      
      const stats = library.getStatistics();
      
      expect(stats.mostUsedTags.length).toBeGreaterThan(0);
      const heroTag = stats.mostUsedTags.find(t => t.tag === 'hero');
      expect(heroTag?.count).toBe(2);
    });
  });

  describe('Import/Export', () => {
    let assetIds: string[];

    beforeEach(() => {
      assetIds = [
        library.storeAsset('character', 'Export Char', 'Desc', '/char.png', testMetadata, ['export']),
        library.storeAsset('scene', 'Export Scene', 'Desc', '/scene.jpg', testMetadata, ['export'])
      ];
    });

    it('should export assets to JSON', () => {
      const jsonData = library.exportAssets(assetIds);
      
      expect(jsonData).toBeDefined();
      
      const parsed = JSON.parse(jsonData);
      expect(parsed.assets).toHaveLength(2);
      expect(parsed.versions).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBe('1.0.0');
    });

    it('should export all assets when no IDs specified', () => {
      const jsonData = library.exportAssets();
      
      const parsed = JSON.parse(jsonData);
      expect(parsed.assets.length).toBeGreaterThanOrEqual(2);
    });

    it('should import assets from JSON', () => {
      const jsonData = library.exportAssets(assetIds);
      
      // Clear library and import
      library.clear();
      const result = library.importAssets(jsonData);
      
      expect(result.imported).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      
      // Verify assets were imported
      const allAssets = library.searchAssets({});
      expect(allAssets).toHaveLength(2);
    });

    it('should skip duplicate assets during import', () => {
      const jsonData = library.exportAssets(assetIds);
      
      // Import again without clearing
      const result = library.importAssets(jsonData);
      
      expect(result.imported).toHaveLength(0);
      expect(result.skipped).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid import data', () => {
      const result = library.importAssets('invalid json');
      
      expect(result.imported).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search criteria', () => {
      library.storeAsset('character', 'Test', 'Desc', '/test.png', testMetadata);
      
      const results = library.searchAssets({});
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle assets without projects', () => {
      const assetId = library.storeAsset('character', 'No Project', 'Desc', '/test.png',
        { fileSize: 1024, format: 'png' });
      
      const asset = library.retrieveAsset(assetId)!;
      expect(asset.metadata.project).toBeUndefined();
      
      const projectAssets = library.getAssetsByProject('any-project');
      expect(projectAssets).toHaveLength(0);
    });

    it('should handle empty tags gracefully', () => {
      const assetId = library.storeAsset('character', 'No Tags', 'Desc', '/test.png',
        testMetadata, []);
      
      const asset = library.retrieveAsset(assetId)!;
      expect(asset.tags).toEqual([]);
      
      const taggedAssets = library.getAssetsByTags(['any-tag']);
      expect(taggedAssets).toHaveLength(0);
    });

    it('should handle version operations on non-existent assets', () => {
      const history = library.getVersionHistory('non-existent');
      expect(history).toHaveLength(0);
      
      const rollback = library.rollbackToVersion('non-existent', '1.0.0');
      expect(rollback).toBe(false);
      
      const comparison = library.compareVersions('non-existent', '1.0.0', '1.0.1');
      expect(comparison.version1).toBeNull();
      expect(comparison.version2).toBeNull();
    });
  });
});