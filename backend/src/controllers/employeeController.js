const Employee = require('../models/employeeModel');
const { validationResult } = require('express-validator');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { status } = req.query;
    const employees = await Employee.getAll(status);

    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees'
    });
  }
};

// Get single employee
exports.getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.getById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee'
    });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check for duplicate employee ID
    const existingEmployee = await Employee.getByEmployeeId(req.body.employee_id);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }

    // Check for duplicate bank account
    const duplicateBankAccounts = await Employee.checkDuplicateBankAccount(req.body.bank_account_number);
    if (duplicateBankAccounts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Bank account number already exists',
        duplicateWith: duplicateBankAccounts
      });
    }

    // Create employee
    const employeeData = {
      ...req.body,
      created_by: req.user?.username || 'system'
    };

    const newEmployee = await Employee.create(employeeData);

    // Broadcast change to all connected clients
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'EMPLOYEE_CREATED',
        data: newEmployee
      });
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create employee'
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if employee exists
    const existingEmployee = await Employee.getById(id);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Check for duplicate employee ID
    if (req.body.employee_id && req.body.employee_id !== existingEmployee.employee_id) {
      const duplicateEmpId = await Employee.getByEmployeeId(req.body.employee_id);
      if (duplicateEmpId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID already exists'
        });
      }
    }

    // Check for duplicate bank account
    if (req.body.bank_account_number) {
      const duplicateBankAccounts = await Employee.checkDuplicateBankAccount(
        req.body.bank_account_number,
        id
      );
      if (duplicateBankAccounts.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Bank account number already exists',
          duplicateWith: duplicateBankAccounts
        });
      }
    }

    // Update employee
    const employeeData = {
      ...existingEmployee,
      ...req.body,
      updated_by: req.user?.username || 'system'
    };

    const updatedEmployee = await Employee.update(id, employeeData);

    // Broadcast change to all connected clients
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'EMPLOYEE_UPDATED',
        data: updatedEmployee
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update employee'
    });
  }
};

// Delete employee (soft delete)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.getById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const deletedEmployee = await Employee.delete(id, req.user?.username || 'system');

    // Broadcast change to all connected clients
    if (global.broadcastChange) {
      global.broadcastChange({
        type: 'EMPLOYEE_DELETED',
        data: { id: parseInt(id) }
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      data: deletedEmployee
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete employee'
    });
  }
};

// Check for duplicate bank account
exports.checkDuplicateBank = async (req, res) => {
  try {
    const { bank_account_number, employee_id } = req.query;

    if (!bank_account_number) {
      return res.status(400).json({
        success: false,
        error: 'Bank account number is required'
      });
    }

    const duplicates = await Employee.checkDuplicateBankAccount(
      bank_account_number,
      employee_id || null
    );

    res.json({
      success: true,
      isDuplicate: duplicates.length > 0,
      duplicates: duplicates
    });
  } catch (error) {
    console.error('Error checking duplicate bank account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check duplicate bank account'
    });
  }
};
