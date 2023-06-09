const express = require('express');
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const jwt = require('jsonwebtoken');

const secretKey = 'your_secret_key_here';
const { authenticate } = require('./middleware');


const app = express();
app.use(bodyParser.json());


const dataFilePath = './data/employees.json';


// Enable CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Replace '*' with the appropriate origin or restrict it to your Angular app's domain
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    jsonfile.readFile(dataFilePath, (err, employees) => {
      if (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
        return;
      }
  
      const employee = employees.find(emp => emp.email === email && emp.password === password);
      if (employee) {
        const token = jwt.sign({ email: employee.email }, secretKey);
        res.json({ success: true, message: 'Login successful', token });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    });
  });
  
  
  app.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    jsonfile.readFile(dataFilePath, (err, employees) => {
      if (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
        return;
      }
  
      const employee = { email, password, name };
      employees.push(employee);
  
      jsonfile.writeFile(dataFilePath, employees, err => {
        if (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Internal server error' });
          return;
        }
  
        res.json({ success: true, message: 'Registration successful' });
      });
    });
  });

  

  app.put('/update/:email', authenticate, (req, res) => {
    const { email } = req.params;
    const { name } = req.body;
    jsonfile.readFile(dataFilePath, (err, employees) => {
      if (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal server error' });
        return;
      }
  
      const employee = employees.find(emp => emp.email === email);
      if (employee) {
        employee.name = name;
  
        jsonfile.writeFile(dataFilePath, employees, err => {
          if (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Internal server error' });
            return;
          }
  
          res.json({ success: true, message: 'Update successful' });
        });
      } else {
        res.status(404).json({ success: false, message: 'Employee not found' });
      }
    });
  });

app.get('/users', authenticate, (req, res) => {
  jsonfile.readFile(dataFilePath, (err, employees) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Internal server error' });
      return;
    }

    res.json({ success: true, users: employees });
  });
});

  // Add the following code after the '/users' endpoint

app.delete('/users/:email', authenticate, (req, res) => {
  const { email } = req.params;
  jsonfile.readFile(dataFilePath, (err, employees) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Internal server error' });
      return;
    }

    const index = employees.findIndex(emp => emp.email === email);
    if (index !== -1) {
      employees.splice(index, 1);

      jsonfile.writeFile(dataFilePath, employees, err => {
        if (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Internal server error' });
          return;
        }

        res.json({ success: true, message: 'User deleted successfully' });
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });
});


  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


  const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
