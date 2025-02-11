require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// Generate unique IDs with full UUIDs
const generateId = () => uuidv4();

// MongoDB Schemas
const taskSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  title: String,
  description: String,
  status: String,
  progress: Number
}, { timestamps: true });
const assigneeSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  role: String,
  email: String,
  initials: String,
  color: String
}, { timestamps: true });
const assignmentSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  taskId: String,
  assigneeId: String
}, { timestamps: true });

// Models
const Task = mongoose.model('Task', taskSchema);
const Assignee = mongoose.model('Assignee', assigneeSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);

// Seed Database
async function seedDatabase() {
  // Seed tasks if empty
  const taskCount = await Task.countDocuments();
  if (taskCount === 0) {
    const tasks = Array.from({ length: 20 }, (_, i) => ({
      id: generateId(),
      title: `Task ${i + 1}`,
      description: `Description for Task ${i + 1}`,
      status: 'pending',
      progress: Math.floor(Math.random() * 100)
    }));
    await Task.insertMany(tasks);
  }

  // Seed assignees if empty
  const assigneeCount = await Assignee.countDocuments();
  if (assigneeCount === 0) {
    const assignees = Array.from({ length: 10 }, (_, i) => ({
      id: generateId(),
      name: `Assignee ${i + 1}`,
      role: 'Developer',
      email: `Assignee${i + 1}.Developer@gmail.com`,
      initials: 'AB',
      color: 'teal'
    }));
    await Assignee.insertMany(assignees);
  }
}

// Task Endpoints
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const newTask = { id: generateId(), ...req.body };
    const createdTask = await Task.create(newTask);
    res.status(201).json(createdTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
app.patch('/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({ id: req.params.id });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignee Endpoints
app.get('/assignees', async (req, res) => {
  try {
    const assignees = await Assignee.find({});
    res.json(assignees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create assignee
app.post('/assignees', async (req, res) => {
  try {
    const newAssignee = { id: generateId(), ...req.body };
    const createdAssignee = await Assignee.create(newAssignee);
    res.status(201).json(createdAssignee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assignee by ID
app.get('/assignees/:id', async (req, res) => {
  try {
    const assignee = await Assignee.findOne({ id: req.params.id });
    if (!assignee) return res.status(404).json({ message: 'Assignee not found' });
    res.json(assignee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignee
app.patch('/assignees/:id', async (req, res) => {
  try {
    const updatedAssignee = await Assignee.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedAssignee) return res.status(404).json({ message: 'Assignee not found' });
    res.json(updatedAssignee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignee
app.delete('/assignees/:id', async (req, res) => {
  try {
    await Assignee.findOneAndDelete({ id: req.params.id });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignment Endpoints
app.post('/tasks/:taskId/assign/:assigneeId', async (req, res) => {
  try {
    const newAssignment = {
      id: generateId(),
      taskId: req.params.taskId,
      assigneeId: req.params.assigneeId
    };
    const createdAssignment = await Assignment.create(newAssignment);
    res.status(201).json(createdAssignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unassign
app.delete('/tasks/:taskId/unassign/:assigneeId', async (req, res) => {
  try {
    await Assignment.deleteOne({
      taskId: req.params.taskId,
      assigneeId: req.params.assigneeId
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all assignments
app.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find({});
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch tasks by assignee
app.get('/assignees/:id/tasks', async (req, res) => {
  try {
    const assigneeId = req.params.id;
    const assignments = await Assignment.find({ assigneeId });
    const taskIds = assignments.map(a => a.taskId);
    const tasks = await Task.find({ id: { $in: taskIds } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch assignees by task
app.get('/tasks/:taskId/assignees', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const assignments = await Assignment.find({ taskId });
    const assigneeIds = assignments.map(a => a.assigneeId);
    const assignees = await Assignee.find({ id: { $in: assigneeIds } });
    res.json(assignees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));