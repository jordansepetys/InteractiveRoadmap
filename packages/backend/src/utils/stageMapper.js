// Default mapping for standard ADO processes (Agile, Scrum, Basic)
// In the future, this will be loaded from the database per project.

const DEFAULT_MAPPING = {
  // Basic
  'To Do': 'Intake',
  'Doing': 'Development',
  'Done': 'Complete',

  // Agile / Scrum
  'New': 'Intake',
  'Active': 'Discovery',
  'Resolved': 'Testing',
  'Closed': 'Complete',
  'Removed': 'Complete',
  
  // Common Custom States
  'In Progress': 'Development',
  'Design': 'Discovery',
  'Ready for Dev': 'Discovery',
  'In Testing': 'Testing',
  'UAT': 'Testing',
  'Ready for Release': 'Testing'
};

const DEFAULT_STAGES = ['Intake', 'Discovery', 'Development', 'Testing', 'Complete'];

export const getStageForState = (state) => {
  return DEFAULT_MAPPING[state] || 'Intake';
};

export const getAllStages = () => {
  return DEFAULT_STAGES;
};

export const getStageMapping = () => {
  return DEFAULT_MAPPING;
};
