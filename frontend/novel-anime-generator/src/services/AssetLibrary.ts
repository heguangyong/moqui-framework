import type {
  Asset,
  AssetType,
  AssetMetadata,
  AssetVersion,
  SearchCriteria,
  ValidationResult
} from '../types/core';

/**
 * Asset Library Service
 * 
 * Manages and provides access to reusable visual and narrative assets.
 * Supports asset storage, versioning, search, and cross-project sharing.
 */
export class AssetLibrary {
  private assets: Map<string, Asset> = new Map();
  private versions: Map<string, AssetVersion[]> = new Map();
  private tags: Map<string, Set<string>> = new Map(); // tag -> asset IDs
  private projects: Map<string, Set<string>> = new Map(); // project -> asset IDs
  private sharedAssets: Set<string> = new Set();

  constructor() {
    this.initializeDefaultTags();
  }

  /**
   * Store a new asset in the library
   */
  storeAsset(
    assetType: AssetType,
    name: string,
    description: string,
    filePath: string,
    metadata: AssetMetadata,
    tags: string[] = [],
    isShared: boolean = false
  ): string {
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const asset: Asset = {
      id: assetId,
      assetType,
      name,
      description,
      filePath,
      metadata,
      version: '1.0.0',
      isShared,
      createdDate: new Date(),
      tags
    };

    this.assets.set(assetId, asset);

    // Initialize version history
    this.versions.set(assetId, [{
      id: `version_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      assetId,
      versionNumber: '1.0.0',
      filePath,
      changeDescription: 'Initial version',
      createdDate: new Date()
    }]);

    // Update tag mappings
    this.updateTagMappings(assetId, tags);

    // Update project mappings if specified
    if (metadata.project) {
      this.updateProjectMappings(assetId, metadata.project);
    }

    // Update shared assets set
    if (isShared) {
      this.sharedAssets.add(assetId);
    }

    return assetId;
  }

  /**
   * Retrieve an asset by ID
   */
  retrieveAsset(assetId: string): Asset | null {
    return this.assets.get(assetId) || null;
  }

  /**
   * Update an existing asset
   */
  updateAsset(
    assetId: string,
    updates: Partial<Asset>,
    changeDescription: string = 'Asset updated'
  ): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // Create new version if file path changed
    if (updates.filePath && updates.filePath !== asset.filePath) {
      this.createNewVersion(assetId, updates.filePath, changeDescription);
    }

    // Update tag mappings if tags changed
    if (updates.tags) {
      this.removeFromTagMappings(assetId, asset.tags);
      this.updateTagMappings(assetId, updates.tags);
    }

    // Update project mappings if project changed
    if (updates.metadata?.project && updates.metadata.project !== asset.metadata.project) {
      if (asset.metadata.project) {
        this.removeFromProjectMappings(assetId, asset.metadata.project);
      }
      this.updateProjectMappings(assetId, updates.metadata.project);
    }

    // Update shared status
    if (updates.isShared !== undefined) {
      if (updates.isShared) {
        this.sharedAssets.add(assetId);
      } else {
        this.sharedAssets.delete(assetId);
      }
    }

    // Apply updates
    Object.assign(asset, updates);
    this.assets.set(assetId, asset);

    return true;
  }

  /**
   * Delete an asset and all its versions
   */
  deleteAsset(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    // Remove from all mappings
    this.removeFromTagMappings(assetId, asset.tags);
    if (asset.metadata.project) {
      this.removeFromProjectMappings(assetId, asset.metadata.project);
    }
    this.sharedAssets.delete(assetId);

    // Remove asset and versions
    this.assets.delete(assetId);
    this.versions.delete(assetId);

    return true;
  }

  /**
   * Search assets based on criteria
   */
  searchAssets(criteria: SearchCriteria): Asset[] {
    let results = Array.from(this.assets.values());

    // Filter by asset type
    if (criteria.assetType) {
      results = results.filter(asset => asset.assetType === criteria.assetType);
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(asset => 
        criteria.tags!.some(tag => asset.tags.includes(tag))
      );
    }

    // Filter by project
    if (criteria.project) {
      results = results.filter(asset => asset.metadata.project === criteria.project);
    }

    // Filter by creator
    if (criteria.creator) {
      results = results.filter(asset => asset.metadata.creator === criteria.creator);
    }

    // Filter by date range
    if (criteria.dateRange) {
      results = results.filter(asset => {
        const assetDate = asset.createdDate;
        return assetDate >= criteria.dateRange!.start && assetDate <= criteria.dateRange!.end;
      });
    }

    // Text search in name and description
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.description.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by relevance (most recent first, then by name)
    results.sort((a, b) => {
      // First sort by creation date (newest first)
      const dateComparison = b.createdDate.getTime() - a.createdDate.getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // Then by name alphabetically
      return a.name.localeCompare(b.name);
    });

    return results;
  }

  /**
   * Get assets by type
   */
  getAssetsByType(assetType: AssetType): Asset[] {
    return Array.from(this.assets.values()).filter(asset => asset.assetType === assetType);
  }

  /**
   * Get assets by project
   */
  getAssetsByProject(projectName: string): Asset[] {
    const assetIds = this.projects.get(projectName);
    if (!assetIds) return [];

    return Array.from(assetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined);
  }

  /**
   * Get shared assets
   */
  getSharedAssets(): Asset[] {
    return Array.from(this.sharedAssets)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined);
  }

  /**
   * Get assets by tags
   */
  getAssetsByTags(tags: string[]): Asset[] {
    const matchingAssetIds = new Set<string>();

    tags.forEach(tag => {
      const assetIds = this.tags.get(tag);
      if (assetIds) {
        assetIds.forEach(id => matchingAssetIds.add(id));
      }
    });

    return Array.from(matchingAssetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined);
  }

  /**
   * Get all available tags
   */
  getAllTags(): string[] {
    return Array.from(this.tags.keys()).sort();
  }

  /**
   * Get all projects
   */
  getAllProjects(): string[] {
    return Array.from(this.projects.keys()).sort();
  }

  /**
   * Create a new version of an asset
   */
  createNewVersion(
    assetId: string,
    newFilePath: string,
    changeDescription: string
  ): AssetVersion | null {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    const versions = this.versions.get(assetId) || [];
    const currentVersion = asset.version;
    const newVersionNumber = this.incrementVersion(currentVersion);

    const newVersion: AssetVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      assetId,
      versionNumber: newVersionNumber,
      filePath: newFilePath,
      changeDescription,
      createdDate: new Date()
    };

    versions.push(newVersion);
    this.versions.set(assetId, versions);

    // Update asset with new version
    asset.version = newVersionNumber;
    asset.filePath = newFilePath;
    this.assets.set(assetId, asset);

    return newVersion;
  }

  /**
   * Get version history for an asset
   */
  getVersionHistory(assetId: string): AssetVersion[] {
    return this.versions.get(assetId) || [];
  }

  /**
   * Rollback to a previous version
   */
  rollbackToVersion(assetId: string, versionNumber: string): boolean {
    const asset = this.assets.get(assetId);
    const versions = this.versions.get(assetId);
    
    if (!asset || !versions) return false;

    const targetVersion = versions.find(v => v.versionNumber === versionNumber);
    if (!targetVersion) return false;

    // Update asset to use the target version
    asset.version = targetVersion.versionNumber;
    asset.filePath = targetVersion.filePath;
    this.assets.set(assetId, asset);

    return true;
  }

  /**
   * Compare two versions of an asset
   */
  compareVersions(assetId: string, version1: string, version2: string): {
    version1: AssetVersion | null;
    version2: AssetVersion | null;
    differences: string[];
  } {
    const versions = this.versions.get(assetId) || [];
    const v1 = versions.find(v => v.versionNumber === version1) || null;
    const v2 = versions.find(v => v.versionNumber === version2) || null;

    const differences: string[] = [];

    if (v1 && v2) {
      if (v1.filePath !== v2.filePath) {
        differences.push(`File path changed from ${v1.filePath} to ${v2.filePath}`);
      }
      if (v1.changeDescription !== v2.changeDescription) {
        differences.push(`Change description: "${v1.changeDescription}" vs "${v2.changeDescription}"`);
      }
    }

    return { version1: v1, version2: v2, differences };
  }

  /**
   * Share an asset across projects
   */
  shareAsset(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.isShared = true;
    this.sharedAssets.add(assetId);
    this.assets.set(assetId, asset);

    return true;
  }

  /**
   * Unshare an asset
   */
  unshareAsset(assetId: string): boolean {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    asset.isShared = false;
    this.sharedAssets.delete(assetId);
    this.assets.set(assetId, asset);

    return true;
  }

  /**
   * Synchronize shared assets across projects
   */
  synchronizeSharedAssets(targetProject: string): {
    synchronized: string[];
    conflicts: string[];
    errors: string[];
  } {
    const synchronized: string[] = [];
    const conflicts: string[] = [];
    const errors: string[] = [];

    this.sharedAssets.forEach(assetId => {
      try {
        const asset = this.assets.get(assetId);
        if (!asset) {
          errors.push(`Asset ${assetId} not found`);
          return;
        }

        // Check if asset already exists in target project
        const projectAssets = this.getAssetsByProject(targetProject);
        const existingAsset = projectAssets.find(a => 
          a.name === asset.name && a.assetType === asset.assetType
        );

        if (existingAsset) {
          // Check if versions differ
          if (existingAsset.version !== asset.version) {
            conflicts.push(`Version conflict for ${asset.name}: ${existingAsset.version} vs ${asset.version}`);
          }
        } else {
          // Add asset to target project
          this.updateProjectMappings(assetId, targetProject);
          synchronized.push(asset.name);
        }
      } catch (error) {
        errors.push(`Error synchronizing asset ${assetId}: ${error}`);
      }
    });

    return { synchronized, conflicts, errors };
  }

  /**
   * Validate asset metadata
   */
  validateAsset(asset: Partial<Asset>): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Required fields validation
    if (!asset.name || asset.name.trim().length === 0) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Asset name is required',
        field: 'name',
        severity: 'error'
      });
    }

    if (!asset.assetType) {
      errors.push({
        code: 'MISSING_TYPE',
        message: 'Asset type is required',
        field: 'assetType',
        severity: 'error'
      });
    }

    if (!asset.filePath || asset.filePath.trim().length === 0) {
      errors.push({
        code: 'MISSING_FILE_PATH',
        message: 'File path is required',
        field: 'filePath',
        severity: 'error'
      });
    }

    // Metadata validation
    if (asset.metadata) {
      if (asset.metadata.fileSize && asset.metadata.fileSize <= 0) {
        errors.push({
          code: 'INVALID_FILE_SIZE',
          message: 'File size must be greater than 0',
          field: 'metadata.fileSize',
          severity: 'error'
        });
      }

      if (asset.metadata.fileSize && asset.metadata.fileSize > 100 * 1024 * 1024) {
        warnings.push({
          code: 'LARGE_FILE_SIZE',
          message: 'File size is very large (>100MB)',
          field: 'metadata.fileSize',
          severity: 'warning'
        });
      }
    }

    // Tags validation
    if (asset.tags) {
      asset.tags.forEach((tag, index) => {
        if (!tag || tag.trim().length === 0) {
          warnings.push({
            code: 'EMPTY_TAG',
            message: `Tag at index ${index} is empty`,
            field: `tags[${index}]`,
            severity: 'warning'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get asset statistics
   */
  getStatistics(): {
    totalAssets: number;
    assetsByType: Record<AssetType, number>;
    assetsByProject: Record<string, number>;
    sharedAssetsCount: number;
    totalSize: number;
    averageFileSize: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
  } {
    const assets = Array.from(this.assets.values());
    
    const assetsByType = assets.reduce((acc, asset) => {
      acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
      return acc;
    }, {} as Record<AssetType, number>);

    const assetsByProject = assets.reduce((acc, asset) => {
      if (asset.metadata.project) {
        acc[asset.metadata.project] = (acc[asset.metadata.project] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalSize = assets.reduce((sum, asset) => sum + (asset.metadata.fileSize || 0), 0);
    const averageFileSize = assets.length > 0 ? totalSize / assets.length : 0;

    // Calculate most used tags
    const tagCounts = new Map<string, number>();
    assets.forEach(asset => {
      asset.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAssets: assets.length,
      assetsByType,
      assetsByProject,
      sharedAssetsCount: this.sharedAssets.size,
      totalSize,
      averageFileSize,
      mostUsedTags
    };
  }

  /**
   * Export assets to JSON
   */
  exportAssets(assetIds?: string[]): string {
    const assetsToExport = assetIds 
      ? assetIds.map(id => this.assets.get(id)).filter(Boolean)
      : Array.from(this.assets.values());

    const exportData = {
      assets: assetsToExport,
      versions: assetIds 
        ? Object.fromEntries(assetIds.map(id => [id, this.versions.get(id) || []]))
        : Object.fromEntries(this.versions.entries()),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import assets from JSON
   */
  importAssets(jsonData: string): {
    imported: string[];
    skipped: string[];
    errors: string[];
  } {
    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.assets || !Array.isArray(importData.assets)) {
        throw new Error('Invalid import data structure');
      }

      importData.assets.forEach((assetData: any) => {
        try {
          // Validate asset data
          const validation = this.validateAsset(assetData);
          if (!validation.isValid) {
            errors.push(`Validation failed for ${assetData.name}: ${validation.errors.map(e => e.message).join(', ')}`);
            return;
          }

          // Check if asset already exists
          const existingAsset = Array.from(this.assets.values()).find(a => 
            a.name === assetData.name && a.assetType === assetData.assetType
          );

          if (existingAsset) {
            skipped.push(assetData.name);
            return;
          }

          // Generate new ID and import
          const newAssetId = this.storeAsset(
            assetData.assetType,
            assetData.name,
            assetData.description,
            assetData.filePath,
            assetData.metadata,
            assetData.tags || [],
            assetData.isShared || false
          );

          // Import version history if available
          if (importData.versions && importData.versions[assetData.id]) {
            const versions = importData.versions[assetData.id];
            this.versions.set(newAssetId, versions.map((v: any) => ({
              ...v,
              assetId: newAssetId
            })));
          }

          imported.push(assetData.name);
        } catch (error) {
          errors.push(`Error importing ${assetData.name}: ${error}`);
        }
      });
    } catch (error) {
      errors.push(`Failed to parse import data: ${error}`);
    }

    return { imported, skipped, errors };
  }

  /**
   * Clear all assets (for testing)
   */
  clear(): void {
    this.assets.clear();
    this.versions.clear();
    this.tags.clear();
    this.projects.clear();
    this.sharedAssets.clear();
  }

  // Private helper methods

  private updateTagMappings(assetId: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(assetId);
    });
  }

  private removeFromTagMappings(assetId: string, tags: string[]): void {
    tags.forEach(tag => {
      const assetIds = this.tags.get(tag);
      if (assetIds) {
        assetIds.delete(assetId);
        if (assetIds.size === 0) {
          this.tags.delete(tag);
        }
      }
    });
  }

  private updateProjectMappings(assetId: string, project: string): void {
    if (!this.projects.has(project)) {
      this.projects.set(project, new Set());
    }
    this.projects.get(project)!.add(assetId);
  }

  private removeFromProjectMappings(assetId: string, project: string): void {
    const assetIds = this.projects.get(project);
    if (assetIds) {
      assetIds.delete(assetId);
      if (assetIds.size === 0) {
        this.projects.delete(project);
      }
    }
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  private initializeDefaultTags(): void {
    // Initialize with common tags for better organization
    const defaultTags = [
      'character', 'background', 'effect', 'template', 'style',
      'anime', 'realistic', 'cartoon', 'fantasy', 'modern',
      'indoor', 'outdoor', 'portrait', 'landscape', 'action'
    ];

    defaultTags.forEach(tag => {
      this.tags.set(tag, new Set());
    });
  }
}