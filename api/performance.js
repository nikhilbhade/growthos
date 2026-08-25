const { requireUser } = require('../lib/api-auth');

module.exports = async (req, res) => {
  if ((await requireUser(req, res)) === false) return;
  return res.status(200).json({ noData: true, message: 'Analytics will appear after at least one provider completes its first historical sync.' });
};
