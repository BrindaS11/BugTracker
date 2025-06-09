sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/odata/v4/ODataModel"
], function (UIComponent, ODataModel) {
    "use strict";

    return UIComponent.extend("com.sap.btapp.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Enable routing
            this.getRouter().initialize();

            // Set the OData V4 model with server-side operation mode
            const oModel = new ODataModel({
                serviceUrl: "/odata/v4/bug/",
                synchronizationMode: "None",
                operationMode: "Server" // Enable server-side filtering and sorting
            });
            this.setModel(oModel);
        }
    });
});