import type { Asset, AssetType, SearchCriteria } from '../types/core';

/**
 * Advanced Asset Search Engine
 * 
 * Provides enhanced search capabilities with ranking, relevance scoring,
 * and fuzzy matching for the Asset Library.
 */
export class AssetSearchEngine {
  private assets: Asset[] = [];
  private searchIndex: Map<string, Set<string>> = new Map(); // term -> asset IDs
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> asset IDs
  private typeIndex: Map<AssetType, Set<string>> = new Map(); // type -> asset IDs

  /**
   * Update the search engine with current assets
   */
  updateIndex(assets: Asset[]): void {
    this.assets = assets;
    this.rebuildSearchIndex();
  }

  /**
   * Perform advanced search with ranking and relevance scoring
   */
  search(criteria: SearchCriteria): {
    results: Asset[];
    totalFound: number;
    searchTime: number;
    relevanceScores: Map<string, number>;
  } {
    const startTime = performance.now();
    
    let candidates = new Set<string>(this.assets.map(a => a.id));
    const relevanceScores = new Map<string, number>();

    // Initialize all assets with base relevance score
    this.assets.forEach(asset => {
      relevanceScores.set(asset.id, 0);
    });

    // Filter by asset type
    if (criteria.assetType) {
      const typeAssets = this.typeIndex.get(criteria.assetType);
      if (typeAssets) {
        candidates = new Set(Array.from(candidates).filter(id => typeAssets.has(id)));
        // Boost relevance for exact type match
        typeAssets.forEach(id => {
          relevanceScores.set(id, (relevanceScores.get(id) || 0) + 10);
        });
      } else {
        candidates.clear();
      }
    }

    // Filter and score by tags
    if (criteria.tags && criteria.tags.length > 0) {
      const tagMatches = new Set<string>();
      criteria.tags.forEach(tag => {
        const tagAssets = this.tagIndex.get(tag.toLowerCase());
        if (tagAssets) {
          tagAssets.forEach(id => {
            tagMatches.add(id);
            // Boost relevance for tag matches
            relevanceScores.set(id, (relevanceScores.get(id) || 0) + 5);
          });
        }
      });
      
      if (tagMatches.size > 0) {
        candidates = new Set(Array.from(candidates).filter(id => tagMatches.has(id)));
      } else {
        candidates.clear();
      }
    }

    // Filter by project
    if (criteria.project) {
      candidates = new Set(Array.from(candidates).filter(id => {
        const asset = this.assets.find(a => a.id === id);
        const matches = asset?.metadata.project === criteria.project;
        if (matches) {
          // Boost relevance for project match
          relevanceScores.set(id, (relevanceScores.get(id) || 0) + 8);
        }
        return matches;
      }));
    }

    // Filter by creator
    if (criteria.creator) {
      candidates = new Set(Array.from(candidates).filter(id => {
        const asset = this.assets.find(a => a.id === id);
        const matches = asset?.metadata.creator === criteria.creator;
        if (matches) {
          // Boost relevance for creator match
          relevanceScores.set(id, (relevanceScores.get(id) || 0) + 6);
        }
        return matches;
      }));
    }

    // Filter by date range
    if (criteria.dateRange) {
      candidates = new Set(Array.from(candidates).filter(id => {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) return false;
        
        const assetDate = asset.createdDate;
        const inRange = assetDate >= criteria.dateRange!.start && assetDate <= criteria.dateRange!.end;
        
        if (inRange) {
          // Boost relevance for recent assets
          const daysSinceCreation = (Date.now() - assetDate.getTime()) / (1000 * 60 * 60 * 24);
          const recencyBoost = Math.max(0, 5 - daysSinceCreation / 30); // Boost decreases over 30 days
          relevanceScores.set(id, (relevanceScores.get(id) || 0) + recencyBoost);
        }
        
        return inRange;
      }));
    }

    // Text search with fuzzy matching and relevance scoring
    if (criteria.query) {
      const queryTerms = this.tokenizeQuery(criteria.query);
      const textMatches = new Set<string>();

      candidates.forEach(id => {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) return;

        const score = this.calculateTextRelevance(asset, queryTerms);
        if (score > 0) {
          textMatches.add(id);
          relevanceScores.set(id, (relevanceScores.get(id) || 0) + score);
        }
      });

