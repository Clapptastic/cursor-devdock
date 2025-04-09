/**
 * Template Controller
 * Handles operations related to survey templates
 */
const Template = require('../models/Template');
const Survey = require('../models/Survey');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Get all templates
 * @route GET /api/templates
 * @access Private
 */
const getTemplates = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;
  const query = {};

  // If not admin, only show public templates and own templates
  if (req.user.role !== 'admin') {
    query.$or = [
      { isPublic: true },
      { createdBy: req.user._id }
    ];
  }

  // Filter by category if provided
  if (req.query.category) {
    query.category = req.query.category;
  }

  const count = await Template.countDocuments(query);
  const templates = await Template.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    templates,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

/**
 * Get template by ID
 * @route GET /api/templates/:id
 * @access Private
 */
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id)
    .populate('createdBy', 'name email company');

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user has permission to view this template
  if (
    req.user.role !== 'admin' && 
    !template.isPublic && 
    template.createdBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this template');
  }

  res.json(template);
});

/**
 * Create a new template
 * @route POST /api/templates
 * @access Private
 */
const createTemplate = asyncHandler(async (req, res) => {
  const { name, description, category, questions, isPublic } = req.validatedData;

  const template = await Template.create({
    name,
    description,
    category,
    questions,
    isPublic: isPublic || false,
    createdBy: req.user._id
  });

  if (template) {
    res.status(201).json(template);
  } else {
    res.status(400);
    throw new Error('Invalid template data');
  }
});

/**
 * Update a template
 * @route PUT /api/templates/:id
 * @access Private
 */
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user has permission to update this template
  if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this template');
  }

  // Check if template is being used in any surveys
  const usageCount = await Survey.countDocuments({ template: req.params.id });
  if (usageCount > 0 && req.body.questions) {
    res.status(400);
    throw new Error('Cannot modify questions of a template that is being used in surveys');
  }

  const updatedTemplate = await Template.findByIdAndUpdate(
    req.params.id,
    req.validatedData,
    { new: true, runValidators: true }
  );

  res.json(updatedTemplate);
});

/**
 * Delete a template
 * @route DELETE /api/templates/:id
 * @access Private
 */
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user has permission to delete this template
  if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this template');
  }

  // Check if template is being used in any surveys
  const usageCount = await Survey.countDocuments({ template: req.params.id });
  if (usageCount > 0) {
    res.status(400);
    throw new Error('Cannot delete a template that is being used in surveys');
  }

  await template.remove();
  res.json({ message: 'Template removed' });
});

/**
 * Get template categories
 * @route GET /api/templates/categories
 * @access Private
 */
const getTemplateCategories = asyncHandler(async (req, res) => {
  const categories = await Template.distinct('category');
  res.json(categories);
});

/**
 * Clone a template
 * @route POST /api/templates/:id/clone
 * @access Private
 */
const cloneTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Check if user has permission to view this template for cloning
  if (
    req.user.role !== 'admin' && 
    !template.isPublic && 
    template.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to clone this template');
  }

  // Create a new template based on the original
  const newTemplate = await Template.create({
    name: `${template.name} (Copy)`,
    description: template.description,
    category: template.category,
    questions: template.questions,
    isPublic: false, // Always set to private initially
    createdBy: req.user._id
  });

  if (newTemplate) {
    res.status(201).json(newTemplate);
  } else {
    res.status(400);
    throw new Error('Failed to clone template');
  }
});

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateCategories,
  cloneTemplate
}; 