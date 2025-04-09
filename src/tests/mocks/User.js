/**
 * Mock User model for testing
 */

// Mock findById method
const findById = jest.fn().mockImplementation((id) => {
  if (id === 'admin123') {
    return Promise.resolve({ 
      _id: 'admin123', 
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      select: () => ({ 
        _id: 'admin123', 
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin' 
      })
    });
  } else if (id === 'user123') {
    return Promise.resolve({ 
      _id: 'user123', 
      name: 'Regular User',
      email: 'user@example.com',
      role: 'user',
      select: () => ({ 
        _id: 'user123', 
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user' 
      })
    });
  }
  return Promise.resolve(null);
});

module.exports = {
  findById
}; 