      candidates = textMatches;
    }

    // Convert to assets and sort by relevance
    const results = Array.from(candidates)
      .map(id => this.assets.find(a => a.id === id))
      .filter((asset): asset is Asset => asset !== undefined)
      .sort((a, b) => {
        const scoreA = relevanceScores.get(a.id) || 0;
        const scoreB = relevanceScores.get(b.id) || 0;
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
        
        // Secondary sort by creation date (newer first)
        return b.createdDate.getTime() - a.createdDate.getTime();
      });

    const endTime = performance.now();
    
    return {
      results,
      totalFound: results.length,
      searchTime: endTime - startTime,
      relevanceScores
    };
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, maxSuggestions: number = 10): {
    terms: string[];
    tags: string[];
    projects: string[];
    creators: string[];
  } {
    const query = partialQuery.toLowerCase();
    
    // Get term suggestions from search index
    const termSuggestions = Array.from(this.searchIndex.keys())
      .filter(term => term.includes(query))
      .slice(0, maxSuggestions);

    // Get tag suggestions
    const tagSuggestions = Array.from(this.tagIndex.keys())
      .filter(tag => tag.includes(query))
      .slice(0, maxSuggestions);

    // Get project suggestions
    const projects = new Set<string>();
    const creators = new Set<string>();
    
    this.assets.forEach(asset => {
      if (asset.metadata.project && asset.metadata.project.toLowerCase().includes(query)) {
        projects.add(asset.metadata.project);
      }
      if (asset.metadata.creator && asset.metadata.creator.toLowerCase().includes(query)) {
        creators.add(asset.metadata.creator);
      }
    });

    return {
      terms: termSuggestions,
      tags: tagSuggestions,
      projects: Array.from(projects).slice(0, maxSuggestions),
      creators: Array.from(creators).slice(0, maxSuggestions)
    };
  }

  /**
   * Find similar assets based on tags and metadata
   */
  findSimilarAssets(assetId: string, maxResults: number = 5): Asset[] {
    const targetAsset = this.assets.find(a => a.id === assetId);
    if (!targetAsset) return [];

    const similarities = new Map<string, number>();

    this.assets.forEach(asset => {
      if (asset.id === assetId) return;

      let similarity = 0;

      // Type similarity (high weight)
      if (asset.assetType === targetAsset.assetType) {
        similarity += 20;
      }

      // Tag similarity
      const commonTags = asset.tags.filter(tag => targetAsset.tags.includes(tag));
      similarity += commonTags.length * 5;

      // Project similarity
      if (asset.metadata.project === targetAsset.metadata.project) {
        similarity += 10;
      }

      // Creator similarity
      if (asset.metadata.creator === targetAsset.metadata.creator) {
        similarity += 8;
      }

      // Format similarity
      if (asset.metadata.format === targetAsset.metadata.format) {
        similarity += 3;
      }

      if (similarity > 0) {
        similarities.set(asset.id, similarity);
      }
    });

    return Array.from(similarities.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxResults)
      .map(([id]) => this.assets.find(a => a.id === id))
      .filter((asset): asset is Asset => asset !== undefined);
  }

  /**
   * Get trending assets based on usage patterns
   */
  getTrendingAssets(timeframe: 'day' | 'week' | 'month' = 'week', maxResults: number = 10): Asset[] {
    const now = new Date();
    const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

    // For now, we'll use creation date as a proxy for trending
    // In a real implementation, this would use actual usage metrics
    const recentAssets = this.assets.filter(asset => asset.createdDate >= cutoffDate);
    
    // If no recent assets, return most recent assets overall
    if (recentAssets.length === 0) {
      return this.assets
        .sort((a, b) => {
          // Sort by creation date (newer first) and tag count (more tags = more discoverable)
          const dateScore = b.createdDate.getTime() - a.createdDate.getTime();
          const tagScore = (b.tags.length - a.tags.length) * 1000;
          return dateScore + tagScore;
        })
        .slice(0, maxResults);
    }

    return recentAssets
      .sort((a, b) => {
        // Sort by creation date (newer first) and tag count (more tags = more discoverable)
        const dateScore = b.createdDate.getTime() - a.createdDate.getTime();
        const tagScore = (b.tags.length - a.tags.length) * 1000;
        return dateScore + tagScore;
      })
      .slice(0, maxResults);
  }

  /**
   * Get asset recommendations based on user preferences
   */
  getRecommendations(
    userPreferences: {
      favoriteTypes?: AssetType[];
      favoriteTags?: string[];
      favoriteCreators?: string[];
      recentProjects?: string[];
    },
    maxResults: number = 10
  ): Asset[] {
    const scores = new Map<string, number>();

    this.assets.forEach(asset => {
      let score = 0;

      // Type preferences
      if (userPreferences.favoriteTypes?.includes(asset.assetType)) {
        score += 15;
      }

      // Tag preferences
      const matchingTags = asset.tags.filter(tag => 
        userPreferences.favoriteTags?.includes(tag)
      );
      score += matchingTags.length * 8;

      // Creator preferences
      if (userPreferences.favoriteCreators?.includes(asset.metadata.creator || '')) {
        score += 12;
      }

      // Recent project preferences
      if (userPreferences.recentProjects?.includes(asset.metadata.project || '')) {
        score += 10;
      }

      // Boost newer assets slightly
      const daysSinceCreation = (Date.now() - asset.createdDate.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - daysSinceCreation / 7); // Boost decreases over a week

      if (score > 0) {
        scores.set(asset.id, score);
      }
    });

    return Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxResults)
      .map(([id]) => this.assets.find(a => a.id === id))
      .filter((asset): asset is Asset => asset !== undefined);
  }

  /**
   * Perform faceted search to get filter options
   */
  getFacets(currentCriteria: SearchCriteria = {}): {
    types: Array<{ type: AssetType; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    projects: Array<{ project: string; count: number }>;
    creators: Array<{ creator: string; count: number }>;
    formats: Array<{ format: string; count: number }>;
  } {
    // Get assets that match current criteria (excluding the facet being calculated)
    const baseAssets = this.getFilteredAssets(currentCriteria);

    // Calculate type facets
    const typeCounts = new Map<AssetType, number>();
    const tagCounts = new Map<string, number>();
    const projectCounts = new Map<string, number>();
    const creatorCounts = new Map<string, number>();
    const formatCounts = new Map<string, number>();

    baseAssets.forEach(asset => {
      // Type counts
      typeCounts.set(asset.assetType, (typeCounts.get(asset.assetType) || 0) + 1);

      // Tag counts
      asset.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });

      // Project counts
      if (asset.metadata.project) {
        projectCounts.set(asset.metadata.project, (projectCounts.get(asset.metadata.project) || 0) + 1);
      }

      // Creator counts
      if (asset.metadata.creator) {
        creatorCounts.set(asset.metadata.creator, (creatorCounts.get(asset.metadata.creator) || 0) + 1);
      }

      // Format counts
      if (asset.metadata.format) {
        formatCounts.set(asset.metadata.format, (formatCounts.get(asset.metadata.format) || 0) + 1);
      }
    });

    return {
      types: Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20), // Limit to top 20 tags
      
      projects: Array.from(projectCounts.entries())
        .map(([project, count]) => ({ project, count }))
        .sort((a, b) => b.count - a.count),
      
      creators: Array.from(creatorCounts.entries())
        .map(([creator, count]) => ({ creator, count }))
        .sort((a, b) => b.count - a.count),
      
      formats: Array.from(formatCounts.entries())
        .map(([format, count]) => ({ format, count }))
        .sort((a, b) => b.count - a.count)
    };
  }

  // Private helper methods

  private rebuildSearchIndex(): void {
    this.searchIndex.clear();
    this.tagIndex.clear();
    this.typeIndex.clear();

    this.assets.forEach(asset => {
      // Build text search index
      const searchableText = [
        asset.name,
        asset.description,
        ...asset.tags,
        asset.metadata.creator || '',
        asset.metadata.project || ''
      ].join(' ').toLowerCase();

      const terms = this.tokenizeText(searchableText);
      terms.forEach(term => {
        if (!this.searchIndex.has(term)) {
          this.searchIndex.set(term, new Set());
        }
        this.searchIndex.get(term)!.add(asset.id);
      });

      // Build tag index
      asset.tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        if (!this.tagIndex.has(normalizedTag)) {
          this.tagIndex.set(normalizedTag, new Set());
        }
        this.tagIndex.get(normalizedTag)!.add(asset.id);
      });

      // Build type index
      if (!this.typeIndex.has(asset.assetType)) {
        this.typeIndex.set(asset.assetType, new Set());
      }
      this.typeIndex.get(asset.assetType)!.add(asset.id);
    });
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  private tokenizeQuery(query: string): string[] {
    return this.tokenizeText(query);
  }

  private calculateTextRelevance(asset: Asset, queryTerms: string[]): number {
    let score = 0;

    const searchableFields = [
      { text: asset.name.toLowerCase(), weight: 10 },
      { text: asset.description.toLowerCase(), weight: 5 },
      { text: asset.tags.join(' ').toLowerCase(), weight: 8 },
      { text: asset.metadata.creator?.toLowerCase() || '', weight: 3 },
      { text: asset.metadata.project?.toLowerCase() || '', weight: 4 }
    ];

    queryTerms.forEach(term => {
      searchableFields.forEach(field => {
        if (field.text.includes(term)) {
          // Exact word match gets full weight
          const exactMatch = new RegExp(`\\b${term}\\b`).test(field.text);
          score += exactMatch ? field.weight : field.weight * 0.5;
        }
      });
    });

    return score;
  }

  private getFilteredAssets(criteria: SearchCriteria): Asset[] {
    return this.assets.filter(asset => {
      if (criteria.assetType && asset.assetType !== criteria.assetType) {
        return false;
      }

      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some(tag => 
          asset.tags.some(assetTag => assetTag.toLowerCase() === tag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }

      if (criteria.project && asset.metadata.project !== criteria.project) {
        return false;
      }

      if (criteria.creator && asset.metadata.creator !== criteria.creator) {
        return false;
      }

      if (criteria.dateRange) {
        const assetDate = asset.createdDate;
        if (assetDate < criteria.dateRange.start || assetDate > criteria.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }
}