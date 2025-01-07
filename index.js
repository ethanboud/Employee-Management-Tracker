const inquirer = require('inquirer').default;
const db = require('./db');

// Function to view all departments
async function viewDepartments() {
    const departments = await db.query('SELECT * FROM department');
    console.table(departments.rows);
}

// Function to view all roles
async function viewRoles() {
    const roles = await db.query(`
        SELECT r.id, r.title, r.salary, d.name AS department
        FROM role r
        JOIN department d ON r.department_id = d.id
    `);
    console.table(roles.rows);
}

// Function to view all employees (with salary)
async function viewEmployees() {
    const employees = await db.query(`
        SELECT e.id, e.first_name, e.last_name, r.title AS role, d.name AS department, r.salary AS salary
        FROM employee e
        JOIN role r ON e.role_id = r.id
        JOIN department d ON r.department_id = d.id
    `);
    console.table(employees.rows);
}

// Function to add a department
async function addDepartment() {
    const { departmentName } = await inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'Enter department name:',
    });

    await db.query('INSERT INTO department (name) VALUES ($1)', [departmentName]);
    console.log('Department added successfully!');
}

// Function to add a role
async function addRole() {
    const departments = await db.query('SELECT * FROM department');
    const departmentChoices = departments.rows.map(department => ({
        name: department.name,
        value: department.id
    }));

    const { title, salary, departmentId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'Enter role title:',
        },
        {
            type: 'input',
            name: 'salary',
            message: 'Enter salary:',
            validate: value => !isNaN(value) || 'Please enter a valid salary',
        },
        {
            type: 'list',
            name: 'departmentId',
            message: 'Select department for the role:',
            choices: departmentChoices,
        }
    ]);

    await db.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, departmentId]);
    console.log('Role added successfully!');
}

// Function to add an employee
async function addEmployee() {
    const roles = await db.query('SELECT * FROM role');
    const roleChoices = roles.rows.map(role => ({
        name: role.title,
        value: role.id
    }));

    const employees = await db.query('SELECT * FROM employee');
    const employeeChoices = employees.rows.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));

    const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: 'Enter employee first name:',
        },
        {
            type: 'input',
            name: 'lastName',
            message: 'Enter employee last name:',
        },
        {
            type: 'list',
            name: 'roleId',
            message: 'Select role for the employee:',
            choices: roleChoices,
        },
        {
            type: 'list',
            name: 'managerId',
            message: 'Select manager for the employee:',
            choices: [...employeeChoices, { name: 'None', value: null }],
        }
    ]);

    // Get the salary of the selected role
    const selectedRole = roles.rows.find(role => role.id === roleId);
    const salary = selectedRole ? selectedRole.salary : 0;

    // Insert the employee with the salary
    await db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id, salary) VALUES ($1, $2, $3, $4, $5)', [firstName, lastName, roleId, managerId, salary]);
    console.log('Employee added successfully!');
}

// Function to update an employee's role
async function updateEmployeeRole() {
    const employees = await db.query('SELECT * FROM employee');
    const employeeChoices = employees.rows.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));

    const roles = await db.query('SELECT * FROM role');
    const roleChoices = roles.rows.map(role => ({
        name: role.title,
        value: role.id
    }));

    const { employeeId, newRoleId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Select employee to update role:',
            choices: employeeChoices,
        },
        {
            type: 'list',
            name: 'newRoleId',
            message: 'Select new role for the employee:',
            choices: roleChoices,
        }
    ]);

    await db.query('UPDATE employee SET role_id = $1 WHERE id = $2', [newRoleId, employeeId]);
    console.log('Employee role updated successfully!');
}

// Main menu
async function mainMenu() {
    const { action } = await inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View All Departments',
            'View All Roles',
            'View All Employees',
            'Add Department',
            'Add Role',
            'Add Employee',
            'Update Employee Role',
            'Exit'
        ]
    });

    switch (action) {
        case 'View All Departments':
            await viewDepartments();
            break;
        case 'View All Roles':
            await viewRoles();
            break;
        case 'View All Employees':
            await viewEmployees();
            break;
        case 'Add Department':
            await addDepartment();
            break;
        case 'Add Role':
            await addRole();
            break;
        case 'Add Employee':
            await addEmployee();
            break;
        case 'Update Employee Role':
            await updateEmployeeRole();
            break;
        case 'Exit':
            db.end();
            return;
    }

    await mainMenu();
}

mainMenu();
