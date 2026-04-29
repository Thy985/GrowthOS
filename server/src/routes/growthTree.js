const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM growth_trees WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, trees) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const treeIds = trees.map(t => t.id);
      if (treeIds.length === 0) {
        return res.json(trees.map(t => ({ ...t, children: [] })));
      }
      
      const placeholders = treeIds.map(() => '?').join(',');
      db.all(
        `SELECT * FROM tree_nodes WHERE tree_id IN (${placeholders}) ORDER BY created_at ASC`,
        treeIds,
        (err, nodes) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const result = trees.map(tree => {
            const treeNodes = nodes.filter(n => n.tree_id === tree.id);
            return { ...tree, children: treeNodes };
          });
          
          res.json(result);
        }
      );
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { name } = req.body;
  
  db.run(
    'INSERT INTO growth_trees (user_id, name) VALUES (?, ?)',
    [req.user.id, name],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM growth_trees WHERE id = ?',
        [this.lastID],
        (err, tree) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ ...tree, children: [] });
        }
      );
    }
  );
});

router.get('/:id/nodes', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM tree_nodes WHERE tree_id = ? ORDER BY created_at ASC',
    [req.params.id],
    (err, nodes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(nodes);
    }
  );
});

router.post('/:id/nodes', authenticateToken, (req, res) => {
  const { name, type, parent_id, mastery, status } = req.body;
  
  db.run(
    'INSERT INTO tree_nodes (tree_id, name, type, parent_id, mastery, status) VALUES (?, ?, ?, ?, ?, ?)',
    [req.params.id, name, type, parent_id, mastery || 0, status || 'not_started'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM tree_nodes WHERE id = ?',
        [this.lastID],
        (err, node) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(node);
        }
      );
    }
  );
});

router.put('/nodes/:id', authenticateToken, (req, res) => {
  const { name, type, mastery, status } = req.body;
  
  db.run(
    'UPDATE tree_nodes SET name = ?, type = ?, mastery = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, type, mastery, status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM tree_nodes WHERE id = ?',
        [req.params.id],
        (err, node) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(node);
        }
      );
    }
  );
});

router.delete('/nodes/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM tree_nodes WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.sendStatus(204);
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM tree_nodes WHERE tree_id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run('DELETE FROM growth_trees WHERE id = ?', [req.params.id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.sendStatus(204);
    });
  });
});

module.exports = router;