const { body } = require('express-validator');

exports.validateEmployee = [
  body('employee_id')
    .trim()
    .notEmpty().withMessage('Employee ID is required')
    .isLength({ max: 50 }).withMessage('Employee ID must not exceed 50 characters'),

  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 255 }).withMessage('Full name must not exceed 255 characters'),

  body('address')
    .optional()
    .trim(),

  body('bank_account_number')
    .trim()
    .notEmpty().withMessage('Bank account number is required')
    .isLength({ min: 8, max: 50 }).withMessage('Bank account number must be between 8 and 50 characters')
    .matches(/^[0-9]+$/).withMessage('Bank account number must contain only digits'),

  body('bank_name')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Bank name must not exceed 255 characters'),

  body('bank_branch')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Bank branch must not exceed 255 characters'),

  body('ifsc_code')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('IFSC code must not exceed 20 characters')
    .matches(/^[A-Z0-9]*$/).withMessage('IFSC code must contain only uppercase letters and numbers'),

  body('salary')
    .notEmpty().withMessage('Salary is required')
    .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_leave']).withMessage('Invalid status value')
];

exports.validateEmployeeUpdate = [
  body('employee_id')
    .optional()
    .trim()
    .notEmpty().withMessage('Employee ID cannot be empty')
    .isLength({ max: 50 }).withMessage('Employee ID must not exceed 50 characters'),

  body('full_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty')
    .isLength({ max: 255 }).withMessage('Full name must not exceed 255 characters'),

  body('address')
    .optional()
    .trim(),

  body('bank_account_number')
    .optional()
    .trim()
    .notEmpty().withMessage('Bank account number cannot be empty')
    .isLength({ min: 8, max: 50 }).withMessage('Bank account number must be between 8 and 50 characters')
    .matches(/^[0-9]+$/).withMessage('Bank account number must contain only digits'),

  body('bank_name')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Bank name must not exceed 255 characters'),

  body('bank_branch')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Bank branch must not exceed 255 characters'),

  body('ifsc_code')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('IFSC code must not exceed 20 characters')
    .matches(/^[A-Z0-9]*$/).withMessage('IFSC code must contain only uppercase letters and numbers'),

  body('salary')
    .optional()
    .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_leave']).withMessage('Invalid status value')
];
