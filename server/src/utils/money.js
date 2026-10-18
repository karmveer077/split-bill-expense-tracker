// All internal logic strictly uses Paise (integers)

const rupeesToPaise = (rupees) => {
    // Ensures two decimal places mathematically without standard floating-point drift
    return Math.round(Number(rupees) * 100);
};

const paiseToRupees = (paise) => {
    return (paise / 100).toFixed(2);
};

const calculateEqualSharesPaise = (totalPaise, numParticipants) => {
    if (numParticipants === 0) return { baseShare: 0, remainder: 0 };
    
    const baseShare = Math.floor(totalPaise / numParticipants);
    const remainder = totalPaise % numParticipants; // The leftover paise that couldn't be evenly divided
    
    return {
        baseShare,
        remainder
    };
};

module.exports = {
    rupeesToPaise,
    paiseToRupees,
    calculateEqualSharesPaise
};
