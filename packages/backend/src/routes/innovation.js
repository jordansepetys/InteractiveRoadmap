import express from 'express';
import { getDb } from '../database/db.js';

const router = express.Router();

// Valid stages for innovation funnel
const VALID_STAGES = [
  'Intake',
  'Triage',
  'Discovery',
  'Ready for Build',
  'In Flight',
  'Parked',
  'Rejected'
];

/**
 * Calculate RICE score
 * RICE = (Reach * Impact * Confidence) / Effort
 */
function calculateRiceScore(reach, impact, confidence, effort) {
  if (!reach || !impact || !confidence || !effort || effort === 0) {
    return null;
  }
  // Confidence is stored as percentage (0-100), convert to decimal
  return (reach * impact * (confidence / 100)) / effort;
}

/**
 * GET /api/innovation/items
 * List all innovation items, optionally filtered by stage
 */
router.get('/items', async (req, res, next) => {
  try {
    const { stage } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM innovation_items';
    const params = [];

    if (stage && VALID_STAGES.includes(stage)) {
      query += ' WHERE stage = ?';
      params.push(stage);
    }

    query += ' ORDER BY stage_order ASC, created_at DESC';

    const items = db.prepare(query).all(...params);

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error fetching innovation items:', error);
    next(error);
  }
});

/**
 * GET /api/innovation/items/:id
 * Get a single innovation item by ID
 */
router.get('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const item = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Innovation item not found'
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error fetching innovation item:', error);
    next(error);
  }
});

/**
 * POST /api/innovation/items
 * Create a new innovation item
 */
router.post('/items', async (req, res, next) => {
  try {
    const {
      title,
      description,
      stage = 'Intake',
      ado_feature_id,
      rice_reach,
      rice_impact,
      rice_confidence,
      rice_effort,
      roi_estimate,
      roi_notes,
      owner,
      requestor,
      category,
      tags,
      status_notes
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`
      });
    }

    const db = getDb();

    // Get the max stage_order for this stage
    const maxOrder = db.prepare(
      'SELECT MAX(stage_order) as max_order FROM innovation_items WHERE stage = ?'
    ).get(stage);
    const newOrder = (maxOrder?.max_order ?? -1) + 1;

    // Calculate RICE score
    const rice_score = calculateRiceScore(rice_reach, rice_impact, rice_confidence, rice_effort);

    const stmt = db.prepare(`
      INSERT INTO innovation_items (
        title, description, stage, stage_order, ado_feature_id,
        rice_reach, rice_impact, rice_confidence, rice_effort, rice_score,
        roi_estimate, roi_notes, owner, requestor, category, tags, status_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description || null,
      stage,
      newOrder,
      ado_feature_id || null,
      rice_reach || null,
      rice_impact || null,
      rice_confidence || null,
      rice_effort || null,
      rice_score,
      roi_estimate || null,
      roi_notes || null,
      owner || null,
      requestor || null,
      category || null,
      tags ? JSON.stringify(tags) : null,
      status_notes || null
    );

    const newItem = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      item: newItem
    });
  } catch (error) {
    console.error('Error creating innovation item:', error);
    next(error);
  }
});

/**
 * PUT /api/innovation/items/:id
 * Update an existing innovation item
 */
