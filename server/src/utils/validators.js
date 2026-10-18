const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const throwError = (status, msg) => {
    const err = new Error(msg);
    err.statusCode = status;
    throw err;
};

module.exports = {
    isValidEmail,
    throwError
};
