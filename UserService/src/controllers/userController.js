const User = require('../models/User');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  return { page, limit };
};

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject();
  delete user.password;
  return user;
};

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { role, search, isActive } = req.query;

      const filter = {};
      if (role) filter.role = role;
      if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.json({
        users: users.map(sanitizeUser),
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserByEmail: async (req, res) => {
    try {
      const email = normalizeEmail(req.params.email);
      if (!email) {
        return res.status(400).json({ error: 'Valid email is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const email = normalizeEmail(req.body.email);
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const payload = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email,
        password: req.body.password,
        phone: req.body.phone,
        role: req.body.role,
        addresses: req.body.addresses || []
      };

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const user = await User.create(payload);
      res.status(201).json(sanitizeUser(user));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      if (req.body.email) {
        const email = normalizeEmail(req.body.email);
        const existing = await User.findOne({
          email,
          _id: { $ne: req.params.id }
        });

        if (existing) {
          return res.status(400).json({ error: 'Email already exists' });
        }

        req.body.email = email;
      }

      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      if (typeof req.body.isActive === 'undefined') {
        return res.status(400).json({ error: 'isActive is required' });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: toBoolean(req.body.isActive) },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(sanitizeUser(user));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;
