"""
PayVault - Python Flask Backend
Simple, easy-to-deploy salary management system
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from datetime import datetime, timedelta, timezone
import os
import secrets

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///payvault.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app, resources={r"/api/*": {"origins": "*"}})
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ==================== MODELS ====================

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='user')  # admin, user, viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text)
    bank_account_number = db.Column(db.String(50))
    bank_name = db.Column(db.String(100))
    bank_branch = db.Column(db.String(100))
    ifsc_code = db.Column(db.String(20))
    salary = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, inactive, on_leave
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    salary_payments = db.relationship('SalaryPayment', backref='employee', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'full_name': self.full_name,
            'address': self.address,
            'bank_account_number': self.bank_account_number,
            'bank_name': self.bank_name,
            'bank_branch': self.bank_branch,
            'ifsc_code': self.ifsc_code,
            'salary': self.salary,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SalaryPayment(db.Model):
    __tablename__ = 'salary_payments'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    payment_month = db.Column(db.String(7), nullable=False)  # Format: YYYY-MM
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, processed, failed
    processed_at = db.Column(db.DateTime)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        emp = db.session.get(Employee, self.employee_id)
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': emp.full_name if emp else None,
            'employee_code': emp.employee_id if emp else None,
            'payment_month': self.payment_month,
            'amount': self.amount,
            'status': self.status,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ==================== ROUTES ====================

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'PayVault Python Backend is running'})


# Authentication Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': {'message': 'Username and password required'}}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({'error': {'message': 'Invalid credentials'}}), 401

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    # Create access token (identity must be string)
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_dict()
    })


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())  # Convert string back to int
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({'error': {'message': 'User not found'}}), 404

    return jsonify({
        'success': True,
        'user': user.to_dict()
    })


# Employee Routes
@app.route('/api/employees', methods=['GET'])
@jwt_required()
def get_employees():
    status_filter = request.args.get('status')
    search = request.args.get('search', '')

    query = Employee.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    if search:
        query = query.filter(
            db.or_(
                Employee.full_name.ilike(f'%{search}%'),
                Employee.employee_id.ilike(f'%{search}%')
            )
        )

    employees = query.order_by(Employee.created_at.desc()).all()

    return jsonify({
        'success': True,
        'employees': [emp.to_dict() for emp in employees]
    })


@app.route('/api/employees', methods=['POST'])
@jwt_required()
def create_employee():
    data = request.get_json()

    # Check for duplicate employee_id
    existing = Employee.query.filter_by(employee_id=data.get('employee_id')).first()
    if existing:
        return jsonify({'error': {'message': 'Employee ID already exists'}}), 400

    # Check for duplicate bank account
    if data.get('bank_account_number'):
        existing_bank = Employee.query.filter_by(
            bank_account_number=data.get('bank_account_number')
        ).first()
        if existing_bank:
            return jsonify({
                'error': {'message': 'Bank account already exists for another employee'}
            }), 400

    employee = Employee(
        employee_id=data['employee_id'],
        full_name=data['full_name'],
        address=data.get('address'),
        bank_account_number=data.get('bank_account_number'),
        bank_name=data.get('bank_name'),
        bank_branch=data.get('bank_branch'),
        ifsc_code=data.get('ifsc_code'),
        salary=data['salary'],
        status=data.get('status', 'active')
    )

    db.session.add(employee)
    db.session.commit()

    return jsonify({
        'success': True,
        'employee': employee.to_dict()
    }), 201


@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
@jwt_required()
def update_employee(emp_id):
    employee = db.session.get(Employee, emp_id)
    if not employee:
        return jsonify({'error': {'message': 'Employee not found'}}), 404

    data = request.get_json()

    # Update fields
    employee.full_name = data.get('full_name', employee.full_name)
    employee.address = data.get('address', employee.address)
    employee.bank_account_number = data.get('bank_account_number', employee.bank_account_number)
    employee.bank_name = data.get('bank_name', employee.bank_name)
    employee.bank_branch = data.get('bank_branch', employee.bank_branch)
    employee.ifsc_code = data.get('ifsc_code', employee.ifsc_code)
    employee.salary = data.get('salary', employee.salary)
    employee.status = data.get('status', employee.status)
    employee.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        'success': True,
        'employee': employee.to_dict()
    })


@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(emp_id):
    employee = db.session.get(Employee, emp_id)
    if not employee:
        return jsonify({'error': {'message': 'Employee not found'}}), 404

    db.session.delete(employee)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Employee deleted successfully'
    })


# Salary Routes
@app.route('/api/salary/generate', methods=['POST'])
@jwt_required()
def generate_salary():
    data = request.get_json()
    month = data.get('month')  # Format: YYYY-MM

    if not month:
        return jsonify({'error': {'message': 'Month is required'}}), 400

    user_id = int(get_jwt_identity())  # Convert string back to int

    # Get active employees
    employees = Employee.query.filter_by(status='active').all()

    if not employees:
        return jsonify({'error': {'message': 'No active employees found'}}), 400

    created_count = 0
    skipped_count = 0

    for employee in employees:
        # Check if salary already exists
        existing = SalaryPayment.query.filter_by(
            employee_id=employee.id,
            payment_month=month
        ).first()

        if existing:
            skipped_count += 1
            continue

        # Create salary payment
        payment = SalaryPayment(
            employee_id=employee.id,
            payment_month=month,
            amount=employee.salary,
            status='pending'
        )
        db.session.add(payment)
        created_count += 1

    db.session.commit()

    return jsonify({
        'success': True,
        'created': created_count,
        'skipped': skipped_count,
        'message': f'Generated salary for {created_count} employees'
    })


@app.route('/api/salary', methods=['GET'])
@jwt_required()
def get_salaries():
    month = request.args.get('month')
    status_filter = request.args.get('status')

    query = SalaryPayment.query

    if month:
        query = query.filter_by(payment_month=month)

    if status_filter:
        query = query.filter_by(status=status_filter)

    payments = query.order_by(SalaryPayment.created_at.desc()).all()

    return jsonify({
        'success': True,
        'payments': [payment.to_dict() for payment in payments]
    })


@app.route('/api/salary/<int:payment_id>/status', methods=['PUT'])
@jwt_required()
def update_salary_status(payment_id):
    payment = db.session.get(SalaryPayment, payment_id)
    if not payment:
        return jsonify({'error': {'message': 'Payment not found'}}), 404

    data = request.get_json()
    user_id = int(get_jwt_identity())  # Convert string back to int

    payment.status = data.get('status', payment.status)
    payment.notes = data.get('notes', payment.notes)
    payment.processed_at = datetime.now(timezone.utc)
    payment.processed_by = user_id

    db.session.commit()

    return jsonify({
        'success': True,
        'payment': payment.to_dict()
    })


@app.route('/api/salary/stats', methods=['GET'])
@jwt_required()
def get_salary_stats():
    month = request.args.get('month')

    query = SalaryPayment.query
    if month:
        query = query.filter_by(payment_month=month)

    total = query.count()
    pending = query.filter_by(status='pending').count()
    processed = query.filter_by(status='processed').count()
    failed = query.filter_by(status='failed').count()

    total_amount = db.session.query(db.func.sum(SalaryPayment.amount)).filter(
        SalaryPayment.payment_month == month if month else True
    ).scalar() or 0

    return jsonify({
        'success': True,
        'stats': {
            'total': total,
            'pending': pending,
            'processed': processed,
            'failed': failed,
            'total_amount': total_amount
        }
    })


# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ==================== DATABASE INITIALIZATION ====================

def init_db():
    """Initialize database with tables and default admin user"""
    with app.app_context():
        db.create_all()

        # Create default admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                full_name='Administrator',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Created default admin user (username: admin, password: admin123)")

        print("✅ Database initialized successfully")


# ==================== RUN APPLICATION ====================

# Initialize database on startup (for both development and production)
init_db()

if __name__ == '__main__':
    # Run the application (development only)
    port = int(os.getenv('PORT', 5000))
    print(f"\n🚀 PayVault Python Backend running on http://localhost:{port}")
    print(f"📊 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"🔐 Default login: admin / admin123\n")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('DEBUG', 'True') == 'True'
    )
