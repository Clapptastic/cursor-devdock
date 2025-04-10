const { Model } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  class ApiKey extends Model {
    static associate(models) {
      // Define associations with other models here if needed
    }

    // Instance method to mask the API key for display purposes
    maskKey() {
      if (!this.key) return null;
      const firstFour = this.key.substring(0, 4);
      const lastFour = this.key.substring(this.key.length - 4);
      return `${firstFour}...${lastFour}`;
    }
  }
  
  ApiKey.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(1024),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    // Store key hash to verify but never expose the actual key
    keyHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Add fields to track usage and to implement rate limiting
    lastUsed: {
      type: DataTypes.DATE
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'ApiKey',
    tableName: 'api_keys',
    timestamps: true,
    paranoid: true, // Use soft deletes (deletedAt)
    hooks: {
      beforeCreate: async (apiKey) => {
        // Create a hash of the API key for verification
        apiKey.keyHash = crypto
          .createHash('sha256')
          .update(apiKey.key)
          .digest('hex');
      },
      beforeUpdate: async (apiKey) => {
        // Update key hash if key changed
        if (apiKey.changed('key')) {
          apiKey.keyHash = crypto
            .createHash('sha256')
            .update(apiKey.key)
            .digest('hex');
        }
      }
    }
  });
  
  // Class method to verify an API key
  ApiKey.verifyKey = async function(service, providedKey) {
    if (!providedKey) return null;
    
    // Create a hash of the provided key to compare with stored hash
    const keyHash = crypto
      .createHash('sha256')
      .update(providedKey)
      .digest('hex');
    
    // Find the API key record by service and hash
    const apiKey = await this.findOne({
      where: {
        service,
        keyHash,
        isActive: true
      }
    });
    
    if (!apiKey) return null;
    
    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }
    
    // Update usage statistics
    await apiKey.update({
      lastUsed: new Date(),
      usageCount: apiKey.usageCount + 1
    });
    
    return apiKey;
  };
  
  return ApiKey;
}; 