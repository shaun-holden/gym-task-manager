const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const generateToken = require('../utils/generateToken');

async function register(req, res, next) {
  try {
    const { name, email, password, role, supervisorId, organizationName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const allowedRoles = ['EMPLOYEE', 'SUPERVISOR'];
    const selectedRole = allowedRoles.includes(role) ? role : 'EMPLOYEE';

    let organizationId = null;

    if (selectedRole === 'SUPERVISOR') {
      // Supervisors create a new organization
      const orgName = organizationName?.trim();
      if (!orgName) {
        return res.status(400).json({ error: 'Organization/gym name is required for employers.' });
      }
      const org = await prisma.organization.create({ data: { name: orgName } });
      organizationId = org.id;
    } else if (selectedRole === 'EMPLOYEE' && supervisorId) {
      // Employees inherit their supervisor's organization
      const sup = await prisma.user.findUnique({ where: { id: supervisorId }, select: { organizationId: true } });
      organizationId = sup?.organizationId || null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: selectedRole, supervisorId: selectedRole === 'EMPLOYEE' && supervisorId ? supervisorId : null, organizationId },
      select: { id: true, name: true, email: true, role: true, supervisorId: true, organizationId: true },
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        supervisorId: user.supervisorId,
        organizationId: user.organizationId,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        supervisorId: true,
        organizationId: true,
        supervisor: { select: { name: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
