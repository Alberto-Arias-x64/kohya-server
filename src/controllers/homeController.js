export const welcome = (req, res) => {
  res.json({ message: 'Welcome to the Express server!' });
};

export const status = (req, res) => {
  res.json({ status: 'Server is running' });
}; 