router.put('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      stage,
      ado_feature_id,
      rice_reach,
      rice_impact,
      rice_confidence,
      rice_effort,
      roi_estimate,
      roi_notes,
      owner,
      requestor,
      category,
      tags,
      status_notes,
      rejection_reason
    } = req.body;

    const db = getDb();

    // Check if item exists
    const existing = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Innovation item not found'
      });
    }

    // Validate stage if provided
    if (stage && !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`
      });
    }

    // Check if stage changed
    const stageChanged = stage && stage !== existing.stage;

    // Calculate new RICE score
    const newReach = rice_reach !== undefined ? rice_reach : existing.rice_reach;
    const newImpact = rice_impact !== undefined ? rice_impact : existing.rice_impact;
    const newConfidence = rice_confidence !== undefined ? rice_confidence : existing.rice_confidence;
    const newEffort = rice_effort !== undefined ? rice_effort : existing.rice_effort;
    const rice_score = calculateRiceScore(newReach, newImpact, newConfidence, newEffort);

    const stmt = db.prepare(`
      UPDATE innovation_items SET
        title = COALESCE(?, title),
        description = ?,
        stage = COALESCE(?, stage),
        ado_feature_id = ?,
        rice_reach = ?,
        rice_impact = ?,
        rice_confidence = ?,
        rice_effort = ?,
        rice_score = ?,
        roi_estimate = ?,
        roi_notes = ?,
        owner = ?,
        requestor = ?,
        category = ?,
        tags = ?,
        status_notes = ?,
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP,
        stage_changed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE stage_changed_at END
      WHERE id = ?
    `);

    stmt.run(
      title || null,
      description !== undefined ? description : existing.description,
      stage || null,
      ado_feature_id !== undefined ? ado_feature_id : existing.ado_feature_id,
      rice_reach !== undefined ? rice_reach : existing.rice_reach,
      rice_impact !== undefined ? rice_impact : existing.rice_impact,
      rice_confidence !== undefined ? rice_confidence : existing.rice_confidence,
      rice_effort !== undefined ? rice_effort : existing.rice_effort,
      rice_score,
      roi_estimate !== undefined ? roi_estimate : existing.roi_estimate,
      roi_notes !== undefined ? roi_notes : existing.roi_notes,
      owner !== undefined ? owner : existing.owner,
      requestor !== undefined ? requestor : existing.requestor,
      category !== undefined ? category : existing.category,
      tags !== undefined ? (tags ? JSON.stringify(tags) : null) : existing.tags,
      status_notes !== undefined ? status_notes : existing.status_notes,
      rejection_reason !== undefined ? rejection_reason : existing.rejection_reason,
      stageChanged ? 1 : 0,
      id
    );

    const updated = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);

    res.json({
      success: true,
      item: updated
    });
  } catch (error) {
    console.error('Error updating innovation item:', error);
    next(error);
  }
});

/**
 * DELETE /api/innovation/items/:id
 * Delete an innovation item
 */
router.delete('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM innovation_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Innovation item not found'
      });
    }

    db.prepare('DELETE FROM innovation_items WHERE id = ?').run(id);

    res.json({
      success: true,
      deleted: id
    });
  } catch (error) {
    console.error('Error deleting innovation item:', error);
    next(error);
  }
});

/**
 * PATCH /api/innovation/items/:id/stage
 * Move an item to a new stage
 */
router.patch('/items/:id/stage', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, rejection_reason } = req.body;

    if (!stage || !VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        success: false,
        error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`
      });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Innovation item not found'
      });
    }

    // Get max order for new stage
    const maxOrder = db.prepare(
      'SELECT MAX(stage_order) as max_order FROM innovation_items WHERE stage = ?'
    ).get(stage);
    const newOrder = (maxOrder?.max_order ?? -1) + 1;

    const stmt = db.prepare(`
      UPDATE innovation_items SET
        stage = ?,
        stage_order = ?,
        rejection_reason = CASE WHEN ? = 'Rejected' THEN ? ELSE rejection_reason END,
        stage_changed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(stage, newOrder, stage, rejection_reason || null, id);

    const updated = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);

    res.json({
      success: true,
      item: updated
    });
  } catch (error) {
    console.error('Error moving innovation item:', error);
    next(error);
  }
});

/**
 * PATCH /api/innovation/items/:id/order
 * Reorder an item within its stage
 */
router.patch('/items/:id/order', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'newOrder must be a number'
      });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Innovation item not found'
      });
    }

    const oldOrder = existing.stage_order;
    const stage = existing.stage;

    // Shift other items to make room
    if (newOrder < oldOrder) {
      // Moving up: increment orders of items between new and old position
      db.prepare(`
        UPDATE innovation_items
        SET stage_order = stage_order + 1
        WHERE stage = ? AND stage_order >= ? AND stage_order < ?
      `).run(stage, newOrder, oldOrder);
    } else if (newOrder > oldOrder) {
      // Moving down: decrement orders of items between old and new position
      db.prepare(`
        UPDATE innovation_items
        SET stage_order = stage_order - 1
        WHERE stage = ? AND stage_order > ? AND stage_order <= ?
      `).run(stage, oldOrder, newOrder);
    }

    // Update the item's order
    db.prepare(`
      UPDATE innovation_items
      SET stage_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newOrder, id);

    const updated = db.prepare('SELECT * FROM innovation_items WHERE id = ?').get(id);

    res.json({
      success: true,
      item: updated
    });
  } catch (error) {
    console.error('Error reordering innovation item:', error);
    next(error);
  }
});

/**
 * GET /api/innovation/stats
 * Get counts per stage and other statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const db = getDb();

    // Get counts per stage
    const stageCounts = db.prepare(`
      SELECT stage, COUNT(*) as count
      FROM innovation_items
      GROUP BY stage
    `).all();

    // Convert to object
    const byStage = {};
    VALID_STAGES.forEach(stage => {
      byStage[stage] = 0;
    });
    stageCounts.forEach(row => {
      byStage[row.stage] = row.count;
    });

    // Get total count
    const total = db.prepare('SELECT COUNT(*) as count FROM innovation_items').get();

    // Get average RICE score
    const avgRice = db.prepare(
      'SELECT AVG(rice_score) as avg FROM innovation_items WHERE rice_score IS NOT NULL'
    ).get();

    // Get items with high RICE score (top 5)
    const topItems = db.prepare(`
      SELECT id, title, rice_score, stage
      FROM innovation_items
      WHERE rice_score IS NOT NULL
      ORDER BY rice_score DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      stats: {
        total: total.count,
        byStage,
        averageRiceScore: avgRice.avg ? Math.round(avgRice.avg * 100) / 100 : null,
        topItems
      }
    });
  } catch (error) {
    console.error('Error fetching innovation stats:', error);
    next(error);
  }
});

/**
 * GET /api/innovation/stages
 * Get the list of valid stages
 */
router.get('/stages', (req, res) => {
  res.json({
    success: true,
    stages: VALID_STAGES
  });
});

export default router;
