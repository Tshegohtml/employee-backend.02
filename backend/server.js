const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

const serviceAccount = require('../employeeform/employee-form-c6eea-firebase-adminsdk-yibvb-89fa3ddead.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com', 
});


const db = admin.firestore();
const bucket = admin.storage().bucket(); 
const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/employees', async (req, res) => {
  console.log('Fetching employees...');
  try {
    const snapshot = await db.collection('employees').get();
    const employeeList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Employee List:', employeeList); 
    res.status(200).json(employeeList);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Error fetching employees' });
  }
});


app.post('/employees', async (req, res) => {
  try {
    const newEmployee = req.body;

    console.log('Received new employee data:', newEmployee);


    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.idNumber) {
      return res.status(400).json({ error: 'All fields are required: name, email, phone, idNumber' });
    }

   
    const employeeData = { ...newEmployee, idNumber: newEmployee.idNumber };  
    delete employeeData.idNumber;  

    const docRef = await db.collection('employees').add(employeeData);
    const savedDoc = await docRef.get();
    console.log('Saved employee in Firestore:', savedDoc.data());

    res.status(201).json({ id: docRef.id, ...employeeData });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Error adding employee' });
  }
});



// Update an employee
app.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const updatedEmployee = req.body;

  try {
    const docRef = db.collection('employees').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await docRef.update(updatedEmployee);
    console.log(`Updated employee ${id} with data:`, updatedEmployee);
    res.status(200).json({ id, ...updatedEmployee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Error updating employee' });
  }
});

// Delete an employee
app.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('employees').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await docRef.delete();
    console.log(`Deleted employee with id: ${id}`);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Error deleting employee' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
