/**
 * User controller for handling user-related operations
 * Manages registration, authentication, and profile management
 */
const asyncHandler = require('../middleware/asyncHandler');
const { getDB } = require('../config/database');
const { generateToken } = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;
  const supabase = getDB();

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (checkError) {
    res.status(500);
    throw new Error(`Database error: ${checkError.message}`);
  }

  if (existingUser) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      name,
      email,
      password: hashedPassword,
      company,
      role: 'user'
    })
    .select()
    .single();

  if (createError) {
    res.status(400);
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  if (newUser) {
    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      role: newUser.role,
      token
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const supabase = getDB();

  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    res.status(500);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check password match
  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch) {
    // Generate token
    const token = generateToken(user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      token
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // User is already attached to req object by auth middleware
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    company: req.user.company || null,
    role: req.user.role
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;
  const supabase = getDB();
  const userId = req.user.id;

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (company) updateData.company = company;
  
  // Hash password if provided
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  // Add timestamp
  updateData.updated_at = new Date().toISOString();

  // Update user
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, name, email, company, role')
    .single();

  if (error) {
    res.status(400);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  // Generate new token
  const token = generateToken(updatedUser.id);

  res.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    company: updatedUser.company,
    role: updatedUser.role,
    token
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const supabase = getDB();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, company, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500);
    throw new Error(`Database error: ${error.message}`);
  }

  res.json(users);
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const supabase = getDB();

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    res.status(500);
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  res.json({ message: 'User removed' });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const supabase = getDB();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, company, role, created_at')
    .eq('id', req.params.id)
    .single();

  if (error) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, company, role } = req.body;
  const supabase = getDB();

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (company) updateData.company = company;
  if (role) updateData.role = role;
  
  // Add timestamp
  updateData.updated_at = new Date().toISOString();

  // Update user
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', req.params.id)
    .select('id, name, email, company, role')
    .single();

  if (error) {
    res.status(400);
    throw new Error(`Failed to update user: ${error.message}`);
  }

  res.json(updatedUser);
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
}; 