/**
 * Database utility functions
 */
const mongoose = require('mongoose');

/**
 * Check if MongoDB ID is valid
 * @param {string} id - The ID to validate
 * @returns {boolean} Whether the ID is valid
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Create a new MongoDB ObjectId
 * @returns {mongoose.Types.ObjectId} A new ObjectId
 */
const createObjectId = () => {
  return new mongoose.Types.ObjectId();
};

/**
 * Check database connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  
  const state = mongoose.connection.readyState;
  
  return {
    state,
    status: states[state] || 'unknown',
    database: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    port: mongoose.connection.port || null,
    models: Object.keys(mongoose.models)
  };
};

/**
 * Get database stats
 * @returns {Promise<Object>} Database statistics
 */
const getDatabaseStats = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  
  const db = mongoose.connection.db;
  const stats = await db.stats();
  
  // Get collection counts
  const collections = await db.listCollections().toArray();
  const collectionStats = {};
  
  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    collectionStats[collection.name] = count;
  }
  
  return {
    database: stats.db,
    collections: stats.collections,
    documents: stats.objects,
    dataSize: stats.dataSize,
    storageSize: stats.storageSize,
    indexes: stats.indexes,
    indexSize: stats.indexSize,
    collectionCounts: collectionStats
  };
};

/**
 * Run database operations with transaction support
 * @param {Function} callback - Function that performs operations
 * @returns {Promise<any>} Result of the transaction
 */
const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get mongoose models information
 * @returns {Object} Models information
 */
const getModelsInfo = () => {
  const modelsInfo = {};
  
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    const modelInfo = {
      name: modelName,
      collection: model.collection.name,
      schema: {
        paths: Object.keys(model.schema.paths),
        virtuals: Object.keys(model.schema.virtuals),
        indexes: model.schema.indexes?.() || []
      }
    };
    
    modelsInfo[modelName] = modelInfo;
  }
  
  return modelsInfo;
};

/**
 * Database utilities for common operations with Supabase
 */
const { getDB } = require('../backend/config/database');

/**
 * Check if a record exists in a table
 * @param {string} table - Table name
 * @param {string} field - Field name to check
 * @param {any} value - Value to check for
 * @returns {Promise<boolean>} True if record exists
 */
async function recordExists(table, field, value) {
  const supabase = getDB();
  
  const { data, error, count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(field, value);
    
  if (error) throw error;
  
  return count > 0;
}

/**
 * Get records from a table with pagination and filtering
 * @param {string} table - Table name
 * @param {Object} options - Options for the query
 * @param {string[]} options.select - Fields to select
 * @param {Object} options.filter - Filter conditions
 * @param {number} options.page - Page number
 * @param {number} options.limit - Limit per page
 * @param {string} options.orderBy - Field to order by
 * @param {boolean} options.ascending - Order direction
 * @param {string} options.search - Search text
 * @param {string} options.searchField - Field to search in
 * @returns {Promise<Object>} Paginated results
 */
async function getPaginatedRecords(table, options = {}) {
  const supabase = getDB();
  
  const {
    select = '*',
    filter = {},
    page = 1,
    limit = 25,
    orderBy = 'created_at',
    ascending = false,
    search = null,
    searchField = null
  } = options;
  
  let query = supabase
    .from(table)
    .select(select, { count: 'exact' });
  
  // Apply filters
  Object.entries(filter).forEach(([field, value]) => {
    if (value !== null && value !== undefined) {
      query = query.eq(field, value);
    }
  });
  
  // Apply search if provided
  if (search && searchField) {
    query = query.ilike(searchField, `%${search}%`);
  }
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);
  
  // Apply ordering
  query = query.order(orderBy, { ascending });
  
  // Execute query
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    data,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Create a new record in a table
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<Object>} Created record
 */
async function createRecord(table, data) {
  const supabase = getDB();
  
  const { data: record, error } = await supabase
    .from(table)
    .insert(data)
    .select();
    
  if (error) throw error;
  
  return record[0];
}

/**
 * Update a record in a table
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated record
 */
async function updateRecord(table, id, data) {
  const supabase = getDB();
  
  // Add updated_at timestamp if not provided
  if (!data.updated_at) {
    data.updated_at = new Date().toISOString();
  }
  
  const { data: record, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  
  return record[0];
}

/**
 * Delete a record from a table
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @returns {Promise<boolean>} True if successful
 */
async function deleteRecord(table, id) {
  const supabase = getDB();
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  
  return true;
}

/**
 * Get a record by ID
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {string} select - Fields to select
 * @returns {Promise<Object>} Record
 */
async function getRecordById(table, id, select = '*') {
  const supabase = getDB();
  
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .single();
    
  if (error) throw error;
  
  return data;
}

/**
 * Run a transaction with multiple operations
 * Note: Supabase doesn't support proper transactions through the API
 * This is a best-effort implementation that should be used with caution
 * @param {Function} callback - Function that performs operations
 * @returns {Promise<any>} Result of the transaction
 */
async function transaction(callback) {
  const supabase = getDB();
  
  try {
    // Start transaction
    await supabase.rpc('exec', { 
      query: 'BEGIN;' 
    });
    
    // Execute operations
    const result = await callback(supabase);
    
    // Commit transaction
    await supabase.rpc('exec', { 
      query: 'COMMIT;' 
    });
    
    return result;
  } catch (error) {
    // Rollback transaction
    await supabase.rpc('exec', { 
      query: 'ROLLBACK;' 
    }).catch(e => console.error('Rollback error:', e));
    
    throw error;
  }
}

module.exports = {
  isValidObjectId,
  createObjectId,
  getConnectionStatus,
  getDatabaseStats,
  withTransaction,
  getModelsInfo,
  recordExists,
  getPaginatedRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordById,
  transaction
}; 