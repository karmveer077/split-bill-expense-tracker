export function createTemporaryId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function formatCurrency(amount) {
  return Number(amount).toFixed(2);
}

export function calculateEqualShares(amount, numParticipants) {
  if (!amount || Number(amount) <= 0 || !numParticipants || numParticipants <= 0) {
    return { amountPerPerson: '0.00', remainder: 0 };
  }
  const total = Number(amount);
  const share = Math.floor((total / numParticipants) * 100) / 100;
  const remainder = Math.round((total - (share * numParticipants)) * 100) / 100;
  
  return { amountPerPerson: share.toFixed(2), remainder };
}

export function validateCustomSplit(totalExpense, splitsArray) {
  const customTotal = splitsArray.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  // Allow normal 0.01 rounding tolerance
  return Math.abs(Number(totalExpense) - customTotal) <= 0.01;
}

export function filterExpenses(expenses, filters) {
  return expenses.filter(exp => {
    let match = true;
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!exp.title.toLowerCase().includes(q)) {
        match = false;
      }
    }
    
    if (filters.groupId && exp.groupId !== filters.groupId) {
      match = false;
    }
    
    if (filters.category && exp.category !== filters.category) {
      match = false;
    }
    
    if (filters.payerId && exp.paidByMemberId !== filters.payerId) {
      match = false;
    }
    
    return match;
  });
}

export function validateLoginForm(email, password) {
  const errors = {};
  if (!email) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Invalid email format.';

  if (!password) errors.password = 'Password is required.';

  return { isValid: Object.keys(errors).length === 0, errors };
}

// Strong password pattern: min 8 chars, one uppercase, one lowercase, one digit, one special char.
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const STRONG_PASSWORD_MSG =
  'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.';

export function validateSignupForm(name, email, password, confirmPassword) {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Full Name is required.';

  if (!email) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Invalid email format.';

  if (!password) errors.password = 'Password is required.';
  else if (!STRONG_PASSWORD_RE.test(password)) errors.password = STRONG_PASSWORD_MSG;

  if (!errors.password && password !== confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';

  return { isValid: Object.keys(errors).length === 0, errors };
}
