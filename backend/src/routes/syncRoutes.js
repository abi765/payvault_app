const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/database');

/**
 * Sync offline operations from the queue
 * POST /api/sync
 */
router.post('/', protect, async (req, res) => {
  const client = await pool.connect();

  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        error: { message: 'Invalid sync data. Expected operations array.' }
      });
    }

    await client.query('BEGIN');

    const results = [];
    const userId = req.user.id;

    for (const operation of operations) {
      try {
        const { id, action, entity_type, entity_data, created_at } = operation;

        // Insert into sync_queue for tracking
        await client.query(
          `INSERT INTO sync_queue (user_id, action, entity_type, entity_data, created_at, synced, synced_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           ON CONFLICT DO NOTHING`,
          [userId, action, entity_type, JSON.stringify(entity_data), created_at || new Date()]
        );

        // Process the actual operation based on entity type and action
        let processResult = null;

        switch (entity_type) {
          case 'employee':
            processResult = await processEmployeeSync(client, action, entity_data, userId);
            break;
          case 'salary':
            processResult = await processSalarySync(client, action, entity_data, userId);
            break;
          default:
            console.warn(`Unknown entity type: ${entity_type}`);
        }

        results.push({
          id,
          status: 'success',
          result: processResult
        });

      } catch (opError) {
        console.error('Error processing operation:', opError);
        results.push({
          id: operation.id,
          status: 'error',
          error: opError.message
        });
      }
    }

    await client.query('COMMIT');

    // Broadcast sync completion to all connected clients
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'SYNC_COMPLETE',
        userId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      results,
      synced: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sync error:', error);
    res.status(500).json({
      error: { message: 'Failed to sync operations', details: error.message }
    });
  } finally {
    client.release();
  }
});

/**
 * Get pending sync operations for the current user
 * GET /api/sync/pending
 */
router.get('/pending', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM sync_queue
       WHERE user_id = $1 AND synced = false
       ORDER BY created_at ASC`,
      [userId]
    );

    res.json({
      success: true,
      operations: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending sync operations:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch pending operations' }
    });
  }
});

/**
 * Clear synced operations older than specified days
 * DELETE /api/sync/cleanup
 */
router.delete('/cleanup', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM sync_queue
       WHERE user_id = $1
       AND synced = true
       AND synced_at < NOW() - INTERVAL '${parseInt(days)} days'
       RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      deleted: result.rowCount
    });
  } catch (error) {
    console.error('Error cleaning up sync queue:', error);
    res.status(500).json({
      error: { message: 'Failed to cleanup sync queue' }
    });
  }
});

// Helper function to process employee sync operations
async function processEmployeeSync(client, action, data, userId) {
  switch (action) {
    case 'create':
      const insertResult = await client.query(
        `INSERT INTO employees (employee_id, full_name, address, bank_account_number,
         bank_name, bank_branch, ifsc_code, salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.employee_id, data.full_name, data.address, data.bank_account_number,
          data.bank_name, data.bank_branch, data.ifsc_code, data.salary, data.status || 'active'
        ]
      );

      // Log audit
      await logAudit(client, userId, 'create', 'employee', insertResult.rows[0].id, null, insertResult.rows[0]);

      return insertResult.rows[0];

    case 'update':
      const updateResult = await client.query(
        `UPDATE employees SET
         full_name = $1, address = $2, bank_account_number = $3,
         bank_name = $4, bank_branch = $5, ifsc_code = $6,
         salary = $7, status = $8, updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          data.full_name, data.address, data.bank_account_number,
          data.bank_name, data.bank_branch, data.ifsc_code,
          data.salary, data.status, data.id
        ]
      );

      await logAudit(client, userId, 'update', 'employee', data.id, null, updateResult.rows[0]);

      return updateResult.rows[0];

    case 'delete':
      await client.query('DELETE FROM employees WHERE id = $1', [data.id]);
      await logAudit(client, userId, 'delete', 'employee', data.id, data, null);
      return { id: data.id, deleted: true };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Helper function to process salary sync operations
async function processSalarySync(client, action, data, userId) {
  switch (action) {
    case 'update_status':
      const result = await client.query(
        `UPDATE salary_payments SET
         status = $1, processed_at = NOW(), processed_by = $2, notes = $3
         WHERE id = $4
         RETURNING *`,
        [data.status, userId, data.notes || null, data.id]
      );

      await logAudit(client, userId, 'update', 'salary_payment', data.id, null, result.rows[0]);

      return result.rows[0];

    default:
      throw new Error(`Unknown salary action: ${action}`);
  }
}

// Helper function to log audit trail
async function logAudit(client, userId, action, entityType, entityId, oldValues, newValues) {
  try {
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, JSON.stringify(oldValues), JSON.stringify(newValues)]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

module.exports = router;
