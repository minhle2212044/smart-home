const ConfigDefault = {
    PAGINATION: {
        DEFAULT_PAGE: 3, // Default page number
        DEFAULT_LIMIT: 3, // Default number of records per page
        MAX_LIMIT: 10, // Maximum limit to prevent overloading the database
    },
};

module.exports = ConfigDefault;