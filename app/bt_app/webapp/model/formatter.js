sap.ui.define([], function () {
    "use strict";

    return {
        priorityState: function (priority) {
            switch (priority) {
                case "Critical":
                    return "Error";
                case "High":
                    return "Warning";
                case "Medium":
                    return "Information";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        statusState: function (status) {
            switch (status) {
                case "Open":
                    return "Warning";
                case "In Progress":
                    return "Information";
                case "Resolved":
                    return "Success";
                case "Reopened":
                    return "Error";
                default:
                    return "None";
            }
        }
    };
});