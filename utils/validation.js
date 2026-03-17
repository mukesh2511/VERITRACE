export const validators = {
  // Email validation
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (basic)
  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  },

  // Serial number validation
  serialNumber: (serial) => {
    return serial && serial.length > 0 && serial.length <= 255;
  },

  // SKU validation
  sku: (sku) => {
    const skuRegex = /^[A-Z0-9\-_]+$/;
    return sku ? skuRegex.test(sku) : true;
  },

  // Weight validation
  weight: (weight) => {
    return weight === null || (weight >= 0 && weight <= 999999.999);
  },

  // Coordinates validation
  latitude: (lat) => {
    return lat === null || (lat >= -90 && lat <= 90);
  },

  longitude: (lng) => {
    return lng === null || (lng >= -180 && lng <= 180);
  },

  // Date validation
  date: (date) => {
    if (!date) return true;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },

  // Quantity validation
  quantity: (qty) => {
    return qty && Number.isInteger(qty) && qty > 0 && qty <= 999999;
  },

  // Version validation
  version: (version) => {
    return Number.isInteger(version) && version > 0;
  },

  // Organization type validation
  orgType: (type) => {
    const validTypes = ['supplier', 'manufacturer', 'distributor', 'retailer'];
    return validTypes.includes(type);
  },

  // Product type validation
  productType: (type) => {
    const validTypes = ['raw_material', 'component', 'finished_product'];
    return validTypes.includes(type);
  },

  // User role validation
  userRole: (role) => {
    const validRoles = ['admin', 'manager', 'operator'];
    return validRoles.includes(role);
  },

  // Status validation
  unitStatus: (status) => {
    const validStatuses = ['created', 'assembled', 'in_transit', 'delivered', 'retired'];
    return validStatuses.includes(status);
  },

  // Transfer status validation
  transferStatus: (status) => {
    const validStatuses = ['shipped', 'in_transit', 'received'];
    return validStatuses.includes(status);
  },

  // Order status validation
  orderStatus: (status) => {
    const validStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
    return validStatuses.includes(status);
  }
};

export const sanitizeInput = {
  // Trim and escape strings
  string: (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  },

  // Sanitize array of strings
  stringArray: (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => sanitizeInput.string(item));
  },

  // Sanitize numeric input
  number: (input) => {
    const num = Number(input);
    return isNaN(num) ? null : num;
  },

  // Sanitize boolean input
  boolean: (input) => {
    if (typeof input === 'boolean') return input;
    if (input === 'true' || input === '1') return true;
    if (input === 'false' || input === '0') return false;
    return Boolean(input);
  }
};

export const validateRequired = (data, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

export const validateLength = (value, minLength = 0, maxLength = 255) => {
  if (!value) return true;
  return value.length >= minLength && value.length <= maxLength;
};

export const validateEnum = (value, allowedValues) => {
  return allowedValues.includes(value);
};

export const buildValidationResponse = (errors) => {
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateProductCatalog = (data) => {
  const errors = {};
  
  if (!validateLength(data.product_name, 1, 255)) {
    errors.product_name = 'Product name must be between 1 and 255 characters';
  }
  
  if (data.sku && !validators.sku(data.sku)) {
    errors.sku = 'SKU must contain only uppercase letters, numbers, hyphens, and underscores';
  }
  
  if (data.weight && !validators.weight(data.weight)) {
    errors.weight = 'Weight must be between 0 and 999999.999';
  }
  
  if (data.product_type && !validators.productType(data.product_type)) {
    errors.product_type = 'Invalid product type';
  }
  
  return buildValidationResponse(errors);
};

export const validateProductUnit = (data) => {
  const errors = {};
  
  if (!validators.serialNumber(data.serial_number)) {
    errors.serial_number = 'Serial number must be between 1 and 255 characters';
  }
  
  if (data.batch_number && !validateLength(data.batch_number, 1, 100)) {
    errors.batch_number = 'Batch number must be between 1 and 100 characters';
  }
  
  if (data.status && !validators.unitStatus(data.status)) {
    errors.status = 'Invalid unit status';
  }
  
  if (data.manufacturing_date && !validators.date(data.manufacturing_date)) {
    errors.manufacturing_date = 'Invalid manufacturing date';
  }
  
  if (data.expiry_date && !validators.date(data.expiry_date)) {
    errors.expiry_date = 'Invalid expiry date';
  }
  
  return buildValidationResponse(errors);
};

export const validateOrganization = (data) => {
  const errors = {};
  
  if (!validateLength(data.org_name, 1, 255)) {
    errors.org_name = 'Organization name must be between 1 and 255 characters';
  }
  
  if (data.org_type && !validators.orgType(data.org_type)) {
    errors.org_type = 'Invalid organization type';
  }
  
  if (data.email && !validators.email(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (data.phone && !validators.phone(data.phone)) {
    errors.phone = 'Invalid phone format';
  }
  
  if (data.country && !validateLength(data.country, 1, 100)) {
    errors.country = 'Country must be between 1 and 100 characters';
  }
  
  return buildValidationResponse(errors);
};

export const validateUser = (data) => {
  const errors = {};
  
  if (!validateLength(data.name, 1, 255)) {
    errors.name = 'Name must be between 1 and 255 characters';
  }
  
  if (!validators.email(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (data.role && !validators.userRole(data.role)) {
    errors.role = 'Invalid user role';
  }
  
  if (data.phone && !validators.phone(data.phone)) {
    errors.phone = 'Invalid phone format';
  }
  
  if (data.password && !validateLength(data.password, 8, 255)) {
    errors.password = 'Password must be between 8 and 255 characters';
  }
  
  return buildValidationResponse(errors);
};

export default {
  validators,
  sanitizeInput,
  validateRequired,
  validateLength,
  validateEnum,
  buildValidationResponse,
  validateProductCatalog,
  validateProductUnit,
  validateOrganization,
  validateUser
};
