import { describe, it, expect, beforeEach } from 'vitest';
import { AssetSearchEngine } from '../services/AssetSearchEngine';
import { Asset, AssetType, SearchCriteria } from '../types/core';

describe('AssetSearchEngine', () => {
  let searchEngine: AssetSearchEngine;
  let testAssets: Asset[];

  beforeEach(() => {
    searchEngine = new AssetSearchEngine();
    
    // Create test assets
    testAssets = [
      {
        id: 'asset-1',
        assetType: 'character',
        name: 'Hero Character Design',
        description: 'Main protagonist character with sword and armor',
        filePath: '/characters/hero.png',
        metadata: {
          fileSize: 1024,
          format: 'png',
          creator: 'artist-john',
          project: 'fantasy-adventure'
        },
        version: '1.0.0',
        isShared: false,
        createdDate: new Date('2024-01-15'),
        tags: ['hero', 'protagonist', 'sword', 'armor', 'fantasy']
      },
      {
        id: 'asset-2',
        assetType: 'character',
        name: 'Villain Dark Lord',
        description: 'Evil antagonist with dark magic powers',
        filePath: '/characters/villain.png',
        metadata: {
          fileSize: 2048,
          format: 'png',
          creator: 'artist-jane',
          project: 'fantasy-adventure'
        },
        version: '1.0.0',
        isShared: true,
        createdDate: new Date('2024-01-20'),
        tags: ['villain', 'antagonist', 'magic', 'dark', 'fantasy']
      },
      {
        id: 'asset-3',
        assetType: 'scene',
        name: 'Castle Courtyard',
        description: 'Medieval castle courtyard with fountain',
        filePath: '/scenes/castle.jpg',
        metadata: {
          fileSize: 5120,
          format: 'jpg',
          creator: 'artist-john',
          project: 'fantasy-adventure'
        },
        version: '1.0.0',
        isShared: false,
        createdDate: new Date('2024-01-25'),
        tags: ['castle', 'medieval', 'courtyard', 'fountain', 'architecture']
      },
      {
        id: 'asset-4',
        assetType: 'template',
        name: 'Action Scene Template',
        description: 'Template for dynamic action sequences',
        filePath: '/templates/action.json',
        metadata: {
          fileSize: 512,
          format: 'json',
          creator: 'artist-bob',
          project: 'modern-thriller'
        },
        version: '1.0.0',
        isShared: true,
        createdDate: new Date('2024-02-01'),
        tags: ['action', 'template', 'dynamic', 'sequence']
      },
      {
        id: 'asset-5',
        assetType: 'character',
        name: 'Modern Spy Agent',
        description: 'Contemporary spy character with gadgets',
        filePath: '/characters/spy.png',
        metadata: {
          fileSize: 1536,
          format: 'png',
          creator: 'artist-jane',
          project: 'modern-thriller'
        },
        version: '1.0.0',
        isShared: false,
        createdDate: new Date('2024-02-05'),
        tags: ['spy', 'modern', 'agent', 'gadgets', 'contemporary']
      }
    ];

    searchEngine.updateIndex(testAssets);
  });

  describe('Basic Search Functionality', () => {
    it('should perform search and return results with relevance scores', () => {
      const criteria: SearchCriteria = {
        query: 'character'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalFound).toBe(result.results.length);
      expect(result.searchTime).toBeGreaterThan(0);
      expect(result.relevanceScores.size).toBeGreaterThan(0);

      // Should find character assets
      const characterAssets = result.results.filter(asset => asset.assetType === 'character');
      expect(characterAssets.length).toBeGreaterThan(0);
    });

    it('should filter by asset type', () => {
      const criteria: SearchCriteria = {
        assetType: 'character'
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(3);
      expect(result.results.every(asset => asset.assetType === 'character')).toBe(true);
    });

    it('should filter by tags', () => {
      const criteria: SearchCriteria = {
        tags: ['fantasy']
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(asset => asset.tags.includes('fantasy'))).toBe(true);
    });

    it('should filter by project', () => {
      const criteria: SearchCriteria = {
        project: 'fantasy-adventure'
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(3);
      expect(result.results.every(asset => asset.metadata.project === 'fantasy-adventure')).toBe(true);
    });

    it('should filter by creator', () => {
      const criteria: SearchCriteria = {
        creator: 'artist-john'
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(2);
      expect(result.results.every(asset => asset.metadata.creator === 'artist-john')).toBe(true);
    });

    it('should filter by date range', () => {
      const criteria: SearchCriteria = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(3);
      expect(result.results.every(asset => {
        const date = asset.createdDate;
        return date >= criteria.dateRange!.start && date <= criteria.dateRange!.end;
      })).toBe(true);
    });

    it('should combine multiple criteria', () => {
      const criteria: SearchCriteria = {
        assetType: 'character',
        project: 'fantasy-adventure',
        tags: ['hero']
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Hero Character Design');
    });

    it('should return empty results for no matches', () => {
      const criteria: SearchCriteria = {
        query: 'nonexistent'
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });
  });

  describe('Text Search and Relevance Scoring', () => {
    it('should score exact name matches higher', () => {
      const criteria: SearchCriteria = {
        query: 'Hero Character'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toBe('Hero Character Design');
      
      const topScore = result.relevanceScores.get(result.results[0].id);
      expect(topScore).toBeGreaterThan(0);
    });

    it('should find partial matches', () => {
      const criteria: SearchCriteria = {
        query: 'castle'
      };

      const result = searchEngine.search(criteria);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Castle Courtyard');
    });

    it('should search in descriptions', () => {
      const criteria: SearchCriteria = {
        query: 'magic powers'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toBe('Villain Dark Lord');
    });

    it('should search in tags', () => {
      const criteria: SearchCriteria = {
        query: 'sword'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].tags).toContain('sword');
    });

    it('should handle multi-word queries', () => {
      const criteria: SearchCriteria = {
        query: 'dark magic'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toBe('Villain Dark Lord');
    });
  });

  describe('Search Suggestions', () => {
    it('should provide term suggestions', () => {
      const suggestions = searchEngine.getSuggestions('char');

      expect(suggestions.terms.length).toBeGreaterThan(0);
      expect(suggestions.terms.some(term => term.includes('char'))).toBe(true);
    });

    it('should provide tag suggestions', () => {
      const suggestions = searchEngine.getSuggestions('fan');

      expect(suggestions.tags.length).toBeGreaterThan(0);
      expect(suggestions.tags.some(tag => tag.includes('fan'))).toBe(true);
    });

    it('should provide project suggestions', () => {
      const suggestions = searchEngine.getSuggestions('fantasy');

      expect(suggestions.projects.length).toBeGreaterThan(0);
      expect(suggestions.projects.some(project => project.includes('fantasy'))).toBe(true);
    });

    it('should provide creator suggestions', () => {
      const suggestions = searchEngine.getSuggestions('artist');

      expect(suggestions.creators.length).toBeGreaterThan(0);
      expect(suggestions.creators.some(creator => creator.includes('artist'))).toBe(true);
    });

    it('should limit suggestions to max count', () => {
      const suggestions = searchEngine.getSuggestions('a', 3);

      expect(suggestions.terms.length).toBeLessThanOrEqual(3);
      expect(suggestions.tags.length).toBeLessThanOrEqual(3);
      expect(suggestions.projects.length).toBeLessThanOrEqual(3);
      expect(suggestions.creators.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Similar Assets', () => {
    it('should find similar assets based on type and tags', () => {
      const similar = searchEngine.findSimilarAssets('asset-1'); // Hero Character

      expect(similar.length).toBeGreaterThan(0);
      
      // Should prioritize other characters
      const otherCharacters = similar.filter(asset => asset.assetType === 'character');
      expect(otherCharacters.length).toBeGreaterThan(0);
    });

    it('should find similar assets in same project', () => {
      const similar = searchEngine.findSimilarAssets('asset-1'); // Hero Character

      const sameProjectAssets = similar.filter(asset => 
        asset.metadata.project === 'fantasy-adventure'
      );
      expect(sameProjectAssets.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent asset', () => {
      const similar = searchEngine.findSimilarAssets('non-existent');

      expect(similar).toHaveLength(0);
    });

    it('should limit results to max count', () => {
      const similar = searchEngine.findSimilarAssets('asset-1', 2);

      expect(similar.length).toBeLessThanOrEqual(2);
    });

    it('should not include the target asset itself', () => {
      const similar = searchEngine.findSimilarAssets('asset-1');

      expect(similar.every(asset => asset.id !== 'asset-1')).toBe(true);
    });
  });

  describe('Trending Assets', () => {
    it('should return trending assets', () => {
      const trending = searchEngine.getTrendingAssets('month');

      expect(trending.length).toBeGreaterThan(0);
      expect(trending.length).toBeLessThanOrEqual(10);
    });

    it('should filter by timeframe', () => {
      const dayTrending = searchEngine.getTrendingAssets('day');
      const monthTrending = searchEngine.getTrendingAssets('month');

      // Month should have more or equal assets than day
      expect(monthTrending.length).toBeGreaterThanOrEqual(dayTrending.length);
    });

    it('should limit results to max count', () => {
      const trending = searchEngine.getTrendingAssets('month', 3);

      expect(trending.length).toBeLessThanOrEqual(3);
    });

    it('should sort by recency and discoverability', () => {
      const trending = searchEngine.getTrendingAssets('month');

      if (trending.length > 1) {
        // More recent assets should generally come first
        expect(trending[0].createdDate.getTime()).toBeGreaterThanOrEqual(
          trending[trending.length - 1].createdDate.getTime()
        );
      }
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations based on user preferences', () => {
      const preferences = {
        favoriteTypes: ['character' as AssetType],
        favoriteTags: ['fantasy', 'hero'],
        favoriteCreators: ['artist-john'],
        recentProjects: ['fantasy-adventure']
      };

      const recommendations = searchEngine.getRecommendations(preferences);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should prioritize assets matching user preferences', () => {
      const preferences = {
        favoriteTypes: ['character' as AssetType],
        favoriteTags: ['hero']
      };

      const recommendations = searchEngine.getRecommendations(preferences);

      if (recommendations.length > 0) {
        // Hero character should be highly ranked
        const heroAsset = recommendations.find(asset => asset.tags.includes('hero'));
        expect(heroAsset).toBeDefined();
      }
    });

    it('should limit results to max count', () => {
      const preferences = {
        favoriteTypes: ['character' as AssetType]
      };

      const recommendations = searchEngine.getRecommendations(preferences, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty preferences', () => {
      const recommendations = searchEngine.getRecommendations({});

      // Should still return some recommendations based on recency
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Faceted Search', () => {
    it('should provide facets for all categories', () => {
      const facets = searchEngine.getFacets();

      expect(facets.types.length).toBeGreaterThan(0);
      expect(facets.tags.length).toBeGreaterThan(0);
      expect(facets.projects.length).toBeGreaterThan(0);
      expect(facets.creators.length).toBeGreaterThan(0);
      expect(facets.formats.length).toBeGreaterThan(0);
    });

    it('should count assets correctly in facets', () => {
      const facets = searchEngine.getFacets();

      const characterFacet = facets.types.find(f => f.type === 'character');
      expect(characterFacet?.count).toBe(3);

      const fantasyProjectFacet = facets.projects.find(f => f.project === 'fantasy-adventure');
      expect(fantasyProjectFacet?.count).toBe(3);
    });

    it('should sort facets by count', () => {
      const facets = searchEngine.getFacets();

      // Types should be sorted by count (descending)
      for (let i = 0; i < facets.types.length - 1; i++) {
        expect(facets.types[i].count).toBeGreaterThanOrEqual(facets.types[i + 1].count);
      }
    });

    it('should limit tag facets to reasonable number', () => {
      const facets = searchEngine.getFacets();

      expect(facets.tags.length).toBeLessThanOrEqual(20);
    });

    it('should provide facets based on current criteria', () => {
      const criteria: SearchCriteria = {
        assetType: 'character'
      };

      const facets = searchEngine.getFacets(criteria);

      // Should only show facets for character assets
      const totalCharacterAssets = facets.projects.reduce((sum, f) => sum + f.count, 0);
      expect(totalCharacterAssets).toBeLessThanOrEqual(3); // We have 3 character assets
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty asset list', () => {
      const emptyEngine = new AssetSearchEngine();
      emptyEngine.updateIndex([]);

      const result = emptyEngine.search({ query: 'test' });

      expect(result.results).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });

    it('should handle special characters in search query', () => {
      const criteria: SearchCriteria = {
        query: 'hero@#$%^&*()'
      };

      const result = searchEngine.search(criteria);

      // Should not crash and should handle gracefully
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const criteria: SearchCriteria = {
        query: longQuery
      };

      const result = searchEngine.search(criteria);

      expect(result).toBeDefined();
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it('should handle case insensitive searches', () => {
      const criteria: SearchCriteria = {
        query: 'HERO CHARACTER'
      };

      const result = searchEngine.search(criteria);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toBe('Hero Character Design');
    });

    it('should measure search performance', () => {
      const criteria: SearchCriteria = {
        query: 'character fantasy'
      };

      const result = searchEngine.search(criteria);

      expect(result.searchTime).toBeGreaterThan(0);
      expect(result.searchTime).toBeLessThan(1000); // Should be fast (< 1 second)
    });

    it('should handle assets with missing metadata', () => {
      const assetWithMissingData: Asset = {
        id: 'asset-missing',
        assetType: 'character',
        name: 'Incomplete Asset',
        description: 'Asset with missing metadata',
        filePath: '/incomplete.png',
        metadata: {
          fileSize: 1024,
          format: 'png'
          // Missing creator and project
        },
        version: '1.0.0',
        isShared: false,
        createdDate: new Date(),
        tags: []
      };

      const assetsWithMissing = [...testAssets, assetWithMissingData];
      searchEngine.updateIndex(assetsWithMissing);

      const result = searchEngine.search({ query: 'incomplete' });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].name).toBe('Incomplete Asset');
    });
  });
});