import { getDb } from '../database/db.js';
import * as adoApi from '../utils/adoApi.js';

/**
 * Cache Service
 * Manages work items cache for duplicate detection
 */
class CacheService {
  constructor() {
    this.db = getDb();
  }

  /**
   * Refresh work items cache from Azure DevOps
   * Fetches recent work items (last 6 months) and stores in SQLite
   */
  async refreshWorkItemsCache() {
    console.log('🔄 Refreshing work items cache from Azure DevOps...');

    try {
      // Fetch recent work items from ADO
      const workItems = await adoApi.getRecentWorkItems();

      if (!workItems || workItems.length === 0) {
        console.log('ℹ️  No work items found to cache');
        return { success: true, count: 0 };
      }

      // Clear existing cache
      this.db.prepare('DELETE FROM work_items_cache').run();

      // Insert work items into cache
      const insertStmt = this.db.prepare(`
        INSERT INTO work_items_cache (
          id,
          title,
          type,
          state,
          parent_id,
          created_date,
          description,
          area_path,
          iteration_path,
          last_fetched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const transaction = this.db.transaction(() => {
        for (const item of workItems) {
          insertStmt.run(
            item.id,
            item.fields['System.Title'],
            item.fields['System.WorkItemType'],
            item.fields['System.State'],
            item.fields['System.Parent'] || null,
            item.fields['System.CreatedDate'],
            item.fields['System.Description'] || '',
            item.fields['System.AreaPath'] || null,
            item.fields['System.IterationPath'] || null
          );
        }
      });

      transaction();

      console.log(`✅ Cached ${workItems.length} work items`);

      return {
        success: true,
        count: workItems.length
      };
    } catch (error) {
      console.error('❌ Cache refresh error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Search for similar work items based on title and description
   * @param {string} title - Title to search for
   * @param {string} description - Description to search for (optional)
   * @param {number} limit - Max number of results (default: 5)
   */
  searchSimilar(title, description = '', limit = 5) {
    try {
      // Extract keywords from title (simple approach)
      const titleKeywords = this.extractKeywords(title);

      if (titleKeywords.length === 0) {
        return { success: true, matches: [] };
      }

      // Build search query with keyword matching
      // Search in title and description for any of the keywords
      const keywordConditions = titleKeywords.map(() =>
        '(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)'
      ).join(' OR ');

      const query = `
        SELECT
          id,
          title,
          type,
          state,
          created_date,
          description
        FROM work_items_cache
        WHERE state NOT IN ('Closed', 'Removed', 'Done')
          AND (${keywordConditions})
        ORDER BY created_date DESC
        LIMIT ?
      `;

      // Prepare parameters: each keyword generates 2 LIKE params (title + description)
      const params = [];
      for (const keyword of titleKeywords) {
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      params.push(limit);

      const matches = this.db.prepare(query).all(...params);

      // Calculate similarity scores
      const scoredMatches = matches.map(match => {
        const score = this.calculateSimilarity(title, match.title, description, match.description);
        return {
          id: match.id,
          title: match.title,
          type: match.type,
          state: match.state,
          createdDate: match.created_date,
          description: match.description,
          similarityScore: score,
          reason: this.getSimilarityReason(title, match.title, description, match.description)
        };
      });

      // Sort by similarity score and filter low scores
      const filteredMatches = scoredMatches
        .filter(m => m.similarityScore > 30) // Only show if >30% similar
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      return {
        success: true,
        matches: filteredMatches
      };
    } catch (error) {
      console.error('Search similar error:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
  }

  /**
   * Extract keywords from text (simple approach)
   * Removes common words and extracts meaningful keywords
   */
  extractKeywords(text) {
    if (!text) return [];

    const commonWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'can', 'to', 'of', 'in', 'on', 'at', 'for',
      'with', 'from', 'by', 'as', 'and', 'or', 'but', 'not', 'it', 'this',
      'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she', 'they'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Calculate similarity between two work items
   * Returns a score from 0-100
   */
  calculateSimilarity(title1, title2, desc1 = '', desc2 = '') {
    let score = 0;

    // Title similarity (weighted heavily - 70%)
    const titleScore = this.textSimilarity(title1, title2);
    score += titleScore * 0.7;

    // Description similarity (weighted less - 30%)
    if (desc1 && desc2) {
      const descScore = this.textSimilarity(desc1, desc2);
      score += descScore * 0.3;
    }

    return Math.round(score);
  }

  /**
   * Simple text similarity using keyword overlap
   */
  textSimilarity(text1, text2) {
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return (intersection.size / union.size) * 100;
  }

  /**
   * Generate a human-readable reason for similarity
   */
  getSimilarityReason(title1, title2, desc1 = '', desc2 = '') {
    const titleKeywords1 = new Set(this.extractKeywords(title1));
    const titleKeywords2 = new Set(this.extractKeywords(title2));

    const commonKeywords = [...titleKeywords1].filter(k => titleKeywords2.has(k));

    if (commonKeywords.length > 0) {
      const keywordList = commonKeywords.slice(0, 3).map(k => `"${k}"`).join(', ');
      return `Similar keywords: ${keywordList}`;
    }

    return 'Similar title';
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const stats = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN state = 'New' THEN 1 END) as new_count,
          COUNT(CASE WHEN state = 'Active' THEN 1 END) as active_count,
          MAX(last_fetched) as last_refresh
        FROM work_items_cache
      `).get();

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Get cache stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export a singleton instance
export default new CacheService();
