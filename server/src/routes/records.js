const express = requireconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE userconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.statusconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const resultconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSONconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflectionconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.statusconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.getconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return resconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.statusconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ?const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res)const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = reqconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflectionconst express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id =const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags ||const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags || []), req.params.id],
    function(err) {
      if (err) {
const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags || []), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags || []), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags || []), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [req.params.id],
        (err, record) => {
          if (err) {const express = require('express');
const db = require('../utils/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY date DESC, created_at DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const result = records.map(record => ({
        ...record,
        tags: record.tags ? JSON.parse(record.tags) : []
      }));
      
      res.json(result);
    }
  );
});

router.post('/', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'INSERT INTO records (user_id, date, mood, reflection, activity, learning, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, mood, reflection, activity, learning, JSON.stringify(tags || [])],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [this.lastID],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
          });
        }
      );
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { date, mood, reflection, activity, learning, tags } = req.body;
  
  db.run(
    'UPDATE records SET date = ?, mood = ?, reflection = ?, activity = ?, learning = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [date, mood, reflection, activity, learning, JSON.stringify(tags || []), req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get(
        'SELECT * FROM records WHERE id = ?',
        [req.params.id],
        (err, record) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }